// 实现通过dto对net table 的存储和读取

import { LotteryStatusDto } from '../../../common/dto/lottery-status';
import { MemberDto } from '../../api/player';

export class NetTableHelper {
  public static GetLotteryStatus(steamAccountID: string): LotteryStatusDto {
    const lotteryStatusData = CustomNetTables.GetTableValue('lottery_status', steamAccountID);
    if (!lotteryStatusData) {
      return { isItemRefreshed: false, isAbilityRefreshed: false };
    }

    return {
      pickItemName: lotteryStatusData.pickItemName,
      pickAbilityName: lotteryStatusData.pickAbilityName,
      isItemRefreshed: this.Boolean(lotteryStatusData.isItemRefreshed),
      isAbilityRefreshed: this.Boolean(lotteryStatusData.isAbilityRefreshed),
    };
  }

  public static GetMember(steamAccountID: string): MemberDto {
    const memberData = CustomNetTables.GetTableValue('member_table', steamAccountID);
    if (!memberData) {
      return { steamId: 0, enable: false, expireDateString: '' };
    }

    return {
      steamId: memberData.steamId,
      enable: this.Boolean(memberData.enable),
      expireDateString: memberData.expireDateString,
    };
  }

  private static Boolean(value: number): boolean {
    return value === 1;
  }
}
