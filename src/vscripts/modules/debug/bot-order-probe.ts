import { DragonWishFilter } from '../filter/dragon-wish-filter';
import { PerfSampler } from './perf-sampler';

const THINK_NAME = 'bot_order_probe';
const SAMPLE_INTERVAL = 1;
const REPORT_EVERY = 10;
// 一秒内位移低于此值视为站着不动；足够滤掉原地转身与碰撞抖动
const IDLE_MOVE_DISTANCE = 50;
const NEARBY_RADIUS = 1200;
const LOW_HEALTH_PCT = 30;
const ORDER_METHODS = [
  'CastAbilityNoTarget',
  'CastAbilityOnPosition',
  'CastAbilityOnTarget',
  'CastAbilityToggle',
  'CastAbilityImmediately',
  'MoveToPosition',
  'MoveToPositionAggressive',
  'MoveToTargetToAttack',
  'MoveToNPC',
  'PickupRune',
  'PickupDroppedItem',
  'Stop',
  'Hold',
] as const;
const BUILDING_CLASSES = ['npc_dota_tower', 'npc_dota_barracks', 'npc_dota_fort'];
// 建筑附近出现敌方英雄视为受威胁，统计此时赶来的友方 bot 数
const THREAT_RADIUS = 900;
const DEFENDER_RADIUS = 2500;
// 引擎按类名直接挂的自定义 AI modifier，读它当前的 mode；不 import 类是为了不让调试模块反向依赖 AI
const AI_MODIFIER_NAMES = ['BotBaseAIModifier', 'tinker_ai_modifier'];

const ORDER_NAMES = new Map<number, string>([
  [UnitOrder.MOVE_TO_POSITION, 'move_pos'],
  [UnitOrder.MOVE_TO_TARGET, 'move_target'],
  [UnitOrder.ATTACK_MOVE, 'attack_move'],
  [UnitOrder.ATTACK_TARGET, 'attack'],
  [UnitOrder.CAST_POSITION, 'cast_pos'],
  [UnitOrder.CAST_TARGET, 'cast_target'],
  [UnitOrder.CAST_TARGET_TREE, 'cast_tree'],
  [UnitOrder.CAST_NO_TARGET, 'cast_none'],
  [UnitOrder.CAST_TOGGLE, 'cast_toggle'],
  [UnitOrder.HOLD_POSITION, 'hold'],
  [UnitOrder.TRAIN_ABILITY, 'train'],
  [UnitOrder.PICKUP_ITEM, 'pickup_item'],
  [UnitOrder.PICKUP_RUNE, 'pickup_rune'],
  [UnitOrder.PURCHASE_ITEM, 'purchase'],
  [UnitOrder.SELL_ITEM, 'sell'],
  [UnitOrder.MOVE_ITEM, 'move_item'],
  [UnitOrder.CAST_TOGGLE_AUTO, 'autocast'],
  [UnitOrder.STOP, 'stop'],
  [UnitOrder.BUYBACK, 'buyback'],
  [UnitOrder.GLYPH, 'glyph'],
  [UnitOrder.MOVE_TO_DIRECTION, 'move_dir'],
  [UnitOrder.PATROL, 'patrol'],
  [UnitOrder.CONTINUE, 'continue'],
]);

// dragon-wish-filter.ts 里 filterOrder 是 private，探针只需要拿到同一个原型方法做包装，用一个本地接口把可见性放开
interface FilterOrderHost {
  filterOrder(args: ExecuteOrderFilterEvent): boolean;
}

type NpcMethod = (this: CDOTA_BaseNPC, ...args: unknown[]) => unknown;

// 用深度而不是布尔：脚本下指令可能嵌套触发另一次下指令
let scriptOrderDepth = 0;
let scriptOrders = 0;
let scriptOrdersFiltered = 0;
let nativeOrders = 0;
let humanOrders = 0;
const nativeTypeCounts = new Map<number, number>();

let aliveSeconds = 0;
let idleSeconds = 0;
let samples = 0;
const lastPositions = new Map<PlayerID, Vector>();

// 按 phase 分段累计的计数，段结束时整段输出，汇总脚本按 phase 合并
let segmentPhase = '';
let segmentSamples = 0;
let segmentStart = 0;
const segment = new Map<string, Map<string, number>>();
const fountains = new Map<DotaTeam, Vector>();

function count(category: string, key: string, amount = 1): void {
  let bucket = segment.get(category);
  if (!bucket) {
    bucket = new Map();
    segment.set(category, bucket);
  }
  bucket.set(key, (bucket.get(key) ?? 0) + amount);
}

function isBot(playerId: PlayerID): boolean {
  return PlayerResource.IsValidPlayerID(playerId) && PlayerResource.IsFakeClient(playerId);
}

function firstUnit(args: ExecuteOrderFilterEvent): CDOTA_BaseNPC | undefined {
  const unitIndex = Object.values(args.units)[0];
  if (unitIndex === undefined) return undefined;
  return EntIndexToHScript(unitIndex) as CDOTA_BaseNPC | undefined;
}

function unitKind(unit: CDOTA_BaseNPC): string {
  if (unit.IsRealHero()) return 'hero';
  if (unit.IsIllusion()) return `illusion_${unit.GetUnitName()}`;
  if (unit.IsCourier()) return 'courier';
  return `summon_${unit.GetUnitName()}`;
}

function targetKind(target: CDOTA_BaseNPC, self: CDOTA_BaseNPC): string {
  const side = target.GetTeamNumber() === self.GetTeamNumber() ? 'ally_' : '';
  if (target.IsRealHero()) return `${side}hero`;
  if (target.IsBuilding() || target.IsTower()) return `${side}bldg`;
  if (target.IsNeutralUnitType() || target.GetTeamNumber() === DotaTeam.NEUTRALS) return 'neutral';
  if (target.IsCourier()) return `${side}courier`;
  if (target.IsCreep()) return `${side}creep`;
  return `${side}unit`;
}

function distanceBucket(distance: number): string {
  if (distance < 300) return 'd0';
  if (distance < 800) return 'd1';
  if (distance < 1500) return 'd2';
  return 'd3';
}

function describeOrder(args: ExecuteOrderFilterEvent, unit: CDOTA_BaseNPC): string {
  const orderName = ORDER_NAMES.get(args.order_type) ?? `o${args.order_type}`;
  let target = 'none';
  let distance = '';
  const targetEntity =
    args.entindex_target > 0
      ? (EntIndexToHScript(args.entindex_target) as CDOTA_BaseNPC | undefined)
      : undefined;
  if (targetEntity && targetEntity.IsBaseNPC && targetEntity.IsBaseNPC()) {
    target = targetKind(targetEntity, unit);
    distance = distanceBucket(unit.GetRangeToUnit(targetEntity));
  } else if (args.position_x !== 0 || args.position_y !== 0) {
    target = 'pos';
    const position = Vector(args.position_x, args.position_y, 0);
    distance = distanceBucket(position.__sub(unit.GetAbsOrigin()).Length2D());
  }
  return `${unitKind(unit)}.${orderName}.${target}${distance === '' ? '' : `.${distance}`}`;
}

function abilityName(args: ExecuteOrderFilterEvent): string | undefined {
  if (args.entindex_ability <= 0) return undefined;
  const ability = EntIndexToHScript(args.entindex_ability) as CDOTABaseAbility | undefined;
  return ability?.GetAbilityName();
}

function recordFilteredOrder(args: ExecuteOrderFilterEvent): void {
  const unit = firstUnit(args);
  const owner = unit ? unit.GetPlayerOwnerID() : args.issuer_player_id_const;
  if (scriptOrderDepth > 0) {
    scriptOrdersFiltered++;
    if (unit) count('sorder', describeOrder(args, unit));
    return;
  }
  if (!isBot(owner)) {
    humanOrders++;
    return;
  }
  nativeOrders++;
  nativeTypeCounts.set(args.order_type, (nativeTypeCounts.get(args.order_type) ?? 0) + 1);
  if (!unit) return;
  count('norder', describeOrder(args, unit));
  const name = abilityName(args);
  if (name !== undefined) count('ncast', name);
}

function markScriptOrder<T>(call: () => T): T {
  scriptOrders++;
  // 没用 try/finally：TSTL 编译成吞错的 pcall，会藏住调用方的报错
  // 第 3 层是替换后入口的调用方，即业务代码里下指令的那一行
  const caller = debug.getinfo(3, 'Sl');
  if (caller && caller.short_src !== undefined) {
    const fileName = caller.short_src.split('\\').pop()?.split('/').pop();
    count('site', `${fileName}:${caller.currentline}`);
  }
  scriptOrderDepth++;
  const result = call();
  scriptOrderDepth--;
  return result;
}

function fountainOf(team: DotaTeam): Vector | undefined {
  if (fountains.size === 0) {
    for (const fountain of Entities.FindAllByClassname('ent_dota_fountain')) {
      fountains.set(fountain.GetTeamNumber(), fountain.GetAbsOrigin());
    }
  }
  return fountains.get(team);
}

// 按到两边泉水的距离比例分十段，r0 是己方泉水、r9 是敌方泉水，不依赖具体地图坐标
function regionOf(team: DotaTeam, pos: Vector): string {
  const own = fountainOf(team);
  const enemy = fountainOf(team === DotaTeam.GOODGUYS ? DotaTeam.BADGUYS : DotaTeam.GOODGUYS);
  if (!own || !enemy) return 'unknown';
  const toOwn = pos.__sub(own).Length2D();
  const ratio = toOwn / (toOwn + pos.__sub(enemy).Length2D());
  return `r${Math.min(9, Math.floor(ratio * 10))}`;
}

function teamName(team: DotaTeam): string {
  return team === DotaTeam.GOODGUYS ? 'radiant' : 'dire';
}

function countHeroes(team: DotaTeam, pos: Vector, radius: number, teamFilter: UnitTargetTeam) {
  const units = FindUnitsInRadius(
    team,
    pos,
    undefined,
    radius,
    teamFilter,
    UnitTargetType.HERO,
    UnitTargetFlags.INVULNERABLE + UnitTargetFlags.OUT_OF_WORLD,
    FindOrder.ANY,
    false,
  );
  let heroes = 0;
  for (const unit of units) {
    if (unit.IsRealHero() && unit.IsAlive()) heroes++;
  }
  return heroes;
}

// 己方建筑身边有敌方英雄时，附近有几个友方英雄在场，衡量回防
function sampleDefense(): void {
  for (const className of BUILDING_CLASSES) {
    for (const building of Entities.FindAllByClassname(className) as CDOTA_BaseNPC[]) {
      if (!building.IsAlive()) continue;
      const team = building.GetTeamNumber();
      const pos = building.GetAbsOrigin();
      const attackers = countHeroes(team, pos, THREAT_RADIUS, UnitTargetTeam.ENEMY);
      if (attackers === 0) continue;
      const defenders = countHeroes(team, pos, DEFENDER_RADIUS, UnitTargetTeam.FRIENDLY);
      const defenderBucket = defenders === 0 ? 'def0' : defenders <= 2 ? 'def1-2' : 'def3+';
      const kind = className.replace('npc_dota_', '');
      count('defend', `${kind}.${regionOf(team, pos)}.${defenderBucket}.${teamName(team)}`);
      count('defend_ratio', `${kind}.attackers`, attackers);
      count('defend_ratio', `${kind}.defenders`, defenders);
    }
  }
}

// 局面按优先级取一个：身边有敌方英雄算交战，其次敌方建筑、兵线、野怪
function situationOf(hero: CDOTA_BaseNPC_Hero, pos: Vector): string {
  const units = FindUnitsInRadius(
    hero.GetTeamNumber(),
    pos,
    undefined,
    NEARBY_RADIUS,
    UnitTargetTeam.ENEMY,
    UnitTargetType.HERO + UnitTargetType.BASIC + UnitTargetType.BUILDING,
    UnitTargetFlags.NO_INVIS,
    FindOrder.ANY,
    false,
  );
  let building = false;
  let creep = false;
  let neutral = false;
  for (const unit of units) {
    if (unit.IsRealHero()) return 'fight';
    if (unit.IsBuilding() || unit.IsTower()) building = true;
    else if (unit.GetTeamNumber() === DotaTeam.NEUTRALS) neutral = true;
    else if (unit.IsCreep()) creep = true;
  }
  if (building) return 'tower';
  if (creep) return 'wave';
  if (neutral) return 'jungle';
  return 'free';
}

function actionOf(hero: CDOTA_BaseNPC_Hero, moved: number): string {
  if (hero.IsChanneling() || hero.GetCurrentActiveAbility() !== undefined) return 'cast';
  if (hero.IsAttacking()) {
    const target = hero.GetAttackTarget();
    return target ? `atk_${targetKind(target, hero)}` : 'atk';
  }
  if (moved >= IDLE_MOVE_DISTANCE) return 'move';
  return 'idle';
}

function aiModeOf(hero: CDOTA_BaseNPC_Hero): string {
  for (const name of AI_MODIFIER_NAMES) {
    const modifier = hero.FindModifierByName(name) as unknown as { mode?: string } | undefined;
    if (modifier) return modifier.mode ?? 'none';
  }
  return 'none';
}

function sampleBots(): void {
  for (let id = 0; id < DOTA_MAX_TEAM_PLAYERS; id++) {
    const playerId = id as PlayerID;
    if (!isBot(playerId)) continue;
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (!hero || !hero.IsAlive()) {
      lastPositions.delete(playerId);
      if (hero) count('meta', 'dead_s');
      continue;
    }
    const pos = hero.GetAbsOrigin();
    const last = lastPositions.get(playerId);
    lastPositions.set(playerId, pos);
    if (!last) continue;

    const moved = pos.__sub(last).Length2D();
    const action = actionOf(hero, moved);
    aliveSeconds++;
    if (action === 'idle') idleSeconds++;

    const region = regionOf(hero.GetTeamNumber(), pos);
    const situation = situationOf(hero, pos);
    count('meta', 'alive_s');
    count('act', `${region}.${situation}.${action}`);
    count('team', `${teamName(hero.GetTeamNumber())}.${region}.${action}`);
    count('mode', `${aiModeOf(hero)}.${action}`);

    if (hero.GetHealthPercent() < LOW_HEALTH_PCT) {
      const own = fountainOf(hero.GetTeamNumber());
      const retreating =
        own !== undefined && pos.__sub(own).Length2D() < last.__sub(own).Length2D() - 50;
      count('lowhp', `${situation}.${retreating ? 'retreat' : action}`);
    }
    if (hero.GetManaPercent() < LOW_HEALTH_PCT) count('meta', 'lowmana_s');
  }
}

function botHeroOf(entityIndex: EntityIndex): CDOTA_BaseNPC_Hero | undefined {
  const unit = EntIndexToHScript(entityIndex) as CDOTA_BaseNPC | undefined;
  if (!unit || !unit.IsBaseNPC || !unit.IsBaseNPC() || !unit.IsRealHero()) return undefined;
  return isBot(unit.GetPlayerOwnerID()) ? (unit as CDOTA_BaseNPC_Hero) : undefined;
}

function listenEvents(): void {
  ListenToGameEvent(
    'dota_player_used_ability',
    (event) => {
      if (isBot(event.PlayerID)) count('used', event.abilityname);
    },
    undefined,
  );
  ListenToGameEvent(
    'dota_item_purchased',
    (event) => {
      if (isBot(event.PlayerID)) count('buy', event.itemname);
    },
    undefined,
  );
  ListenToGameEvent(
    'dota_rune_activated_server',
    (event) => {
      if (isBot(event.PlayerID)) count('event', `rune_${event.rune}`);
    },
    undefined,
  );
  ListenToGameEvent(
    'dota_buyback',
    (event) => {
      if (isBot(event.player_id as PlayerID)) count('event', 'buyback');
    },
    undefined,
  );
  ListenToGameEvent(
    'entity_killed',
    (event) => {
      if (botHeroOf(event.entindex_killed)) count('event', 'death');
      const attacker = EntIndexToHScript(event.entindex_attacker) as CDOTA_BaseNPC | undefined;
      if (!attacker || !attacker.IsBaseNPC || !attacker.IsBaseNPC()) return;
      if (!isBot(attacker.GetPlayerOwnerID())) return;
      const killed = EntIndexToHScript(event.entindex_killed) as CDOTA_BaseNPC | undefined;
      if (!killed || !killed.IsBaseNPC || !killed.IsBaseNPC()) return;
      const kind =
        killed.GetUnitName() === 'npc_dota_roshan' ? 'roshan' : targetKind(killed, attacker);
      count('event', `kill_${kind}`);
    },
    undefined,
  );
}

function flushSegment(): void {
  if (segmentPhase !== '' && segmentSamples > 0) {
    print(
      `[bot-probe-seg] phase=${segmentPhase} cat=meta seconds=${Math.floor(GameRules.GetGameTime() - segmentStart)} samples=${segmentSamples}`,
    );
    for (const [category, bucket] of segment) {
      const parts: string[] = [];
      for (const [key, value] of bucket) parts.push(`${key}=${value}`);
      print(`[bot-probe-seg] phase=${segmentPhase} cat=${category} ${parts.join(' ')}`);
    }
  }
  segment.clear();
  segmentSamples = 0;
  segmentStart = GameRules.GetGameTime();
  segmentPhase = PerfSampler.phase;
}

function formatTypeCounts(): string {
  const parts: string[] = [];
  for (const [orderType, orderCount] of nativeTypeCounts) {
    parts.push(`${orderType}:${orderCount}`);
  }
  return parts.join(',');
}

function report(): void {
  const idlePct = aliveSeconds > 0 ? Math.floor((idleSeconds / aliveSeconds) * 100) : 0;
  print(
    `[bot-probe] phase=${PerfSampler.phase} script=${scriptOrders} script_filtered=${scriptOrdersFiltered} native=${nativeOrders} human=${humanOrders} idle=${idlePct}% alive_s=${aliveSeconds} types=${formatTypeCounts()}`,
  );
  scriptOrders = 0;
  scriptOrdersFiltered = 0;
  nativeOrders = 0;
  humanOrders = 0;
  nativeTypeCounts.clear();
  aliveSeconds = 0;
  idleSeconds = 0;
}

/**
 * 工具模式观察工具：区分脚本与原生 bot 的指令，按秒采样 bot 的动作与局面，并按性能测试的 phase 分段汇总输出。
 * 通过替换全局函数与类方法在运行时挂载，不改动被观测的业务代码。
 */
export class BotOrderProbe {
  private static installed = false;

  static install(): void {
    if (this.installed) return;
    this.installed = true;

    // 脚本下指令最终都走这几个引擎入口，原生 bot 不经过 Lua，由此区分来源
    const originalExecute = ExecuteOrderFromTable;
    (_G as unknown as Record<string, unknown>).ExecuteOrderFromTable = function (
      this: void,
      order: ExecuteOrderOptions,
    ) {
      markScriptOrder(() => originalExecute(order));
    };

    const npcClass = CDOTA_BaseNPC as unknown as Record<string, NpcMethod>;
    for (const method of ORDER_METHODS) {
      const originalMethod = npcClass[method];
      if (originalMethod === undefined) continue;
      npcClass[method] = function (this: CDOTA_BaseNPC, ...args: unknown[]) {
        return markScriptOrder(() => originalMethod.call(this, ...args));
      };
    }

    const proto = DragonWishFilter.prototype as unknown as FilterOrderHost;
    const originalFilter = proto.filterOrder;
    proto.filterOrder = function (this: FilterOrderHost, args: ExecuteOrderFilterEvent): boolean {
      recordFilteredOrder(args);
      return originalFilter.call(this, args);
    };

    listenEvents();
    segmentPhase = PerfSampler.phase;
    segmentStart = GameRules.GetGameTime();

    GameRules.GetGameModeEntity().SetContextThink(
      THINK_NAME,
      () => {
        if (PerfSampler.phase !== segmentPhase) flushSegment();
        sampleBots();
        sampleDefense();
        segmentSamples++;
        samples++;
        if (samples % REPORT_EVERY === 0) report();
        return SAMPLE_INTERVAL;
      },
      SAMPLE_INTERVAL,
    );
  }
}
