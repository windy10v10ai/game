import { AbilityItemType } from '../../../common/dto/lottery';

/**
 * AbilityItemType 字面量的运行时常量。
 * 类型契约由 common/dto/lottery.d.ts 维护，此处仅提供 vscripts 端可引用的运行时值。
 */
export const AbilityItemTypes = {
  Active: 'abilityActive' as AbilityItemType,
  Passive: 'abilityPassive' as AbilityItemType,
  Passive2: 'abilityPassive2' as AbilityItemType,
} as const;
