import { modifier_intelect_magic_resist } from '../../modifiers/global/intelect_magic_resist';
import { PlayerHelper } from '../helper/player-helper';
import { PerfProfiler } from './perf-profiler';
import { findAllUnits, PerfSampler } from './perf-sampler';

export interface PerfAutoConfig {
  phaseSeconds: number;
  reps: number;
  warmupMinutes: number;
  timescale: number;
  // 测量时的加速倍率：服务器跑不满这个倍率时，实际达到的 tick 率就是它的处理能力，条件间的差值可以直接折算成每 tick 毫秒数
  measureTimescale: number;
  quitOnDone: boolean;
  mode: 'steps' | 'soak';
  // 多局测试时由启动脚本逐局递增，保证各局的步骤名不重复，便于合并汇总
  repStart: number;
  // 不可还原的步骤只在第一局跑一次
  includeTail: boolean;
  // 逗号分隔的条件名，只复测其中几项时用；all 为全部
  conditions?: string;
  soakMinutes: number;
  soakTimescale: number;
}

interface PerfStep {
  name: string;
  // 对照组：汇总时拿本段和它比，破坏性的步骤只能和上一段比
  ref: string;
  profile?: boolean;
  // 段内快速交替开关原生 bot，开和关面对同一场交战，排除「关了就打得少」的影响
  flip?: boolean;
  timescale?: number;
  setup?: () => void;
  teardown?: () => void;
}

// 条件切换后等单位行为稳定下来再开始计数
const SETTLE_SECONDS = 5;
const EARLY_SECONDS = 30;
const REALTIME_SECONDS = 120;
const PROPERTY_MODIFIER_PREFIX = 'modifier_player_property_';

// 由 `npm run perf` 在编译产物目录临时写入，平时不存在，正常开发不会进入自动测试
function loadConfig(): PerfAutoConfig | undefined {
  if (!IsInToolsMode()) return undefined;
  const requireFn = (_G as unknown as { require: (this: void, name: string) => unknown }).require;
  const [ok, result] = pcall(requireFn, 'perf_auto_config');
  return ok ? (result as PerfAutoConfig) : undefined;
}

function forEachHero(callback: (hero: CDOTA_BaseNPC_Hero, playerId: PlayerID) => void) {
  PlayerHelper.ForEachPlayer((playerId) => {
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (hero) callback(hero, playerId);
  });
}

export function clearUnits() {
  let removed = 0;
  for (const unit of findAllUnits(UnitTargetType.BASIC)) {
    if (unit.IsHero() || unit.IsBuilding() || unit.IsCourier()) continue;
    if (!unit.IsCreep() && !unit.IsNeutralUnitType() && !unit.IsSummoned()) continue;
    UTIL_Remove(unit);
    removed++;
  }
  print(`[perf] clearunits removed=${removed}`);
}

// 两队各刷一半在中路两侧，让它们互相交战，比静止的单位更接近团战时的负载
export function spawnUnits(count: number) {
  const half = Math.floor(count / 2);
  const sides: [DotaTeam, string, Vector][] = [
    [DotaTeam.GOODGUYS, 'npc_dota_creep_goodguys_melee', Vector(-600, -600, 0)],
    [DotaTeam.BADGUYS, 'npc_dota_creep_badguys_melee', Vector(600, 600, 0)],
  ];
  for (const [team, unitName, center] of sides) {
    for (let i = 0; i < half; i++) {
      CreateUnitByName(unitName, center, true, undefined, undefined, team);
    }
  }
  print(`[perf] spawnunits count=${half * 2}`);
}

function removePropertyModifiers() {
  forEachHero((hero) => {
    for (const modifier of hero.FindAllModifiers()) {
      if (modifier.GetName().startsWith(PROPERTY_MODIFIER_PREFIX)) modifier.Destroy();
    }
  });
}

interface StashedInventory {
  hero: CDOTA_BaseNPC_Hero;
  playerId: PlayerID;
  items: [InventorySlot, string][];
  gold: number;
}

let stashedInventories: StashedInventory[] = [];

// 清空金钱，否则 bot 会在测量期间把装备买回来
function stashItems(itemName?: string) {
  stashedInventories = [];
  let removed = 0;
  forEachHero((hero, playerId) => {
    const items: [InventorySlot, string][] = [];
    for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.NEUTRAL_PASSIVE_SLOT; slot++) {
      const item = hero.GetItemInSlot(slot);
      if (!item || (itemName && item.GetName() !== itemName)) continue;
      items.push([slot, item.GetName()]);
      UTIL_RemoveImmediate(item);
      removed++;
    }
    stashedInventories.push({ hero, playerId, items, gold: PlayerResource.GetGold(playerId) });
    PlayerResource.SetGold(playerId, 0, true);
    PlayerResource.SetGold(playerId, 0, false);
  });
  // 单件物品的影响要结合持有数量看，持有的人少时效果自然小
  print(`[perf] stash item=${itemName ?? 'all'} removed=${removed}`);
}

// 归因里排名靠前的物品，逐件移除量出各自对帧时间的影响
const SUSPECT_ITEMS = ['item_sacred_six_vein', 'item_swift_glove', 'item_time_gem'];

// 按原格子放回，冷却与充能会重置，对测量没有影响
function restoreItems() {
  for (const { hero, playerId, items, gold } of stashedInventories) {
    if (!IsValidEntity(hero)) continue;
    for (const [slot, name] of items) {
      const item = hero.AddItemByName(name);
      if (item && item.GetItemSlot() !== slot) hero.SwapItems(item.GetItemSlot(), slot);
    }
    PlayerResource.SetGold(playerId, gold, false);
  }
  stashedInventories = [];
}

// 幻象也会复制这个 modifier，移除要覆盖全部单位；放回只给真身，幻象寿命短，新生成的会自己带上
function removeMagicResist() {
  for (const unit of findAllUnits(UnitTargetType.HERO)) {
    unit.RemoveModifierByName(modifier_intelect_magic_resist.name);
  }
}

function restoreMagicResist() {
  forEachHero((hero) => {
    if (!hero.HasModifier(modifier_intelect_magic_resist.name)) {
      hero.AddNewModifier(hero, undefined, modifier_intelect_magic_resist.name, {});
    }
  });
}

function setBotThinking(enabled: boolean) {
  GameRules.GetGameModeEntity().SetBotThinkingEnabled(enabled);
}

type Condition = Omit<PerfStep, 'name' | 'ref'> & { name: string };

const CONDITIONS: Condition[] = [
  { name: 'profile', profile: true },
  {
    name: 'botoff',
    setup: () => setBotThinking(false),
    teardown: () => setBotThinking(true),
  },
  {
    name: 'aioff',
    setup: () => (PerfSampler.aiThinkDisabled = true),
    teardown: () => (PerfSampler.aiThinkDisabled = false),
  },
  {
    name: 'alloff',
    setup: () => {
      setBotThinking(false);
      PerfSampler.aiThinkDisabled = true;
    },
    teardown: () => {
      setBotThinking(true);
      PerfSampler.aiThinkDisabled = false;
    },
  },
  { name: 'botflip', flip: true, teardown: () => setBotThinking(true) },
  { name: 'spawn200', setup: () => spawnUnits(200) },
  { name: 'noitems', setup: () => stashItems(), teardown: restoreItems },
  ...SUSPECT_ITEMS.map((itemName) => ({
    name: `no_${itemName}`,
    setup: () => stashItems(itemName),
    teardown: restoreItems,
  })),
  { name: 'nomagicres', setup: removeMagicResist, teardown: restoreMagicResist },
  // 暂停时画面照常渲染、游戏逻辑停止，和基线的帧时间差就是随游戏运行产生的每帧开销
  { name: 'paused', setup: () => PauseGame(true), teardown: () => PauseGame(false) },
];

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = RandomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 同一局里东西只建不清会越跑越慢，每个条件前后都夹一段基线、和两者均值比，并逐轮打乱顺序，抵消这种漂移
function buildSteps(
  conditions: Condition[],
  reps: number,
  repStart: number,
  includeTail: boolean,
): PerfStep[] {
  const steps: PerfStep[] = [];
  let baselineIndex = 0;
  const nextBaseline = (rep: number) => `baseline#${rep}.${++baselineIndex}`;
  for (let rep = repStart; rep < repStart + reps; rep++) {
    let before = nextBaseline(rep);
    steps.push({ name: before, ref: before });
    for (const condition of shuffled(conditions)) {
      const after = nextBaseline(rep);
      steps.push({ ...condition, name: `${condition.name}#${rep}`, ref: `${before},${after}` });
      steps.push({ name: after, ref: after });
      before = after;
    }
  }
  if (!includeTail) return steps;
  // 以下几步移除后无法还原，只跑一次，逐段叠加，各自和上一段比
  steps.push(
    { name: 'final', ref: 'final' },
    { name: 'noproperty', ref: 'final', setup: removePropertyModifiers },
    { name: 'clearunits', ref: 'noproperty', setup: clearUnits },
  );
  return steps;
}

/**
 * 性能自动测试：按控制变量逐段切换条件并采样，全程输出到控制台，供汇总脚本生成对照表。
 */
export class PerfAuto {
  static readonly config = loadConfig();
  private static running = false;

  static onGameInProgress() {
    const config = this.config;
    if (!config) return;
    // 玩家英雄也交给 AI，场上才是 20 个行为一致的英雄
    forEachHero((hero, playerId) => {
      if (PlayerHelper.IsHumanPlayerByPlayerId(playerId)) GameRules.AI.EnableAI(hero);
    });
    // 结算阶段计时器可能不再推进，轮询发现不了游戏结束，直接听状态切换
    ListenToGameEvent(
      'game_rules_state_change',
      () => {
        if (GameRules.State_Get() === GameState.POST_GAME) this.finish(true, config.quitOnDone);
      },
      undefined,
    );
    PerfSampler.start();
    // 实测开局后客户端界面的定时回调不触发、暂停恢复一次后才正常，客户端帧数据依赖它
    PauseGame(true);
    afterRealSeconds(1, () => PauseGame(false));
    PerfSampler.setPhase('early');
    Timers.CreateTimer(EARLY_SECONDS, () => {
      if (config.mode === 'soak') {
        this.soak(config);
        return;
      }
      PerfSampler.setPhase('warmup');
      SendToServerConsole(`host_timescale ${config.timescale}`);
      Timers.CreateTimer(5, (): number | undefined => {
        if (GameRules.GetDOTATime(false, false) < config.warmupMinutes * 60) return 5;
        this.run(config);
        return undefined;
      });
    });
  }

  // 浸泡测试：不切换任何条件一直跑到指定分钟，看每 tick 耗时和泄漏指标随游戏时间的变化
  private static soak(config: PerfAutoConfig) {
    PerfSampler.setPhase('soak');
    SendToServerConsole(`host_timescale ${config.soakTimescale}`);
    Timers.CreateTimer(5, (): number | undefined => {
      const gameOver = GameRules.State_Get() >= GameState.POST_GAME;
      if (!gameOver && GameRules.GetDOTATime(false, false) < config.soakMinutes * 60) return 5;
      if (gameOver) {
        this.finish(gameOver, config.quitOnDone);
        return undefined;
      }
      // 加速时画面开销被摊到多个 tick 上看不出来，终点再按 1 倍速测一段玩家实际感受
      PerfSampler.setPhase('realtime');
      SendToServerConsole('host_timescale 1');
      Timers.CreateTimer(REALTIME_SECONDS, () => this.finish(false, config.quitOnDone));
      return undefined;
    });
  }

  private static finished = false;

  private static finish(gameOver: boolean, quitOnDone: boolean) {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    SendToServerConsole('host_timescale 1');
    PerfSampler.setPhase('done');
    print(gameOver ? `[perf-auto] aborted reason=game_over` : `[perf-auto] done`);
    // 结算阶段按游戏时间计的计时器可能不触发，退出不能依赖它
    if (quitOnDone) SendToServerConsole('quit');
  }

  static run(
    config: Pick<
      PerfAutoConfig,
      | 'phaseSeconds'
      | 'reps'
      | 'measureTimescale'
      | 'quitOnDone'
      | 'repStart'
      | 'includeTail'
      | 'conditions'
    >,
  ) {
    if (this.running) return;
    this.running = true;
    PerfSampler.start();
    const wanted =
      config.conditions && config.conditions !== 'all' ? config.conditions.split(',') : undefined;
    const conditions = wanted ? CONDITIONS.filter((c) => wanted.includes(c.name)) : CONDITIONS;
    const steps = buildSteps(conditions, config.reps, config.repStart, config.includeTail);
    print(
      `[perf-auto] begin phaseSeconds=${config.phaseSeconds} reps=${config.reps} measureTimescale=${config.measureTimescale} steps=${steps.length}`,
    );
    this.runStep(steps, 0, config);
  }

  private static runStep(
    steps: PerfStep[],
    index: number,
    config: Pick<PerfAutoConfig, 'phaseSeconds' | 'measureTimescale' | 'quitOnDone'>,
  ) {
    const step = steps[index];
    const gameOver = GameRules.State_Get() >= GameState.POST_GAME;
    if (!step || gameOver) {
      this.finish(gameOver, config.quitOnDone);
      return;
    }
    const timescale = step.timescale ?? config.measureTimescale;
    SendToServerConsole(`host_timescale ${timescale}`);
    step.setup?.();
    PerfSampler.setPhase(`settle`);
    // 按真实时间计时：服务器跟不上时游戏时间会变慢，暂停时游戏时间不走，都会让各段长短不一
    afterRealSeconds(SETTLE_SECONDS, () => {
      print(`[perf-auto] step name=${step.name} ref=${step.ref} timescale=${timescale}`);
      const next = () => {
        step.teardown?.();
        this.runStep(steps, index + 1, config);
      };
      if (step.flip) {
        runFlipSlices(step.name.split('#')[1], 0, next);
        return;
      }
      PerfSampler.setPhase(step.name);
      if (step.profile) PerfProfiler.start();
      afterRealSeconds(config.phaseSeconds, () => {
        if (step.profile) PerfProfiler.stop(step.name);
        next();
      });
    });
  }
}

// 片要短到一场团战打不完，开和关才面对同一批交战；开头一秒原生 bot 重新规划，不计入
const FLIP_SLICES = 20;
const FLIP_SETTLE_SECONDS = 1;
const FLIP_MEASURE_SECONDS = 5;
const FIGHT_SAMPLE_SECONDS = 0.5;

// 正在攻击或施法的英雄数，衡量这一片打得多不多
function countFightingHeroes(): number {
  let fighting = 0;
  forEachHero((hero) => {
    if (!hero.IsAlive()) return;
    if (hero.IsAttacking() || hero.GetCurrentActiveAbility() || hero.IsChanneling()) fighting++;
  });
  return fighting;
}

function runFlipSlices(rep: string, index: number, done: () => void) {
  if (index >= FLIP_SLICES || GameRules.State_Get() >= GameState.POST_GAME) {
    done();
    return;
  }
  const botOn = index % 2 === 1;
  const name = `botflip_${botOn ? 'on' : 'off'}#${rep}.${index}`;
  setBotThinking(botOn);
  PerfSampler.setPhase('settle');
  afterRealSeconds(FLIP_SETTLE_SECONDS, () => {
    PerfSampler.setPhase(name);
    let samples = 0;
    let fighting = 0;
    const sampleCount = FLIP_MEASURE_SECONDS / FIGHT_SAMPLE_SECONDS;
    const sample = () => {
      fighting += countFightingHeroes();
      samples++;
      if (samples < sampleCount) {
        afterRealSeconds(FIGHT_SAMPLE_SECONDS, sample);
        return;
      }
      print(`[perf] slice name=${name} fighting=${string.format('%.1f', fighting / samples)}`);
      runFlipSlices(rep, index + 1, done);
    };
    afterRealSeconds(FIGHT_SAMPLE_SECONDS, sample);
  });
}

function afterRealSeconds(seconds: number, callback: () => void) {
  Timers.CreateTimer({
    endTime: seconds,
    useGameTime: false,
    callback: () => {
      callback();
    },
  });
}
