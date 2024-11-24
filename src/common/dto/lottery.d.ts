export interface LotteryDto {
  // 物品抽选
  itemNamesNormal: string[];
  itemNamesMember: string[];
  pickItemName: string | undefined;

  // 技能抽选
  // abilityNamesNormal: string[];
  // abilityNamesMember: string[];
  // pickAbilityName: string;
}
