import type { BotBaseAIModifier } from '../hero/bot-base';
import {
  ApplyAbilityAction,
  CastAbilityOnTargetByBehavior,
  GetFullCastRange,
} from '../ability/ability-cast';
import { TargetSide } from '../ability/ability-spec';
import {
  CastCoindition,
  CheckAbilityConditionFailure,
  CheckNumberRangeFailure,
  CheckUnitConditionFailure,
  FilterTargetWithCondition,
  NumberRange,
} from './cast-condition';

/**
 * 技能与物品共用的目标筛选 + 施法派发核心。
 *
 * 从 ability-dispatcher.ts 抽出，供 AbilityDispatcher 与 ItemDispatcher 共用：
 * 施法者/技能条件 → 候选目标（读 bot-base 预搜缓存）→ 目标筛选 → 施法位置计算 → 按 behavior 派发。
 *
 * EnemyCreep 的 CREEP_DEFAULT_CONDITION 叠加逻辑由调用方（AbilityDispatcher）在调用前完成，
 * 这里只处理已经合并好的最终 condition。
 */
export function TryCastBySpec(
  ai: BotBaseAIModifier,
  castable: CDOTABaseAbility,
  targetSide: TargetSide,
  condition: CastCoindition | undefined,
): boolean {
  const hero = ai.GetHero();

  if (CheckUnitConditionFailure(hero, condition?.self?.unitCondition)) {
    return false;
  }
  if (CheckAbilityConditionFailure(castable, condition?.ability)) {
    return false;
  }

  if (CheckNoEnemyHeroInRangeFailure(ai, condition?.self?.noEnemyHeroInRange)) {
    return false;
  }
  if (CheckNoEnemyBuildingInRangeFailure(ai, condition?.self?.noEnemyBuildingInRange)) {
    return false;
  }
  if (CheckFriendlyCreepNearbyFailure(hero, condition?.self?.friendlyCreepNearby)) {
    return false;
  }
  if (CheckCooldownTotalFailure(hero, condition?.self?.cooldownTotal)) {
    return false;
  }

  const target = pickTarget(ai, castable, targetSide, condition);
  if (!target) {
    return false;
  }

  if (condition?.debug) {
    print(`[AI] Dispatcher hit ${castable.GetName()} side=${targetSide}`);
  }

  // 开关/法球类：找到目标（= 满足开启条件）后只切换状态，不走正常施法派发。
  if (condition?.action) {
    return ApplyAbilityAction(castable, condition.action);
  }

  const castPosition = resolveCastPosition(hero, castable, target, condition);
  return CastAbilityOnTargetByBehavior(hero, castable, target, castPosition);
}

/**
 * 计算 POINT 技能的释放位置。
 * - castMode 未设或 'targetPosition' → 返回 undefined（CastAbilityOnTargetByBehavior 默认用 target 位置）
 * - 'projectedOnCastRange'：
 *     - 目标距离 ≤ cast range → 直接用目标位置（精准命中）
 *     - 目标距离 > cast range → 沿"施法者→目标"方向投影到 cast range 边缘
 *   此模式要求 spec 显式设置 target.range.lte（> cast range），否则会被 fillRangeFromCastRange
 *   限制为 cast range，失去意义。
 */

function CheckNoEnemyHeroInRangeFailure(
  ai: BotBaseAIModifier,
  noHeroRange: number | undefined,
): boolean {
  if (noHeroRange === undefined) {
    return false;
  }
  const hero = ai.GetHero();
  for (const enemy of ai.aroundEnemyHeroes) {
    if (enemy.IsAlive() && hero.GetRangeToUnit(enemy) <= noHeroRange) {
      return true;
    }
  }
  return false;
}

function CheckNoEnemyBuildingInRangeFailure(
  ai: BotBaseAIModifier,
  noBuildingRange: number | undefined,
): boolean {
  if (noBuildingRange === undefined) {
    return false;
  }
  const hero = ai.GetHero();
  for (const building of ai.aroundEnemyBuildings) {
    if (building.IsAlive() && hero.GetRangeToUnit(building) <= noBuildingRange) {
      return true;
    }
  }
  return false;
}

function CheckFriendlyCreepNearbyFailure(
  hero: CDOTA_BaseNPC_Hero,
  friendlyCreepNearby: NonNullable<CastCoindition['self']>['friendlyCreepNearby'],
): boolean {
  if (friendlyCreepNearby === undefined) {
    return false;
  }
  const range = friendlyCreepNearby.range ?? 900;
  const creeps = FindUnitsInRadius(
    hero.GetTeamNumber(),
    hero.GetAbsOrigin(),
    undefined,
    range,
    UnitTargetTeam.FRIENDLY,
    UnitTargetType.CREEP,
    UnitTargetFlags.NONE,
    FindOrder.ANY,
    false,
  );
  return CheckNumberRangeFailure(creeps.length, friendlyCreepNearby.count);
}

/** 刷新类：检查所有技能 + 主栏物品的总冷却时间是否落在阈值区间。 */
function CheckCooldownTotalFailure(
  hero: CDOTA_BaseNPC_Hero,
  cooldownTotal: NumberRange | undefined,
): boolean {
  if (!cooldownTotal) {
    return false;
  }
  let totalCooldown = 0;
  const abilityCount = hero.GetAbilityCount();
  for (let i = 0; i < abilityCount; i++) {
    const abil = hero.GetAbilityByIndex(i);
    if (abil) {
      totalCooldown += abil.GetCooldownTimeRemaining();
    }
  }
  for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_6; slot++) {
    const item = hero.GetItemInSlot(slot);
    if (item) {
      totalCooldown += item.GetCooldownTimeRemaining();
    }
  }
  return CheckNumberRangeFailure(totalCooldown, cooldownTotal);
}

function resolveCastPosition(
  hero: CDOTA_BaseNPC_Hero,
  castable: CDOTABaseAbility,
  target: CDOTA_BaseNPC,
  condition: CastCoindition | undefined,
): Vector | undefined {
  if (condition?.target?.castMode !== 'projectedOnCastRange') {
    return undefined;
  }
  const heroPos = hero.GetAbsOrigin();
  const targetPos = target.GetAbsOrigin();
  const delta = targetPos.__sub(heroPos);
  const len = delta.Length2D();
  if (len < 1) {
    return targetPos;
  }
  const castRange = GetFullCastRange(hero, castable);
  if (len <= castRange) {
    // 目标在 cast range 内：精准命中
    return targetPos;
  }
  // 目标在 cast range 外：投影到 cast range 边缘（朝目标方向），让 AoE 边缘扫到目标
  const direction = delta.__mul(1 / len);
  return heroPos.__add(direction.__mul(castRange));
}

function pickTarget(
  ai: BotBaseAIModifier,
  castable: CDOTABaseAbility,
  targetSide: TargetSide,
  condition: CastCoindition | undefined,
): CDOTA_BaseNPC | undefined {
  const hero = ai.GetHero();

  if (targetSide === TargetSide.Self) {
    // 自身条件已在上方检查
    return hero;
  }

  const candidates = candidatesFor(ai, targetSide);
  const filledCondition = fillRangeFromCastRange(condition, hero, castable);
  return FilterTargetWithCondition(filledCondition, candidates, hero, castable);
}

/**
 * 当 spec 未显式指定 target.range.lte 时，自动补上技能/物品的有效搜索距离：
 * - 若 spec 设置了 target.rangeFromAbilityValue，则读取 ability.GetSpecialValueFor(key) 作为上限
 *   （适用于 NO_TARGET AoE 技能，如 axe_berserkers_call，cast range = 0 但实际作用域由 KV AbilityValues 定义）
 * - 否则使用 AbilityCastRange + 施法距离加成
 */
function fillRangeFromCastRange(
  condition: CastCoindition | undefined,
  hero: CDOTA_BaseNPC_Hero,
  castable: CDOTABaseAbility,
): CastCoindition {
  const existingTarget = condition?.target;
  const existing = existingTarget?.range;
  if (existing?.lte !== undefined) {
    return condition!;
  }
  // 避免使用对象 spread —— TSTL 的 __TS__ObjectAssign 接到 nil 会崩。
  const abilityValueKey = existingTarget?.rangeFromAbilityValue;
  let castRange = abilityValueKey
    ? castable.GetSpecialValueFor(abilityValueKey)
    : GetFullCastRange(hero, castable);
  if (existingTarget?.rangeFromAttackRange) {
    castRange += hero.Script_GetAttackRange();
  }
  const range: NumberRange = { lte: castRange };
  if (existing?.gte !== undefined) {
    range.gte = existing.gte;
  }
  // 必须构造全新对象而非复用/改写 existingTarget —— spec 是 Map 里的模块级单例，
  // 跨所有英雄/所有 tick 共享同一个引用，原地写 target.range 会把第一次算出的
  // cast range "冻结"进共享 spec，之后所有英雄、所有 tick 都读到这个过期值。
  const target: NonNullable<CastCoindition['target']> = {
    unitCondition: existingTarget?.unitCondition,
    count: existingTarget?.count,
    ignoresMagicImmune: existingTarget?.ignoresMagicImmune,
    rangeFromAbilityValue: existingTarget?.rangeFromAbilityValue,
    rangeFromAttackRange: existingTarget?.rangeFromAttackRange,
    castMode: existingTarget?.castMode,
    range,
  };
  return {
    target,
    self: condition?.self,
    ability: condition?.ability,
    action: condition?.action,
    debug: condition?.debug,
  };
}

/**
 * 取候选列表 —— 直接消费 bot-base 预搜结果，不再发起新的范围搜索。
 * aroundFriendlyHeroes 来自 FindUnitsInRadius(TEAM_FRIENDLY)，已包含自己，
 * 且按 FindOrder.CLOSEST 排序，距离 0 的自己天然位于首位。
 */
function candidatesFor(ai: BotBaseAIModifier, side: TargetSide): CDOTA_BaseNPC[] {
  if (side === TargetSide.EnemyHero) {
    return ai.aroundEnemyHeroes;
  }
  if (side === TargetSide.EnemyCreep) {
    return ai.aroundEnemyCreeps;
  }
  if (side === TargetSide.EnemyBuilding) {
    return ai.aroundEnemyBuildings;
  }
  if (side === TargetSide.FriendlyHero) {
    return ai.aroundFriendlyHeroes;
  }
  if (side === TargetSide.FriendlyCreep) {
    return ai.aroundFriendlyCreeps;
  }
  if (side === TargetSide.FriendlyBuilding) {
    return ai.aroundFriendlyBuildings;
  }
  return [];
}
