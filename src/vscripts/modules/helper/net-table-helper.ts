// 实现通过dto对net table 的存储和读取

import { LotteryStatusDto } from '../../../common/dto/lottery-status';
import { MemberDto, MemberLevel } from '../../api/player';

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
      abilityResettableCount: lotteryStatusData.abilityResettableCount,
      showAbilityResetButton: Boolean(lotteryStatusData.showAbilityResetButton),
      // 【新增】
      activeAbilityRefreshCount: lotteryStatusData.activeAbilityRefreshCount,
      passiveAbilityRefreshCount: lotteryStatusData.passiveAbilityRefreshCount,
      passiveAbilityRefreshCount2: lotteryStatusData.passiveAbilityRefreshCount2,
      maxRefreshCount: lotteryStatusData.maxRefreshCount,
    };
  }

  public static GetMember(steamAccountID: string): MemberDto {
    const memberData = CustomNetTables.GetTableValue('member_table', steamAccountID);
    if (!memberData) {
      return { steamId: 0, enable: false, expireDateString: '', level: MemberLevel.NORMAL };
    }

    return {
      steamId: memberData.steamId,
      enable: Boolean(memberData.enable),
      expireDateString: memberData.expireDateString,
      level: memberData.level,
    };
  }
}
