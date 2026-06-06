// 实现通过dto对net table 的存储和读取

import { LotteryStatusDto } from '../../../common/dto/lottery-status';

function Boolean(value: number): boolean {
  return value === 1;
}

export class NetTableHelper {
  public static GetLotteryStatus(steamAccountID: string): LotteryStatusDto {
    const lotteryStatusData = CustomNetTables.GetTableValue('lottery_status', steamAccountID);
    if (!lotteryStatusData) {
      return {
        isActiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed2: false,
        activePaidRefreshCount: 0,
        passivePaidRefreshCount: 0,
        passivePaidRefreshCount2: 0,
        abilityResettableCount: 0,
        showAbilityResetButton: false,
      };
    }

    return {
      activeAbilityName: lotteryStatusData.activeAbilityName,
      activeAbilityLevel: lotteryStatusData.activeAbilityLevel,
      isActiveAbilityRefreshed: Boolean(lotteryStatusData.isActiveAbilityRefreshed),
      passiveAbilityName: lotteryStatusData.passiveAbilityName,
      passiveAbilityLevel: lotteryStatusData.passiveAbilityLevel,
      isPassiveAbilityRefreshed: Boolean(lotteryStatusData.isPassiveAbilityRefreshed),
      passiveAbilityName2: lotteryStatusData.passiveAbilityName2,
      passiveAbilityLevel2: lotteryStatusData.passiveAbilityLevel2,
      isPassiveAbilityRefreshed2: Boolean(lotteryStatusData.isPassiveAbilityRefreshed2),
      activePaidRefreshCount: lotteryStatusData.activePaidRefreshCount ?? 0,
      passivePaidRefreshCount: lotteryStatusData.passivePaidRefreshCount ?? 0,
      passivePaidRefreshCount2: lotteryStatusData.passivePaidRefreshCount2 ?? 0,
      abilityResettableCount: lotteryStatusData.abilityResettableCount,
      showAbilityResetButton: Boolean(lotteryStatusData.showAbilityResetButton),
    };
  }
}
