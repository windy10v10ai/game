import { HeroUtil } from '../hero/hero-util';

/**
 * 施法条件，必须满足所有条件才能施法
 */
export interface CastCoindition {
  target?: {
    unitCondition?: UnitCondition;
    /**
     * 敌人数量
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
  };
  self?: {
    unitCondition?: UnitCondition;
    /**
     * 若 self 周围该距离内存在存活的敌方英雄，则跳过施法。
     * 由 dispatcher 在 tryCast 层检查（依赖 ai.aroundEnemyHeroes 缓存）。
     */
    noEnemyHeroInRange?: number;
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
  noModifier?: string;
  notActionable?: boolean;
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
  if (CheckNumberRangeFailure(units.length, condition?.target?.count)) {
    return undefined;
  }

  for (const unit of units) {
    if (!unit.IsAlive()) {
      continue;
    }
    if (!unit.CanEntityBeSeenByMyTeam(self)) {
      continue;
    }

    // 魔法免疫过滤：有 ability 时才检查，避免影响非 dispatcher 调用路径
    if (ability && unit.IsMagicImmune()) {
      const canPierce =
        condition?.target?.ignoresMagicImmune ||
        (ability.GetAbilityTargetFlags() & UnitTargetFlags.MAGIC_IMMUNE_ENEMIES) !== 0;
      if (!canPierce) {
        continue;
      }
    }

    const unitCondition = condition?.target?.unitCondition;

    if (CheckUnitConditionFailure(unit, unitCondition)) {
      continue;
    }

    // healthAbilityValue：比较目标绝对 HP 与技能的 special value
    if (ability && unitCondition?.healthAbilityValue) {
      const cond = unitCondition.healthAbilityValue;
      const baseValue = ability.GetSpecialValueFor(cond.key);
      // GetSpellAmplification 返回增量（如 0.15 表示 +15%），+1 得完整乘数
      const effectiveValue = cond.includeSpellAmp
        ? baseValue * (1 + self.GetSpellAmplification(false))
        : baseValue;
      if (cond.lte && unit.GetHealth() > effectiveValue) {
        continue;
      }
      if (cond.gte && unit.GetHealth() < effectiveValue) {
        continue;
      }
    }

    if (CheckNumberRangeFailure(self.GetRangeToUnit(unit), condition?.target?.range)) {
      continue;
    }

    return unit;
  }

  return undefined;
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
  if (unitCondition.noModifier && unit.HasModifier(unitCondition.noModifier)) {
    return true;
  }
  if (unitCondition.notActionable && HeroUtil.NotActionable(unit)) {
    return true;
  }

  return false;
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

function CheckNumberRangeFailure(value: number, range?: NumberRange): boolean {
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

export function IsAbilityBehavior(ability: CDOTABaseAbility, behavior: AbilityBehavior): boolean {
  const abilityBehavior = ability.GetBehavior() as number;
  // check is behavior bit set in abilityBehavior
  const isBitSet = (abilityBehavior & behavior) === behavior;
  return !!isBitSet;
}
