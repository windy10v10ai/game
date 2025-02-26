export interface LotteryStatusDto {
  // 主动技能
  activeAbilityName?: string;
  activeAbilityLevel?: number;
  isActiveAbilityRefreshed: boolean;

  // 被动技能
  passiveAbilityName?: string;
  passiveAbilityLevel?: number;
  isPassiveAbilityRefreshed: boolean;
}
