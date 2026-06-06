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

  // 各槽位已付费刷新的次数，决定下次累进消耗；洗技能(reset)后归零
  activePaidRefreshCount: number;
  passivePaidRefreshCount: number;
  passivePaidRefreshCount2: number;

  // 可重选技能的次数
  abilityResettableCount: number;
  showAbilityResetButton: boolean;
}
