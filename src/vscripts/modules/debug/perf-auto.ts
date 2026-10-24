import { HeroUtil } from '../../ai/hero/hero-util';
import { modifier_intelect_magic_resist } from '../../modifiers/global/intelect_magic_resist';
import {
  property_aoe_bonus_constant_stacking,
  property_attack_range_bonus,
  property_cast_range_bonus_stacking,
  property_health_regen_percentage,
  property_ignore_movespeed_limit,
  property_incoming_damage_percentage,
  property_lifesteal,
  property_mana_regen_total_percentage,
  property_slow_immune,
  property_spell_amplify_percentage,
  property_spell_lifesteal,
  property_status_resistance_stacking,
} from '../../modifiers/property/property_declare';
import { GameConfig } from '../GameConfig';
import { ModifierHelper } from '../helper/modifier-helper';
import { PlayerHelper } from '../helper/player-helper';
import { PropertyController } from '../property/property_controller';
import { BotPick } from '../../ai/bot-pick/bot-pick';
import { PerfProfiler } from './perf-profiler';
import { PERF_CONFIG } from './perf-config';
import { modifier_perf_melee_stack } from './perf-melee-stack';
import { modifier_perf_empty, modifier_perf_takedamage } from './perf-building-modifier';
import { PerfSampler } from './perf-sampler';
import { findAllUnits } from '../helper/unit-helper';

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
  // 开局把所有英雄拉到满级并给足金钱，低倍速热身几分钟就是后期局面
  boost: boolean;
  // 0 为沿用对局选项
  maxLevel: number;
  // 工具模式下 bot 英雄按池子顺序固定选取，偏移后可以让多次测试覆盖池子里的其他英雄
  botOffset: number;
  // 天辉人数与金钱经验倍率，模拟少量玩家对满编 bot 的真实对局；0 为沿用对局选项
  radiantPlayers: number;
  radiantMultiplier: number;
  // 只把天辉拉到满级并给足金钱，模拟压制电脑的强势玩家
  radiantBoost?: boolean;
  // 夜魇金钱经验倍率，调低后天辉能压着电脑推，用来验证电脑回防；0 为沿用对局选项
  direMultiplier?: number;
  // 防御塔强度百分比，按难度预设测真实局面；0 为沿用对局选项
  towerPower?: number;
  // 逗号分隔的英雄名（不带 npc_dota_hero_ 前缀），排到 bot 英雄池最前面，用于让指定英雄出场验证
  botHeroes: string;
  // 逗号分隔的物品名，开局轮流发给每个英雄并停掉 bot 买卖装备，用于验证物品施放
  testItems?: string;
  // 逗号分隔的场景，同一局里按顺序各跑一遍全部条件：idle 全员停在泉水、不出兵，只剩属性与常驻逻辑的开销；
  // fight 只开自定义 AI 打团。为空时沿用热身到后期再测的旧流程
  scenes?: string;
  // 逗号分隔的威压层数，每个层数一个条件，看开销是否随层数线性增长
  buffStacks?: string;
  // 逗号分隔的物品名，每件一个条件：全员第 6 格换成该物品，和发的原版物品比
  swapItems?: string;
  itemModifiers?: string;
  // 逗号分隔的银月个数，每个个数一个条件
  moonStacks?: string;
  // 逗号分隔的 modifier 名，换装与挂 modifier 的段末统计全场实例数
  countModifiers?: string;
  // 每段末统计全场 modifier 与实体，找随时间累积的东西
  census?: boolean;
  benchAttackers?: number;
  // 伤害基准里两队隔开的距离，0 为各回泉水
  benchGap?: number;
  // 换装与挂 modifier 只给伤害基准的出手方（attacker）或挨打方（victim），为空时全员；拆开看开销算在哪一方
  benchSide?: string;
}

interface PerfStep {
  name: string;
  scene?: string;
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
// 从泉水走到交战位置并打起来要一段时间
const FIGHT_SETTLE_SECONDS = 60;
const EARLY_SECONDS = 30;
const REALTIME_SECONDS = 120;
const PROPERTY_MODIFIER_PREFIX = 'modifier_player_property_';
// 足够升到 50 级
const BOOST_XP = 250000;

// 选英雄早于自动测试启动，只能在模块加载时调整英雄池顺序
const bootConfig = PERF_CONFIG;
if (bootConfig && bootConfig.botOffset > 0) {
  const pool = BotPick.HeroPool;
  const offset = bootConfig.botOffset % pool.length;
  BotPick.HeroPool = [...pool.slice(offset), ...pool.slice(0, offset)];
  print(`[perf-auto] botOffset=${offset} first=${BotPick.HeroPool[0].name}`);
}

if (bootConfig && bootConfig.botHeroes !== '') {
  const wanted = bootConfig.botHeroes.split(',').map((name) => `npc_dota_hero_${name}`);
  const rest = BotPick.HeroPool.filter((hero) => !wanted.includes(hero.name));
  const wantedHeroes = wanted.map(
    (name) => BotPick.HeroPool.find((hero) => hero.name === name) ?? { name, roles: [] },
  );
  BotPick.HeroPool = [...wantedHeroes, ...rest];
  print(`[perf-auto] botHeroes=${bootConfig.botHeroes}`);
}

// 界面在选英雄阶段仍会重新下发对局选项，只有在补 bot 的前一刻覆盖才不会被冲掉
if (
  bootConfig &&
  (bootConfig.radiantPlayers > 0 ||
    bootConfig.radiantMultiplier > 0 ||
    (bootConfig.direMultiplier ?? 0) > 0 ||
    (bootConfig.towerPower ?? 0) > 0)
) {
  const config = bootConfig;
  const originalPickBotHeroes = BotPick.PickBotHeroes;
  BotPick.PickBotHeroes = function (this: typeof BotPick) {
    if (config.radiantPlayers > 0) GameRules.Option.radiantPlayerNumber = config.radiantPlayers;
    if (config.radiantMultiplier > 0) {
      GameRules.Option.radiantGoldXpMultiplier = config.radiantMultiplier;
    }
    if ((config.direMultiplier ?? 0) > 0) {
      GameRules.Option.direGoldXpMultiplier = config.direMultiplier as number;
    }
    if ((config.towerPower ?? 0) > 0) GameRules.Option.towerPower = config.towerPower as number;
    print(
      `[perf-auto] radiantPlayers=${GameRules.Option.radiantPlayerNumber} radiantMultiplier=${GameRules.Option.radiantGoldXpMultiplier}` +
        ` direMultiplier=${GameRules.Option.direGoldXpMultiplier} towerPower=${GameRules.Option.towerPower}`,
    );
    originalPickBotHeroes.call(this);
  };
}

function forEachHero(callback: (hero: CDOTA_BaseNPC_Hero, playerId: PlayerID) => void) {
  PlayerHelper.ForEachPlayer((playerId) => {
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (hero) callback(hero, playerId);
  });
}

// 满级等级决定每级经验表，只能在策略阶段生成经验表之前覆盖
if (bootConfig && bootConfig.maxLevel > 0) {
  const maxLevel = bootConfig.maxLevel;
  const originalSetXP = GameConfig.SetMaxLevelXPRequire;
  GameConfig.SetMaxLevelXPRequire = function (this: typeof GameConfig) {
    GameRules.Option.maxLevel = maxLevel;
    originalSetXP.call(this);
  };
}

// 经验溢出由引擎截到满级；避开开局暂停的那一秒
function boostHeroes(team?: DotaTeam, withGold = true) {
  afterRealSeconds(2, () =>
    forEachHero((hero) => {
      if (team !== undefined && hero.GetTeamNumber() !== team) return;
      if (withGold) hero.ModifyGold(99999, false, ModifyGoldReason.UNSPECIFIED);
      hero.AddExperience(BOOST_XP, ModifyXpReason.UNSPECIFIED, false, false, 0);
    }),
  );
}

// 满级开局几分钟就会推平一方基地，测不到后期；用原版无敌，不额外挂 Lua modifier
function lockForts() {
  for (const fort of Entities.FindAllByClassname('npc_dota_fort') as CDOTA_BaseNPC[]) {
    fort.AddNewModifier(fort, undefined, 'modifier_invulnerable', {});
  }
}

// 每个建筑各挂 1 份：同一单位叠多份同名 modifier 时开销偏高，分散挂才是常驻 Lua modifier 的真实单价；空壳与受伤监听两档分开看
const BUILDING_CLASSES = [
  'npc_dota_tower',
  'npc_dota_barracks',
  'npc_dota_healer',
  'npc_dota_fort',
];

function findBuildings(): CDOTA_BaseNPC[] {
  return BUILDING_CLASSES.flatMap(
    (className) => Entities.FindAllByClassname(className) as CDOTA_BaseNPC[],
  ).filter((building) => building.IsAlive());
}

const BUILDING_MODIFIERS: Record<string, string> = {
  empty: modifier_perf_empty.name,
  takedamage: modifier_perf_takedamage.name,
};

function addBuildingModifiers(modifierName: string) {
  const buildings = findBuildings();
  for (const building of buildings) {
    building.AddNewModifier(building, undefined, modifierName, {});
  }
  print(`[perf] building modifiers name=${modifierName} buildings=${buildings.length}`);
}

function removeBuildingModifiers(modifierName: string) {
  for (const building of findBuildings()) {
    building.RemoveAllModifiersOfName(modifierName);
  }
}

// 电脑开局随机抽的两个被动每局不同，各局的属性查询频率因此不一：开局先去掉，再作为条件按原等级加回来单独量
let botPassives: [CDOTA_BaseNPC_Hero, string, number][] = [];

function stripBotPassives() {
  let removed = 0;
  for (const [hero, name] of botPassives) {
    const ability = hero.FindAbilityByName(name);
    if (!ability) continue;
    for (const modifier of hero.FindAllModifiers()) {
      if (modifier.GetAbility() === ability) modifier.Destroy();
    }
    hero.RemoveAbilityByHandle(ability);
    removed++;
  }
  print(`[perf-auto] bot passives removed=${removed}`);
}

function removeBotPassives() {
  botPassives = [];
  forEachHero((hero, playerId) => {
    const record = CustomNetTables.GetTableValue('bot_passive_abilities', playerId.toString());
    if (!record) return;
    for (const name of [record.passiveAbilityName1, record.passiveAbilityName2]) {
      const ability = hero.FindAbilityByName(name);
      if (ability) botPassives.push([hero, name, ability.GetLevel()]);
    }
  });
  stripBotPassives();
}

function restoreBotPassives() {
  let added = 0;
  for (const [hero, name, level] of botPassives) {
    if (!IsValidEntity(hero) || hero.HasAbility(name)) continue;
    hero.AddAbility(name).SetLevel(level);
    added++;
  }
  print(`[perf] bot passives added=${added}`);
}

// 物品名写成它表示这一格留空：底装空出换装格，测试物品放进去的差值就是它的完整开销
const EMPTY_SLOT = 'empty';

// 每人拿满主物品栏，轮流错开起点，让每件物品落在不同英雄身上
function grantTestItems(list: string) {
  const items = list.split(',');
  let next = 0;
  afterRealSeconds(3, () =>
    forEachHero((hero) => {
      for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_9; slot++) {
        const item = hero.GetItemInSlot(slot);
        if (item) UTIL_Remove(item);
      }
      for (let i = 0; i < 6; i++) {
        const name = items[next % items.length];
        if (name !== EMPTY_SLOT) hero.AddItemByName(name);
        next++;
      }
    }),
  );
  print(`[perf-auto] testItems=${list}`);
}

// 自定义 AI 见到测试物品就不买卖，原版 bot 只要有钱就会买，钱一直清零才能保证测量期间装备不变
function freezeGold() {
  Timers.CreateTimer({
    endTime: 1,
    useGameTime: false,
    callback: () => {
      PlayerHelper.ForEachPlayer((playerId) => {
        PlayerResource.SetGold(playerId, 0, true);
        PlayerResource.SetGold(playerId, 0, false);
      });
      return 1;
    },
  });
}

export function clearUnits(keepNeutrals = false) {
  let removed = 0;
  for (const unit of findAllUnits(UnitTargetType.BASIC)) {
    if (unit.IsHero() || unit.IsBuilding() || unit.IsCourier()) continue;
    if (keepNeutrals && unit.IsNeutralUnitType()) continue;
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

const MELEE_RESISTANCE_MODIFIER = 'modifier_global_melee_resistance';
let meleeBuffs: CDOTA_Buff[] = [];
let meleeBuffHeroes: CDOTA_BaseNPC_Hero[] = [];
let meleeBuffCalls = 0;
let meleeBuffStart = 0;

// 威压平时只给近战玩家，这里给全员挂上，状态抗性那一半按层数叠加放大开销；回调次数说明引擎多久查一次这个属性
function addMeleeBuff(stacks: number) {
  meleeBuffs = [];
  meleeBuffHeroes = [];
  meleeBuffCalls = 0;
  meleeBuffStart = Plat_FloatTime();
  forEachHero((hero) => {
    if (!hero.HasModifier(MELEE_RESISTANCE_MODIFIER)) {
      ModifierHelper.applyGlobalModifier(hero, MELEE_RESISTANCE_MODIFIER);
      meleeBuffHeroes.push(hero);
    }
    for (let i = 0; i < stacks; i++) {
      const modifier = hero.AddNewModifier(hero, undefined, modifier_perf_melee_stack.name, {}) as
        | modifier_perf_melee_stack
        | undefined;
      if (!modifier) continue;
      // 方法在注册时已复制到全局表，计数只能覆盖在实例上
      const original = modifier.GetModifierStatusResistanceStacking;
      modifier.GetModifierStatusResistanceStacking = function (this: typeof modifier) {
        meleeBuffCalls++;
        return original.call(this);
      };
      meleeBuffs.push(modifier);
    }
  });
}

function removeMeleeBuff() {
  for (const modifier of meleeBuffs) {
    if (!modifier.IsNull()) modifier.Destroy();
  }
  for (const hero of meleeBuffHeroes) {
    if (IsValidEntity(hero)) hero.RemoveModifierByName(MELEE_RESISTANCE_MODIFIER);
  }
  const seconds = Plat_FloatTime() - meleeBuffStart;
  print(
    `[perf] meleebuff instances=${meleeBuffs.length} calls_per_sec=${string.format('%.1f', meleeBuffCalls / seconds)}`,
  );
  meleeBuffs = [];
  meleeBuffHeroes = [];
}

// 金钱清零前的空档里辅助 bot 仍会买到守卫，落进空着的换装格，每段开始前收走
function clearWards(hero: CDOTA_BaseNPC_Hero) {
  for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_9; slot++) {
    const item = hero.GetItemInSlot(slot);
    if (item?.GetName() === 'item_ward_observer') UTIL_Remove(item);
  }
}

// 停掉自定义 AI、不再出兵并清掉兵线，全员复活后拉回各自泉水。
// 野怪整分钟才刷新，清掉会让各段单位数忽多忽少，留在营地里不动反而稳定
// 泉水两队相隔太远，敌方光环够不到；隔开固定距离对排时光环能覆盖对面，又在自动索敌范围外不会互打
function parkSpot(hero: CDOTA_BaseNPC_Hero, index: Record<number, number>): Vector | undefined {
  const team = hero.GetTeamNumber();
  const gap = PERF_CONFIG?.benchGap ?? 0;
  if (gap <= 0) return HeroUtil.GetTeamFountainPosition(team);
  const half = gap / 2 / math.sqrt(2);
  const center = team === DotaTeam.GOODGUYS ? Vector(-half, -half, 0) : Vector(half, half, 0);
  const slot = (index[team] ?? 0) - 4.5;
  index[team] = (index[team] ?? 0) + 1;
  return center.__add(Vector(slot * FIGHT_SPACING, -slot * FIGHT_SPACING, 0));
}

function parkHeroes() {
  const index: Record<number, number> = {};
  respawnInPlace = false;
  PerfSampler.aiThinkDisabled = true;
  SendToServerConsole('dota_creeps_no_spawning 1');
  clearUnits(true);
  forEachHero((hero) => {
    if (!hero.IsAlive()) hero.RespawnHero(false, false);
    clearWards(hero);
    const spot = parkSpot(hero, index);
    if (spot) FindClearSpaceForUnit(hero, spot, true);
    hero.Stop();
  });
  print(`[perf-auto] idle parked gap=${PERF_CONFIG?.benchGap ?? 0}`);
}

// 打团里交战量随局势起伏，几 ms 的差异被淹没；固定频率互相造成伤害，只量伤害事件链路本身的开销。
// 真普攻版本走完整攻击结算，普攻命中类事件与攻击触发才会被调用
const BENCH_DAMAGE = 100;
// 高频小额伤害：模拟持续伤害每跳，一帧多次、每次伤害很低
const DOT_HITS = 5;
type BenchMode = 'damage' | 'attack' | 'dot' | 'dotbig' | 'spell';
const BENCH_SCENES: Record<string, BenchMode> = {
  dmgbench: 'damage',
  atkbench: 'attack',
  spellbench: 'spell',
  dotbench: 'dot',
  dotbigbench: 'dotbig',
};
let benchActive = false;
let benchTicking = false;

function benchTarget(heroes: CDOTA_BaseNPC_Hero[], index: number) {
  const team = heroes[index].GetTeamNumber();
  return (
    heroes.find((hero, offset) => offset > index && hero.GetTeamNumber() !== team) ??
    heroes.find((hero) => hero.GetTeamNumber() !== team)
  );
}

// 挨打方是全员出手时被选中的目标，出手方是其余英雄；挨打方自己也出手，归入挨打方
function forEachSideHero(callback: (hero: CDOTA_BaseNPC_Hero) => void) {
  const side = PERF_CONFIG?.benchSide ?? '';
  const heroes: CDOTA_BaseNPC_Hero[] = [];
  forEachHero((hero) => heroes.push(hero));
  const victims = new Set(heroes.map((_, index) => benchTarget(heroes, index)));
  for (const hero of heroes) {
    if (side === 'victim' && !victims.has(hero)) continue;
    if (side === 'attacker' && victims.has(hero)) continue;
    callback(hero);
  }
}
let benchMode: BenchMode = 'damage';

function startDamageBench(mode: BenchMode) {
  benchActive = true;
  benchMode = mode;
  if (benchTicking) return;
  benchTicking = true;
  let magical = false;
  Timers.CreateTimer(0, () => {
    if (!benchActive) {
      benchTicking = false;
      return undefined;
    }
    // 纯技能场景只打带技能来源的魔法伤害，技能增强、法术暴击这类只对技能生效的逻辑才会每次都走到
    magical = benchMode === 'spell' || !magical;
    const heroes: CDOTA_BaseNPC_Hero[] = [];
    forEachHero((hero) => heroes.push(hero));
    const limit = PERF_CONFIG?.benchAttackers ?? 0;
    const attackers = limit > 0 ? limit : heroes.length;
    heroes.forEach((attacker, index) => {
      if (index >= attackers) return;
      const target = benchTarget(heroes, index);
      if (!target || !attacker.IsAlive() || !target.IsAlive()) return;
      target.SetHealth(target.GetMaxHealth());
      if (benchMode === 'attack') {
        attacker.PerformAttack(target, true, true, true, true, false, false, true);
        return;
      }
      if (benchMode === 'dot' || benchMode === 'dotbig') {
        // 低于与高于分发门槛各一档，看门槛挡掉了多少
        const damage = benchMode === 'dot' ? 15 : 50;
        for (let hit = 0; hit < DOT_HITS; hit++) {
          ApplyDamage({
            victim: target,
            attacker,
            damage,
            damage_type: DamageTypes.MAGICAL,
            ability: attacker.GetAbilityByIndex(0),
          });
        }
        return;
      }
      ApplyDamage({
        victim: target,
        attacker,
        damage: BENCH_DAMAGE,
        damage_type: magical ? DamageTypes.MAGICAL : DamageTypes.PHYSICAL,
        ability: magical ? attacker.GetAbilityByIndex(0) : undefined,
      });
    });
    return FrameTime();
  });
  print(`[perf-auto] damage bench started mode=${mode} realAttack=${mode === 'attack'}`);
}

// 两队隔着中路河道对排，每段从同一个站位开打；英雄间距让 10 人排开不挤成一团
const FIGHT_LINE: Record<number, Vector> = {
  [DotaTeam.GOODGUYS]: Vector(-600, -600, 0),
  [DotaTeam.BADGUYS]: Vector(600, 600, 0),
};
const FIGHT_SPACING = 120;

// 自由打团几十秒后会追到高地或散到各路，各段的交战位置、兵线与技能冷却都不同；每段开始前清兵线、回满状态与冷却并拉回固定站位
function stageFight() {
  clearUnits(true);
  const index: Record<number, number> = {};
  forEachHero((hero) => {
    const team = hero.GetTeamNumber();
    const line = FIGHT_LINE[team];
    if (!line) return;
    if (!hero.IsAlive()) hero.RespawnHero(false, false);
    clearWards(hero);
    hero.SetHealth(hero.GetMaxHealth());
    hero.SetMana(hero.GetMaxMana());
    for (let i = 0; i < hero.GetAbilityCount(); i++) hero.GetAbilityByIndex(i)?.EndCooldown();
    for (let itemSlot = InventorySlot.SLOT_1; itemSlot <= InventorySlot.SLOT_6; itemSlot++) {
      hero.GetItemInSlot(itemSlot)?.EndCooldown();
    }
    const slot = (index[team] ?? 0) - 4.5;
    index[team] = (index[team] ?? 0) + 1;
    FindClearSpaceForUnit(
      hero,
      line.__add(Vector(slot * FIGHT_SPACING, -slot * FIGHT_SPACING, 0)),
      true,
    );
    hero.Stop();
  });
  print(`[perf-auto] fight staged`);
}

// 光环在小兵多时的开销：两队小兵面对面排成一条横排，几乎每个都打得到对面；天辉英雄站在己方排后，
// 横排长度控制在光环半径内。全员定时回满、小兵血量放大，兵数不起伏
// 小兵碰撞体积撑开间距才排得成单排；兵数按光环半径能覆盖的长度取
const CREEP_BENCH_COUNT = 24;
const CREEP_BENCH_HEALTH = 1000000;
const CREEP_BENCH_CENTER = Vector(-400, -400, 0);
const CREEP_BENCH_SPACING = 64;
const CREEP_BENCH_ROW_GAP = 60;
const CREEP_BENCH_HERO_BACK = 160;
// 统计光环覆盖：KV 光环与原版光环在小兵身上的 buff
const CREEP_BENCH_AURAS = [
  'modifier_item_vladmir_2_general_aura',
  'modifier_item_vladmir_aura',
  'modifier_item_vladmir_2_enemy_aura',
];
let creepBenchActive = false;
let creepBenchTicking = false;

function printCreepAuraCoverage() {
  const creeps = findAllUnits(UnitTargetType.BASIC).filter(
    (unit) => unit.IsCreep() && !unit.IsNeutralUnitType(),
  );
  const counts = CREEP_BENCH_AURAS.map(
    (name) => `${name}=${creeps.filter((creep) => creep.HasModifier(name)).length}`,
  );
  print(`[perf-auto] creep bench aura creeps=${creeps.length} ${counts.join(' ')}`);
}

function startCreepBench() {
  creepBenchActive = true;
  const along = Vector(1, -1, 0).Normalized();
  const towardDire = Vector(1, 1, 0).Normalized();
  forEachHero((hero) => {
    if (hero.GetTeamNumber() !== DotaTeam.GOODGUYS) return;
    // 玩家英雄没有关掉自动攻击，留在泉水不参与
    if (hero.GetPlayerOwnerID() === 0) return;
    FindClearSpaceForUnit(
      hero,
      CREEP_BENCH_CENTER.__sub(towardDire.__mul(CREEP_BENCH_HERO_BACK)),
      true,
    );
    hero.Stop();
  });
  const sides: [DotaTeam, string, number][] = [
    [DotaTeam.GOODGUYS, 'npc_dota_creep_goodguys_melee', -CREEP_BENCH_ROW_GAP],
    [DotaTeam.BADGUYS, 'npc_dota_creep_badguys_melee', CREEP_BENCH_ROW_GAP],
  ];
  for (const [team, unitName, offset] of sides) {
    for (let i = 0; i < CREEP_BENCH_COUNT; i++) {
      const slot = (i - (CREEP_BENCH_COUNT - 1) / 2) * CREEP_BENCH_SPACING;
      const position = CREEP_BENCH_CENTER.__add(towardDire.__mul(offset)).__add(along.__mul(slot));
      const creep = CreateUnitByName(unitName, position, true, undefined, undefined, team);
      // 英雄攻击力远高于小兵血量，血量放大到打不死，兵数才稳定
      creep.SetBaseMaxHealth(CREEP_BENCH_HEALTH);
      creep.SetMaxHealth(CREEP_BENCH_HEALTH);
      creep.SetHealth(CREEP_BENCH_HEALTH);
    }
  }
  print(`[perf-auto] creep bench started count=${CREEP_BENCH_COUNT * 2}`);
  Timers.CreateTimer(3, () => {
    if (creepBenchActive) printCreepAuraCoverage();
  });
  if (creepBenchTicking) return;
  creepBenchTicking = true;
  Timers.CreateTimer(0.5, () => {
    if (!creepBenchActive) {
      creepBenchTicking = false;
      return undefined;
    }
    for (const unit of findAllUnits(UnitTargetType.HERO + UnitTargetType.BASIC)) {
      if (unit.IsBuilding() || !unit.IsAlive()) continue;
      unit.SetHealth(unit.GetMaxHealth());
    }
    return 0.5;
  });
}

// 打团中阵亡会让场上人数与交战强度在各段之间起伏，原地复活让团战一直持续
let respawnInPlace = false;
const RESPAWN_DELAY = 0.1;

function respawnOnDeath(keys: GameEventProvidedProperties & EntityKilledEvent) {
  if (!respawnInPlace) return;
  const killed = EntIndexToHScript(keys.entindex_killed) as CDOTA_BaseNPC | undefined;
  if (!killed || !killed.IsBaseNPC() || !killed.IsRealHero() || killed.IsReincarnating()) return;
  const hero = killed as CDOTA_BaseNPC_Hero;
  const position = hero.GetAbsOrigin();
  Timers.CreateTimer(RESPAWN_DELAY, () => {
    if (!IsValidEntity(hero) || hero.IsAlive()) return;
    hero.RespawnHero(false, false);
    FindClearSpaceForUnit(hero, position, true);
  });
}

// 原生 bot 保持关闭，等同后期接管后由自定义 AI 打团的局面
function releaseHeroes() {
  respawnInPlace = true;
  PerfSampler.aiThinkDisabled = false;
  SendToServerConsole('dota_creeps_no_spawning 0');
  print(`[perf-auto] fight released`);
}

// 玩家属性里走 Lua 回调的部分，按每级数值乘 8 级挂上；数值大小不影响回调开销
const PROPERTY_LEVELS = 8;
const VALUE_PROPERTIES: [string, number][] = [
  [property_cast_range_bonus_stacking.name, 25],
  [property_spell_amplify_percentage.name, 5],
  [property_status_resistance_stacking.name, 4],
  [property_incoming_damage_percentage.name, -4],
  [property_attack_range_bonus.name, 25],
  [property_health_regen_percentage.name, 0.3],
  [property_mana_regen_total_percentage.name, 0.3],
  [property_ignore_movespeed_limit.name, 0.125],
  [property_slow_immune.name, 0.125],
  [property_aoe_bonus_constant_stacking.name, 15],
];
// 受伤事件对全场每次伤害都回调一次，与只在查属性时回调的分开量
const DAMAGE_EVENT_PROPERTIES: [string, number][] = [
  [property_lifesteal.name, 10],
  [property_spell_lifesteal.name, 8],
];

let addedProperties: CDOTA_Buff[] = [];

// 真实对局只有玩家带属性，这里全员都挂，量到的是上限
function addProperties(properties: [string, number][]) {
  addedProperties = [];
  forEachHero((hero) => {
    for (const [name, perLevel] of properties) {
      const modifier = hero.AddNewModifier(hero, undefined, name, {
        value: perLevel * PROPERTY_LEVELS,
      });
      if (modifier !== undefined) addedProperties.push(modifier);
    }
  });
  print(`[perf] properties added=${addedProperties.length}`);
}

function removeProperties() {
  for (const modifier of addedProperties) {
    if (!modifier.IsNull()) modifier.Destroy();
  }
  addedProperties = [];
}

// 同一组数值属性里走 KV 原生求值的部分，与上面的 Lua 部分对照；会改变行为的飞行、必中不挂
const KV_PROPERTIES = [
  'cooldown_percentage',
  'movespeed_bonus_constant',
  'bonus_vision',
  'evasion_constant',
  'magical_resistance_bonus',
  'physical_armor_bonus',
  'preattack_bonus_damage',
  'attackspeed_bonus_constant',
  'stats_strength_bonus',
  'stats_agility_bonus',
  'stats_intellect_bonus',
].map((name) => `modifier_player_property_${name}_level_${PROPERTY_LEVELS}`);

// 玩家全部数值属性走属性系统自己的加点流程挂上，属性改写法前后用同一条件对比；飞行、必中会改变行为，吸血另有条件
const PLAYER_PROPERTIES = [
  'cast_range_bonus_stacking',
  'spell_amplify_percentage',
  'status_resistance_stacking',
  'incoming_damage_percentage',
  'attack_range_bonus',
  'health_regen_percentage',
  'mana_regen_total_percentage',
  'ignore_movespeed_limit',
  'slow_immune',
  'aoe_bonus_constant_stacking',
  'cooldown_percentage',
  'movespeed_bonus_constant',
  'bonus_vision',
  'evasion_constant',
  'magical_resistance_bonus',
  'physical_armor_bonus',
  'preattack_bonus_damage',
  'attackspeed_bonus_constant',
  'stats_strength_bonus',
  'stats_agility_bonus',
  'stats_intellect_bonus',
];

function playerPropertyModifierNames(name: string): string[] {
  const names = [`property_${name}`];
  for (let level = 1; level <= PROPERTY_LEVELS; level++) {
    names.push(`modifier_player_property_${name}_level_${level}`);
  }
  return names;
}

function addPlayerProperties() {
  let added = 0;
  forEachHero((hero) => {
    for (const name of PLAYER_PROPERTIES) {
      PropertyController.LevelupHeroProperty(hero, {
        name: `property_${name}`,
        level: PROPERTY_LEVELS,
      });
      if (playerPropertyModifierNames(name).some((modifier) => hero.HasModifier(modifier))) added++;
    }
  });
  print(`[perf] player properties added=${added}`);
}

function removePlayerProperties() {
  forEachHero((hero) => {
    for (const name of PLAYER_PROPERTIES) {
      for (const modifier of playerPropertyModifierNames(name)) hero.RemoveModifierByName(modifier);
    }
  });
}

let kvPropertyItem: CDOTA_Item_DataDriven | undefined;

function addKvProperties() {
  kvPropertyItem ??= CreateItem(
    'item_player_modifiers',
    undefined,
    undefined,
  ) as CDOTA_Item_DataDriven;
  let added = 0;
  forEachHero((hero) => {
    for (const name of KV_PROPERTIES) {
      kvPropertyItem!.ApplyDataDrivenModifier(hero, hero, name, { duration: -1 });
      if (hero.HasModifier(name)) added++;
    }
  });
  print(`[perf] kv properties added=${added}`);
}

function removeKvProperties() {
  forEachHero((hero) => {
    for (const name of KV_PROPERTIES) hero.RemoveModifierByName(name);
  });
}

// 机械救赎：电脑高难度自带的纯 KV 属性被动
const BOT_POWER_ABILITY = 'bot_power_n6';
const BOT_POWER_MODIFIER = 'modifier_bot_power';

function removeBotPower() {
  let removed = 0;
  forEachHero((hero) => {
    if (!hero.HasModifier(BOT_POWER_MODIFIER)) return;
    hero.RemoveModifierByName(BOT_POWER_MODIFIER);
    removed++;
  });
  print(`[perf] bot power removed=${removed}`);
}

function restoreBotPower() {
  forEachHero((hero) => {
    const ability = hero.FindAbilityByName(BOT_POWER_ABILITY) as
      | CDOTA_Ability_DataDriven
      | undefined;
    if (ability && ability.GetLevel() > 0 && !hero.HasModifier(BOT_POWER_MODIFIER)) {
      ability.ApplyDataDrivenModifier(hero, hero, BOT_POWER_MODIFIER, {});
    }
  });
}

const SWAP_SLOT = InventorySlot.SLOT_6;
// 打团时 bot 会按施放优先级重排物品格，还原时按句柄删换上的那件，不能按格子删
let swappedOut: [CDOTA_BaseNPC_Hero, string | undefined, CDOTA_Item | undefined][] = [];

// 两种空白对照：换回同名物品，验证换装动作本身不带开销；只拿掉不补，量出底装这一件自身的开销，
// 换装条件的差值减去它才是测试物品的完整开销。换装格本来空着时两者都不动，只剩空白段
const SAME_ITEM = 'same';

function swapItem(itemName: string) {
  swappedOut = [];
  let added = 0;
  forEachSideHero((hero) => {
    const old = hero.GetItemInSlot(SWAP_SLOT);
    const oldName = old?.GetName();
    if (old) UTIL_RemoveImmediate(old);
    const name = itemName === SAME_ITEM ? oldName : itemName;
    const item = name === undefined || name === EMPTY_SLOT ? undefined : hero.AddItemByName(name);
    swappedOut.push([hero, oldName, item]);
    if (!item) return;
    added++;
    if (item.GetItemSlot() !== SWAP_SLOT) hero.SwapItems(item.GetItemSlot(), SWAP_SLOT);
  });
  print(`[perf] swap item=${itemName} heroes=${swappedOut.length} added=${added}`);
}

// 光环这类由别的单位施加的 modifier 在条件里数不到，段末按名字统计全场实例数
function printModifierCounts() {
  for (const name of (PERF_CONFIG?.countModifiers ?? '').split(',')) {
    if (name === '') continue;
    let units = 0;
    let instances = 0;
    for (const unit of findAllUnits(UnitTargetType.HERO + UnitTargetType.BASIC)) {
      const count = unit.FindAllModifiersByName(name).length;
      if (count > 0) units++;
      instances += count;
    }
    print(`[perf] count modifier=${name} units=${units} instances=${instances}`);
  }
}

const CENSUS_TOP = 30;

function topCounts(counts: Map<string, number>): string {
  const entries: [string, number][] = [];
  counts.forEach((count, name) => entries.push([name, count]));
  entries.sort((a, b) => b[1] - a[1]);
  return entries
    .slice(0, CENSUS_TOP)
    .map(([name, count]) => `${name}:${count}`)
    .join(',');
}

function addCount(counts: Map<string, number>, name: string) {
  counts.set(name, (counts.get(name) ?? 0) + 1);
}

function printCensus(tag: string) {
  let total = 0;
  let onHeroes = 0;
  const byName = new Map<string, number>();
  const units = findAllUnits(UnitTargetType.HERO + UnitTargetType.BASIC);
  for (const unit of units) {
    for (const modifier of unit.FindAllModifiers()) {
      total++;
      if (unit.IsRealHero()) onHeroes++;
      addCount(byName, modifier.GetName());
    }
  }
  let entities = 0;
  const byClass = new Map<string, number>();
  for (
    let entity: CBaseEntity | undefined = Entities.First();
    entity;
    entity = Entities.Next(entity)
  ) {
    entities++;
    const className = entity.GetClassname();
    // 自制物品的类名都一样，按物品名计数才看得出是哪件没删干净
    const isCustomItem = className === 'item_lua' || className === 'item_datadriven';
    addCount(byClass, isCustomItem ? (entity as CDOTA_Item).GetAbilityName() : className);
  }
  print(
    `[perf] census tag=${tag} units=${units.length} total=${total} heroes=${onHeroes} top=${topCounts(byName)}`,
  );
  print(`[perf] census tag=${tag} entities=${entities} top=${topCounts(byClass)}`);
}

function restoreSwappedItem() {
  printModifierCounts();
  for (const [hero, name, swapped] of swappedOut) {
    if (!IsValidEntity(hero)) continue;
    if (swapped && IsValidEntity(swapped)) UTIL_RemoveImmediate(swapped);
    if (name === undefined) continue;
    const item = hero.AddItemByName(name);
    if (item && item.GetItemSlot() !== SWAP_SLOT) hero.SwapItems(item.GetItemSlot(), SWAP_SLOT);
  }
  swappedOut = [];
}

// 主动与触发效果在打团中出现的频率难控，直接以物品为来源给全员常驻挂上，量到的是上限
const NATIVE_MODIFIER = 'native';

function countHeroModifiers(modifierName: string): number {
  let count = 0;
  forEachHero((hero) => (count += hero.FindAllModifiersByName(modifierName).length));
  return count;
}

function addItemModifier(
  itemName: string,
  modifierName: string,
  scriptFile?: string,
): CDOTA_Item[] {
  const sources: CDOTA_Item[] = [];
  // DataDriven 物品的 Lua modifier 要等 RunScript 第一次执行才登记，测试时直接挂会报未知 modifier
  const isNative = scriptFile === NATIVE_MODIFIER;
  const hasScript = scriptFile !== undefined && scriptFile !== '' && !isNative;
  if (hasScript) {
    LinkLuaModifier(modifierName, scriptFile, LuaModifierMotionType.NONE);
  }
  forEachSideHero((hero) => {
    const item = CreateItem(itemName, hero.GetPlayerOwner(), hero);
    if (!item) return;
    sources.push(item);
    // KV 写的 modifier 只能由 DataDriven 物品自己挂；Lua 与引擎原生 modifier 即使来源是 DataDriven 物品也直接挂
    if (item.GetClassname() === 'item_datadriven' && !hasScript && !isNative) {
      (item as CDOTA_Item_DataDriven).ApplyDataDrivenModifier(hero, hero, modifierName, {
        duration: -1,
      });
    } else {
      hero.AddNewModifier(hero, item, modifierName, {});
    }
  });
  print(`[perf] item modifier=${modifierName} added=${countHeroModifiers(modifierName)}`);
  return sources;
}

function removeItemModifier(modifierName: string, sources: CDOTA_Item[]) {
  printModifierCounts();
  // 少于 added 说明效果在段内自行消失，这段量到的开销偏低
  print(`[perf] item modifier=${modifierName} alive=${countHeroModifiers(modifierName)}`);
  forEachHero((hero) => {
    for (const modifier of hero.FindAllModifiersByName(modifierName)) modifier.Destroy();
  });
  for (const item of sources) {
    if (IsValidEntity(item)) UTIL_Remove(item);
  }
}

/** @noSelf */
declare function AddStacks(
  ability: CDOTABaseAbility,
  caster: CDOTA_BaseNPC,
  unit: CDOTA_BaseNPC,
  modifier: string,
  stackAmount: number,
  refresh: boolean,
): void;

const MOON_SHARD_MODIFIER = 'modifier_item_moon_shard_datadriven_consumed';
let moonShards: CDOTA_Item[] = [];

// 走吃银月的同一个函数，每吃一个都会重挂一次 modifier 再加层数；玩家反馈吃多了卡
function addMoonShards(count: number) {
  moonShards = [];
  forEachHero((hero) => {
    const item = CreateItem('item_moon_shard_datadriven', hero.GetPlayerOwner(), hero);
    if (!item) return;
    moonShards.push(item);
    for (let i = 0; i < count; i++) AddStacks(item, hero, hero, MOON_SHARD_MODIFIER, 1, true);
  });
  let stacks = 0;
  let attackSpeed = 0;
  forEachHero((hero) => {
    stacks += hero.GetModifierStackCount(MOON_SHARD_MODIFIER, hero);
    attackSpeed = math.max(attackSpeed, hero.GetDisplayAttackSpeed());
  });
  print(
    `[perf] moonshard x${count} instances=${countHeroModifiers(MOON_SHARD_MODIFIER)} stacks=${stacks} max_attack_speed=${attackSpeed}`,
  );
}

function removeMoonShards() {
  forEachHero((hero) => {
    for (const modifier of hero.FindAllModifiersByName(MOON_SHARD_MODIFIER)) modifier.Destroy();
  });
  for (const item of moonShards) {
    if (IsValidEntity(item)) UTIL_Remove(item);
  }
  moonShards = [];
}

function setBotThinking(enabled: boolean) {
  GameRules.AI.BotTeam?.SetNativeThinking(enabled);
}

// 过了切换点原生本来就是关的，收尾只回到进入条件前的状态
let nativeBeforeCondition = true;

function disableBotThinking() {
  nativeBeforeCondition = GameRules.AI.BotTeam?.IsNativeActive() ?? true;
  setBotThinking(false);
}

function restoreBotThinking() {
  setBotThinking(nativeBeforeCondition);
}

type Condition = Omit<PerfStep, 'name' | 'ref'> & { name: string };

const CONDITIONS: Condition[] = [
  { name: 'profile', profile: true },
  {
    name: 'botoff',
    setup: disableBotThinking,
    teardown: restoreBotThinking,
  },
  {
    name: 'aioff',
    setup: () => (PerfSampler.aiThinkDisabled = true),
    teardown: () => (PerfSampler.aiThinkDisabled = false),
  },
  {
    name: 'alloff',
    setup: () => {
      disableBotThinking();
      PerfSampler.aiThinkDisabled = true;
    },
    teardown: () => {
      restoreBotThinking();
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
  {
    name: 'prop_lua',
    setup: () => addProperties(VALUE_PROPERTIES),
    teardown: removeProperties,
  },
  // 逐项单挂，找出整组里哪几项最贵
  ...VALUE_PROPERTIES.map((property) => ({
    name: `lua_${property[0].replace('property_', '')}`,
    setup: () => addProperties([property]),
    teardown: removeProperties,
  })),
  { name: 'prop_kv', setup: addKvProperties, teardown: removeKvProperties },
  { name: 'prop_player', setup: addPlayerProperties, teardown: removePlayerProperties },
  { name: 'nobotpower', setup: removeBotPower, teardown: restoreBotPower },
  { name: 'botpassives', setup: restoreBotPassives, teardown: stripBotPassives },
  {
    name: 'prop_takedamage',
    setup: () => addProperties(DAMAGE_EVENT_PROPERTIES),
    teardown: removeProperties,
  },
  ...[SAME_ITEM, EMPTY_SLOT].map((mode) => ({
    name: `swap_${mode}`,
    setup: () => swapItem(mode),
    teardown: restoreSwappedItem,
  })),
  ...(PERF_CONFIG?.itemModifiers ?? '')
    .split(',')
    .filter((entry) => entry !== '')
    .map((entry) => {
      const [itemName, modifierName, scriptFile] = entry.split(':');
      // 每个条件各记各的来源物品，组合条件同时挂几种时互不覆盖
      let sources: CDOTA_Item[] = [];
      return {
        name: `mod_${modifierName}`,
        setup: () => (sources = addItemModifier(itemName, modifierName, scriptFile)),
        teardown: () => removeItemModifier(modifierName, sources),
      };
    }),
  ...(PERF_CONFIG?.swapItems ?? '')
    .split(',')
    .filter((itemName) => itemName !== '')
    .map((itemName) => ({
      name: `swap_${itemName}`,
      setup: () => swapItem(itemName),
      teardown: restoreSwappedItem,
    })),
  ...(PERF_CONFIG?.buffStacks ?? '1').split(',').map((stacks) => ({
    name: `meleebuff_x${stacks}`,
    setup: () => addMeleeBuff(Number(stacks)),
    teardown: removeMeleeBuff,
  })),
  ...(PERF_CONFIG?.moonStacks ?? '1,10,30').split(',').map((count) => ({
    name: `moonshard_x${count}`,
    setup: () => addMoonShards(Number(count)),
    teardown: removeMoonShards,
  })),
  // 暂停时画面照常渲染、游戏逻辑停止，和基线的帧时间差就是随游戏运行产生的每帧开销
  { name: 'paused', setup: () => PauseGame(true), teardown: () => PauseGame(false) },
  ...Object.entries(BUILDING_MODIFIERS).map(([suffix, modifierName]) => ({
    name: `bld_${suffix}`,
    setup: () => addBuildingModifiers(modifierName),
    teardown: () => removeBuildingModifiers(modifierName),
  })),
];

// 「a+b」同时挂多个条件，量共用同一机制的几项叠加后的总开销
function findCondition(name: string): Condition | undefined {
  if (!name.includes('+')) return CONDITIONS.find((c) => c.name === name);
  const parts = name.split('+').map((part) => CONDITIONS.find((c) => c.name === part));
  if (parts.some((part) => part === undefined)) return undefined;
  const found = parts as Condition[];
  return {
    name,
    setup: () => found.forEach((part) => part.setup?.()),
    teardown: () => [...found].reverse().forEach((part) => part.teardown?.()),
  };
}

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
  scene?: { name: string },
): PerfStep[] {
  const steps: PerfStep[] = [];
  // 场景名作前缀，汇总时同名条件在两个场景下各成一行
  const prefix = scene ? `${scene.name}-` : '';
  const extra = scene ? { scene: scene.name } : {};
  let baselineIndex = 0;
  const nextBaseline = (rep: number) => `${prefix}baseline#${rep}.${++baselineIndex}`;
  for (let rep = repStart; rep < repStart + reps; rep++) {
    let before = nextBaseline(rep);
    steps.push({ name: before, ref: before, ...extra });
    for (const condition of shuffled(conditions)) {
      const after = nextBaseline(rep);
      steps.push({
        ...condition,
        ...extra,
        name: `${prefix}${condition.name}#${rep}`,
        ref: `${before},${after}`,
      });
      steps.push({ name: after, ref: after, ...extra });
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
  static readonly config = PERF_CONFIG;
  private static running = false;

  static onGameInProgress() {
    const config = this.config;
    if (!config) return;
    // 选项在补 bot 之后仍可能被界面重新下发，开局再确认一次倍率
    if (config.radiantMultiplier > 0) {
      GameRules.Option.radiantGoldXpMultiplier = config.radiantMultiplier;
    }
    if ((config.direMultiplier ?? 0) > 0) {
      GameRules.Option.direGoldXpMultiplier = config.direMultiplier as number;
    }
    // 满编时玩家英雄也交给 AI，场上才是 20 个行为一致的英雄；天辉人少时由天辉 bot 扮演玩家，
    // 玩家英雄留在泉水，免得原生 bot 不管它、接管前一直站着
    if (config.radiantPlayers === 0 || config.radiantPlayers >= 10) {
      forEachHero((hero, playerId) => {
        if (PlayerHelper.IsHumanPlayerByPlayerId(playerId)) GameRules.AI.EnableAI(hero);
      });
    }
    const hasTestItems = config.testItems !== undefined && config.testItems !== '';
    if (config.boost) {
      boostHeroes(undefined, !hasTestItems);
      lockForts();
    } else if (config.radiantBoost === true) {
      boostHeroes(DotaTeam.GOODGUYS, !hasTestItems);
    }
    if (hasTestItems) {
      grantTestItems(config.testItems as string);
      freezeGold();
    }
    // 分场景测试不热身，开局就停掉原生 bot 与自定义 AI，由各场景自己决定谁在动
    if (config.scenes !== undefined && config.scenes !== '') {
      setBotThinking(false);
      PerfSampler.aiThinkDisabled = true;
      afterRealSeconds(3, removeBotPassives);
      ListenToGameEvent('entity_killed', (keys) => respawnOnDeath(keys), undefined);
    }
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

  // 结束时各英雄的等级、净值和击杀，用来确认对比的几局局势相近，没有一方碾压
  private static printHeroSummary() {
    for (const hero of HeroList.GetAllHeroes()) {
      if (!hero.IsRealHero()) continue;
      const playerId = hero.GetPlayerOwnerID();
      print(
        `[perf-heroes] team=${hero.GetTeamNumber()} ${hero.GetUnitName().replace('npc_dota_hero_', '')}` +
          ` level=${hero.GetLevel()} networth=${PlayerResource.GetNetWorth(playerId)}` +
          ` kills=${PlayerResource.GetKills(playerId)} deaths=${PlayerResource.GetDeaths(playerId)}`,
      );
    }
    for (const team of [DotaTeam.GOODGUYS, DotaTeam.BADGUYS]) {
      const towers = (Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[]).filter(
        (tower) => tower.GetTeamNumber() === team && tower.IsAlive(),
      ).length;
      print(`[perf-heroes] team=${team} towers_alive=${towers}`);
    }
  }

  private static finish(gameOver: boolean, quitOnDone: boolean) {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    SendToServerConsole('host_timescale 1');
    this.printHeroSummary();
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
      | 'scenes'
    >,
  ) {
    if (this.running) return;
    this.running = true;
    PerfSampler.start();
    // 引擎剖析器直接给出每 tick 的计算时间并按引擎模块拆开，1 倍速下也量得到，不必加速跑满
    SendToServerConsole('vprof_on');
    const wanted =
      config.conditions && config.conditions !== 'all' ? config.conditions.split(',') : undefined;
    const conditions = wanted
      ? wanted.map(findCondition).filter((c): c is Condition => c !== undefined)
      : CONDITIONS;
    const scenes =
      config.scenes !== undefined && config.scenes !== '' ? config.scenes.split(',') : undefined;
    const steps = scenes
      ? scenes.flatMap((name) =>
          buildSteps(conditions, config.reps, config.repStart, false, { name }),
        )
      : buildSteps(conditions, config.reps, config.repStart, config.includeTail);
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
    // 团队 AI 的回线任务不归单体思考管，可能把人带出泉水，每段开始前重新拉回
    const benchScene = step.scene === undefined ? undefined : BENCH_SCENES[step.scene];
    const bench = benchScene !== undefined;
    const creepBench = step.scene === 'creepbench';
    if (step.scene === 'idle' || bench || creepBench) parkHeroes();
    if (benchScene !== undefined) startDamageBench(benchScene);
    else benchActive = false;
    if (creepBench) startCreepBench();
    else creepBenchActive = false;
    const enteringFight = step.scene === 'fight' && steps[index - 1]?.scene !== 'fight';
    if (enteringFight) releaseHeroes();
    if (step.scene === 'fight') stageFight();
    step.setup?.();
    PerfSampler.setPhase(`settle`);
    // 按真实时间计时：服务器跟不上时游戏时间会变慢，暂停时游戏时间不走，都会让各段长短不一
    afterRealSeconds(enteringFight ? FIGHT_SETTLE_SECONDS : SETTLE_SECONDS, () => {
      print(`[perf-auto] step name=${step.name} ref=${step.ref} timescale=${timescale}`);
      const next = () => {
        if (PERF_CONFIG?.census === true) printCensus(step.name);
        step.teardown?.();
        this.runStep(steps, index + 1, config);
      };
      if (step.flip) {
        runFlipSlices(step.name.split('#')[1], 0, next);
        return;
      }
      PerfSampler.setPhase(step.name);
      SendToServerConsole('vprof_reset');
      if (step.profile) PerfProfiler.start();
      afterRealSeconds(config.phaseSeconds, () => {
        if (step.profile) PerfProfiler.stop(step.name);
        // 报告在下一帧才打印，标记先出，启动脚本据此把报告归到这一段
        print(`[perf-vprof-mark] phase=${step.name}`);
        SendToServerConsole('vprof_generate_report');
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

// 计时器库的非游戏时间也随 host_timescale 缩放，加速测量时各段会被压短，只能按系统时钟轮询
const REAL_TIMER_POLL = 0.1;

function afterRealSeconds(seconds: number, callback: () => void) {
  const deadline = Plat_FloatTime() + seconds;
  Timers.CreateTimer({
    endTime: 0,
    useGameTime: false,
    callback: () => {
      if (Plat_FloatTime() < deadline) return REAL_TIMER_POLL;
      callback();
      return undefined;
    },
  });
}
