// 实现通过dto对net table 的存储和读取

import { LotteryStatusDto } from '../../../common/dto/lottery-status';
import { MemberDto } from '../../api/player';

function Boolean(value: number): boolean {
  return value === 1;
}

export class NetTableHelper {
  public static GetLotteryStatus(steamAccountID: string): LotteryStatusDto {
    const lotteryStatusData = CustomNetTables.GetTableValue('lottery_status', steamAccountID);
    if (!lotteryStatusData) {
      return { isActiveAbilityRefreshed: false, isPassiveAbilityRefreshed: false };
    }

    return {
      activeAbilityName: lotteryStatusData.activeAbilityName,
      activeAbilityLevel: lotteryStatusData.activeAbilityLevel,
      isActiveAbilityRefreshed: Boolean(lotteryStatusData.isActiveAbilityRefreshed),
      passiveAbilityName: lotteryStatusData.passiveAbilityName,
      passiveAbilityLevel: lotteryStatusData.passiveAbilityLevel,
      isPassiveAbilityRefreshed: Boolean(lotteryStatusData.isPassiveAbilityRefreshed),
    };
  }

  public static GetMember(steamAccountID: string): MemberDto {
    const memberData = CustomNetTables.GetTableValue('member_table', steamAccountID);
    if (!memberData) {
      return { steamId: 0, enable: false, expireDateString: '' };
    }

    return {
      steamId: memberData.steamId,
      enable: Boolean(memberData.enable),
      expireDateString: memberData.expireDateString,
    };
  }
}
