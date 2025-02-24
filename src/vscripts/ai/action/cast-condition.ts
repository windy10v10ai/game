/**
 * 施法条件，必须满足所有条件才能施法
 */
export interface CastCoindition {
  target?: {
    unitCondition?: UnitCondition;
    /**
     * 敌人搜索范围
     */
    range?: number;
    /**
     * 敌人数量
     */
    count: NumberRange;
  };
  self?: {
    unitCondition?: UnitCondition;
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
   * 技能剩余次数大于等于该值
   */
  charges?: NumberRange;
}

export interface UnitCondition {
  healthPercent?: NumberRange;
  manaPercent?: NumberRange;

  hasScepter?: boolean;
  hasShard?: boolean;
  noModifier?: string;
}

export interface NumberRange {
  gte?: number;
  lte?: number;
}

export function FilterTargetWithCondition(
  condition: CastCoindition | undefined,
  units: CDOTA_BaseNPC[],
  self: CDOTA_BaseNPC_Hero,
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

    const unitCondition = condition?.target?.unitCondition;

    if (CheckUnitConditionFailure(unit, unitCondition)) {
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
 * @returns 如果单位满足所有指定条件，则返回 `true`，否则返回 `false`
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
      result[key as keyof T] = DeepMerge(
        targetValue as object,
        sourceValue as object,
      ) as T[keyof T];
    } else {
      result[key as keyof T] = sourceValue as T[keyof T];
    }
  });

  return result;
}

function isObject(item: unknown): item is object {
  return item !== null && typeof item === 'object';
}
