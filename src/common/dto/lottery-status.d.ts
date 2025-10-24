export interface LotteryStatusDto {
  // 主动技能
  activeAbilityName?: string;
  activeAbilityLevel?: number;
  isActiveAbilityRefreshed: boolean;

  // 被动技能槽位1（原始被动技能）
  passiveAbilityName?: string;
  passiveAbilityLevel?: number;
  isPassiveAbilityRefreshed: boolean;

  // 被动技能槽位2（额外被动技能，当启用额外被动选项时）
  passiveAbilityName2?: string;
  passiveAbilityLevel2?: number;
  isPassiveAbilityRefreshed2: boolean;

  // 可重选技能的次数
  abilityResettableCount: number;
  showAbilityResetButton: boolean;
}
