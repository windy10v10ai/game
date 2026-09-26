import { HeroUtil } from '../hero/hero-util';

/**
 * 施法条件，必须满足所有条件才能施法
 */
export interface CastCoindition {
  target?: {
    unitCondition?: UnitCondition;
    /**
     * 生效范围内的敌人数量。范围取 range.lte，未显式指定时由 dispatcher 按施法距离自动补齐。
     * 只按存活与距离收窄：unitCondition 是挑目标用的，不参与「这片区域值不值得放」的判断。
     *
     * 对英雄计数时，gte 会由 dispatcher 收敛到该队伍的英雄总数。两队人数开局可配置，
     * 敌方只有 1 个英雄时「至少 2 个」这类阈值否则永远不成立，整条规则失效；
     * 满编局下声明值不超过总数，收敛不生效。开关类（action）不参与收敛，
     * 它们的开与关是一对互补阈值，只压低其中一侧会让两条规则同时成立、每 tick 反复开关。
     */
    count?: NumberRange;
    /**
     * 敌人搜索距离（相对自身），不指定时默认按技能施法范围；可用 gte/lte 约束与目标的距离
     */
    range?: NumberRange;
    /**
     * 强制允许对魔法免疫单位施法。
     * 未设置时自动读取技能 KV 的 AbilityUnitTargetFlags 判断。
     * 用途：美杜莎分裂箭等靠攻击生效的技能，KV 无 MAGIC_IMMUNE_ENEMIES 但攻击可命中魔免目标。
     */
    ignoresMagicImmune?: boolean;
    /**
     * 以技能的 AbilityValue 作为搜索半径上限，取代默认的 AbilityCastRange。
     * 适用于 NO_TARGET AoE 技能（如 axe_berserkers_call），其施法距离为 0 但实际作用半径由 KV AbilityValues 定义。
     */
    rangeFromAbilityValue?: string;
    /**
     * 将施法者攻击距离计入搜索半径。
     * 可与 rangeFromAbilityValue 组合，用于攻击距离外扩型技能。
     */
    rangeFromAttackRange?: boolean;
    /**
     * 将攻击距离计入搜索半径时额外增加的距离。
     */
    attackRangeOffset?: number;
    /**
     * 决定 POINT 技能的释放位置：
     * - 'targetPosition'（默认）：释放点 = 目标位置
     * - 'projectedOnCastRange'：
     *     - 目标距离 ≤ cast range → 释放点 = 目标位置（精准命中）
     *     - 目标距离 > cast range → 释放点 = 沿"施法者→目标"方向投影到 cast range 边缘
     *   适用于 AoE 作用半径远大于 cast range 的技能（如 tinker_march_of_the_machines、
     *   tinker_deploy_turrets），允许在更大范围搜索目标，超出 cast range 时压到边缘，
     *   让 AoE 边缘仍能扫到目标。spec 必须显式提供 target.range.lte（通常 > cast range），
     *   否则 fillRangeFromCastRange 会把搜索半径限制为 cast range，失去意义。
     * 仅对 POINT behavior 的 ability 生效；UNIT_TARGET / NO_TARGET 忽略此字段。
     */
    castMode?: 'targetPosition' | 'projectedOnCastRange';
    /**
     * 从候选中排除施法者自己。
     * 友方候选天然包含施法者且距离为 0 排在首位，以自身生命为代价的技能需要排掉。
     */
    excludeSelf?: boolean;
    /**
     * 只保留位于施法者正面（front）或背面（back）半区的目标。
     * 用于带位移的技能区分追击与撤退两种用法。
     */
    facing?: 'front' | 'back';
    /**
     * 只选落在施法者身前固定距离处圆形区域内的目标，用于朝面前固定位置生效的无目标技能。
     * 距离与半径按键名读技能数值。
     */
    aheadCircle?: { distanceValue: string; radiusValue: string };
  };
  self?: {
    unitCondition?: UnitCondition;
    /**
     * 若 self 周围该距离内存在存活的敌方英雄，则跳过施法。
     * 由 dispatcher 在 tryCast 层检查（依赖 ai.aroundEnemyHeroes 缓存）。
     */
    noEnemyHeroInRange?: number;
    /**
     * 要求 self 周围该距离内存在存活的敌方英雄才施法，是 noEnemyHeroInRange 的反面。
     * 用于本身不指向敌人、但只在交战时才该放的技能。
     */
    enemyHeroInRange?: number;
    /**
     * 要求 self 周围该距离内存在存活的己方英雄（不含自己与幻象）才施法。
     * 用于控制技能：有队友跟进输出时才有价值。
     */
    allyHeroInRange?: number;
    /**
     * 若 self 周围该距离内存在存活的己方英雄（不含自己与幻象），则跳过施法。
     * 用于受到伤害就会解除的控制，避免队友的输出把它打断。
     */
    noAllyHeroInRange?: number;
    /**
     * 若 self 周围该距离内存在存活的敌方建筑（塔/兵营等），则跳过施法。
     * 由 dispatcher 在 tryCast 层检查（依赖 ai.aroundEnemyBuildings 缓存）。
     */
    noEnemyBuildingInRange?: number;
    /**
     * 要求 self 周围存在至少指定数量的友方小兵才施法。
     * range 不填时默认取 bot-base 预搜友方小兵的半径。
     */
    friendlyCreepNearby?: {
      count?: NumberRange;
      range?: number;
    };
    /**
     * 要求施法者当前全部技能 + 主栏物品（0~5号槽）的剩余冷却时间总和落在此区间才施法
     * （如刷新球，只在冷却压力大时使用）。
     */
    cooldownTotal?: NumberRange;
    /**
     * 大招已学会且能放时跳过，用于放完会被引导锁住的技能：先把大招交出去再放它。
     */
    ultimateNotReady?: boolean;
  };
  ability?: AbilityCoindition;
  action?: {
    /**
     * 满足条件后，开启技能
     */
    toggleOn?: boolean;
    /**
     * 满足条件后，关闭技能
     */
    toggleOff?: boolean;
    /**
     * 满足条件后，开启自动施法
     */
    autoCastOn?: boolean;
  };
  debug?: boolean;
}

export interface AbilityCoindition {
  /**
   * 技能等级
   */
  level?: NumberRange;
  /**
   * 技能剩余次数
   */
  charges?: NumberRange;
}

export interface UnitCondition {
  healthPercent?: NumberRange;
  manaPercent?: NumberRange;

  hasScepter?: boolean;
  hasShard?: boolean;
  noModifier?: string[];
  notActionable?: boolean;
  /**
   * 只选行动受限的单位，给需要目标站着不动才打得满的技能接控制用。
   * hard：眩晕、变羊等无法行动；movement：无法行动、缠绕或被减速到跑不出范围。
   */
  disabled?: 'hard' | 'movement';
  /**
   * 排除远古野（大龙/小龙等）。
   */
  excludeAncient?: boolean;
  /**
   * 比较目标绝对 HP 与技能的 special value（已含天赋加成）。
   * lte: true → target.HP ≤ effectiveDamage（技能可击杀目标）
   * gte: true → target.HP ≥ effectiveDamage（目标血量超过技能伤害）
   * includeSpellAmp: true → 有效值乘以施法者法术强度（GetSpellAmplification(false) 返回增量，需 +1 得乘数）
   */
  healthAbilityValue?: {
    key: string;
    lte?: boolean;
    gte?: boolean;
    includeSpellAmp?: boolean;
  };
}

/** 只取水平面分量参与计算，Vector 天然满足该形状。 */
export interface HorizontalVector {
  x: number;
  y: number;
}

export interface NumberRange {
  gte?: number;
  lte?: number;
}

export function FilterTargetWithCondition(
  condition: CastCoindition | undefined,
  units: CDOTA_BaseNPC[],
  self: CDOTA_BaseNPC_Hero,
  ability?: CDOTABaseAbility,
): CDOTA_BaseNPC | undefined {
  const count = condition?.target?.count;
  if (count && CheckNumberRangeFailure(CountUnitsInRange(condition, units, self), count)) {
    return undefined;
  }

  const targetCondition = condition?.target;
  const range = targetCondition?.range;
  const excludeSelf = targetCondition?.excludeSelf;
  const unitCondition = targetCondition?.unitCondition;
  const facing = targetCondition?.facing;
  const aheadCircle = ability ? targetCondition?.aheadCircle : undefined;
  const aheadDistance = aheadCircle ? ability!.GetSpecialValueFor(aheadCircle.distanceValue) : 0;
  const aheadRadius = aheadCircle ? ability!.GetSpecialValueFor(aheadCircle.radiusValue) : 0;

  const selfEntityIndex = excludeSelf ? self.GetEntityIndex() : -1;
  const healthCondition = ability ? unitCondition?.healthAbilityValue : undefined;
  let healthThreshold = 0;
  if (ability && healthCondition) {
    const baseValue = ability.GetSpecialValueFor(healthCondition.key);
    // GetSpellAmplification 返回增量（如 0.15 表示 +15%），+1 得完整乘数
    healthThreshold = healthCondition.includeSpellAmp
      ? baseValue * (1 + self.GetSpellAmplification(false))
      : baseValue;
  }

  for (const unit of units) {
    // 搜索半径远大于施法距离，多数候选都倒在距离上，先筛距离可省掉后面成串的状态查询
    if (CheckNumberRangeFailure(self.GetRangeToUnit(unit), range)) {
      continue;
    }

    if (!unit.IsAlive()) {
      continue;
    }

    if (excludeSelf && unit.GetEntityIndex() === selfEntityIndex) {
      continue;
    }

    // 魔法免疫过滤：有 ability 时才检查，避免影响非 dispatcher 调用路径
    if (ability && unit.IsMagicImmune()) {
      const canPierce =
        targetCondition?.ignoresMagicImmune ||
        (ability.GetAbilityTargetFlags() & UnitTargetFlags.MAGIC_IMMUNE_ENEMIES) !== 0;
      if (!canPierce) {
        continue;
      }
    }

    if (CheckUnitConditionFailure(unit, unitCondition)) {
      continue;
    }

    // healthAbilityValue：比较目标绝对 HP 与技能的 special value
    if (healthCondition) {
      if (healthCondition.lte && unit.GetHealth() > healthThreshold) {
        continue;
      }
      if (healthCondition.gte && unit.GetHealth() < healthThreshold) {
        continue;
      }
    }

    if (
      aheadCircle &&
      CheckAheadCircleFailure(
        self.GetForwardVector(),
        unit.GetAbsOrigin().__sub(self.GetAbsOrigin()),
        aheadDistance,
        aheadRadius,
      )
    ) {
      continue;
    }

    if (
      facing &&
      CheckFacingFailure(
        facing,
        self.GetForwardVector(),
        unit.GetAbsOrigin().__sub(self.GetAbsOrigin()),
      )
    ) {
      continue;
    }

    return unit;
  }

  return undefined;
}

function CountUnitsInRange(
  condition: CastCoindition | undefined,
  units: CDOTA_BaseNPC[],
  self: CDOTA_BaseNPC_Hero,
): number {
  let total = 0;
  for (const unit of units) {
    if (!unit.IsAlive()) {
      continue;
    }
    if (condition?.target?.excludeSelf && unit.GetEntityIndex() === self.GetEntityIndex()) {
      continue;
    }
    if (CheckNumberRangeFailure(self.GetRangeToUnit(unit), condition?.target?.range)) {
      continue;
    }
    total++;
  }
  return total;
}

/**
 * 判断目标是否落在施法者朝向的指定半区。
 *
 * @param facing - 要求的半区，未指定时不过滤
 * @param forward - 施法者朝向向量
 * @param toTarget - 施法者指向目标的向量
 * @returns 不满足要求时返回 `true`
 */
/**
 * 目标是否落在施法者身前 distance 处、半径 radius 的圆外。forward 须为单位向量。
 */
export function CheckAheadCircleFailure(
  forward: HorizontalVector,
  toTarget: HorizontalVector,
  distance: number,
  radius: number,
): boolean {
  const dx = toTarget.x - forward.x * distance;
  const dy = toTarget.y - forward.y * distance;
  return dx * dx + dy * dy > radius * radius;
}

export function CheckFacingFailure(
  facing: 'front' | 'back' | undefined,
  forward: HorizontalVector,
  toTarget: HorizontalVector,
): boolean {
  if (!facing) {
    return false;
  }
  const dot = forward.x * toTarget.x + forward.y * toTarget.y;
  // 正侧方点积为 0，方位不明确，front 与 back 都判失败
  if (facing === 'front') {
    return dot <= 0;
  }
  return dot >= 0;
}

/**
 * 检查单位是否满足指定条件
 *
 * @param unit - 要检查的单位
 * @param unitCondition - 可选的条件，用于检查单位
 * @returns 如果单位检测失败，则返回 `true`，否则返回 `false`
 */
export function CheckUnitConditionFailure(
  unit: CDOTA_BaseNPC,
  unitCondition?: UnitCondition,
): boolean {
  if (!unitCondition) {
    return false;
  }

  if (CheckNumberRangeFailure(unit.GetHealthPercent(), unitCondition.healthPercent)) {
    return true;
  }
  if (CheckNumberRangeFailure(unit.GetManaPercent(), unitCondition.manaPercent)) {
    return true;
  }

  if (unitCondition.hasScepter && !unit.HasScepter()) {
    return true;
  }
  if (unitCondition.hasShard && !unit.HasModifier('modifier_item_aghanims_shard')) {
    return true;
  }
  const noModifiers = unitCondition.noModifier;
  if (noModifiers && noModifiers.some((modifier) => unit.HasModifier(modifier))) {
    return true;
  }
  if (unitCondition.notActionable && HeroUtil.NotActionable(unit)) {
    return true;
  }
  if (unitCondition.disabled === 'hard' && !HeroUtil.NotActionable(unit)) {
    return true;
  }
  if (unitCondition.disabled === 'movement' && !IsMovementImpaired(unit)) {
    return true;
  }
  if (unitCondition.excludeAncient && unit.IsAncient()) {
    return true;
  }

  return false;
}

// 后期玩家正常移速远高于此，降到这以下基本跑不出范围技能
const IMPAIRED_MOVE_SPEED = 300;

function IsMovementImpaired(unit: CDOTA_BaseNPC): boolean {
  return (
    HeroUtil.NotActionable(unit) || unit.IsRooted() || unit.GetIdealSpeed() < IMPAIRED_MOVE_SPEED
  );
}

/**
 * 检查技能是否满足指定条件
 *
 * @param ability - 要检查的技能
 * @param abilityCoindition - 可选的条件，用于检查技能
 * @returns 如果技能检测失败，则返回 `true`，否则返回 `false`
 */
export function CheckAbilityConditionFailure(
  ability: CDOTABaseAbility,
  abilityCoindition?: AbilityCoindition,
): boolean {
  if (!abilityCoindition) {
    return false;
  }

  if (CheckNumberRangeFailure(ability.GetLevel(), abilityCoindition.level)) {
    return true;
  }
  if (CheckNumberRangeFailure(ability.GetCurrentAbilityCharges(), abilityCoindition.charges)) {
    return true;
  }

  return false;
}

export function CheckNumberRangeFailure(value: number, range?: NumberRange): boolean {
  if (range?.gte !== undefined && value < range.gte) {
    return true;
  }
  if (range?.lte !== undefined && value > range.lte) {
    return true;
  }
  return false;
}

/**
 * 深度合并两个类型为 `T` 的对象，其中 `T` 扩展自 `CastCondition`。
 *
 * @param target - 要合并的目标对象，必须存在
 * @param source - 要合并的源对象，可选
 */
export function DeepMerge<T extends CastCoindition>(target: T, source?: Partial<T>): T {
  if (!source) return target;

  const result = { ...target };

  Object.keys(source).forEach((key) => {
    const targetValue = result[key as keyof T];
    const sourceValue = source[key as keyof T];

    if (sourceValue === undefined) return;

    if (isObject(targetValue) && isObject(sourceValue)) {
      if (isNumberRange(sourceValue as object)) {
        result[key as keyof T] = sourceValue as T[keyof T];
      } else {
        result[key as keyof T] = DeepMerge(
          targetValue as object,
          sourceValue as object,
        ) as T[keyof T];
      }
    } else {
      result[key as keyof T] = sourceValue as T[keyof T];
    }
  });

  return result;
}

function isObject(item: unknown): item is object {
  return item !== null && typeof item === 'object';
}

function isNumberRange(item: object): boolean {
  const keys = Object.keys(item);
  return keys.length > 0 && keys.every((k) => k === 'gte' || k === 'lte');
}

/**
 * 自定义 Lua 技能（BaseClass 为 ability_lua）的 behavior 由引擎以 64 位 userdata 返回，
 * 位运算函数只收 number，直接参与按位与会在运行时抛错。
 */
export function GetAbilityBehaviorBits(ability: CDOTABaseAbility): number {
  const raw = ability.GetBehavior();
  if (type(raw) === 'number') {
    return raw as number;
  }
  return tonumber(tostring(raw)) ?? 0;
}

export function HasAbilityBehavior(behaviorBits: number, behavior: AbilityBehavior): boolean {
  return (behaviorBits & behavior) === behavior;
}

export function IsAbilityBehavior(ability: CDOTABaseAbility, behavior: AbilityBehavior): boolean {
  return HasAbilityBehavior(GetAbilityBehaviorBits(ability), behavior);
}
