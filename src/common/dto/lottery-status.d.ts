export interface LotteryStatusDto {
  // 主动技能
  activeAbilityName?: string;
  activeAbilityLevel?: number;
  activeAbilityCount?: number; // 新增字段
  activeAbilityRefreshCount?: number; // 新增
  passiveAbilityRefreshCount?: number; // 新增
  isActiveAbilityRefreshed: boolean;

  // 被动技能
  passiveAbilityName?: string;
  passiveAbilityLevel?: number;
  passiveAbilityCount?: number; // 新增
  isPassiveAbilityRefreshed: boolean;
  // 重选模式标志
  isSkillResetMode?: boolean; // 确保有这一行
  skillResetRemovedCount?: number; // 添加这个字段
  skillResetPickedCount?: number; // 添加这个字段
}
