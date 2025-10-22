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

  // FIXME 重构技能重选功能
  // 重选模式标志
  isSkillResetMode?: boolean;
  skillResetRemovedCount?: number;
  skillResetPickedCount?: number;
}
