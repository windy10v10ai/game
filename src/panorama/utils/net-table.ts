import { LotteryStatusDto } from '../../common/dto/lottery-status';
import { MemberDto } from '../../vscripts/api/player';

export function GetLotteryStatus(steamAccountID: string): LotteryStatusDto | undefined {
  const lotteryStatusData = CustomNetTables.GetTableValue('lottery_status', steamAccountID);
  if (!lotteryStatusData) {
    return undefined;
  }

  return {
    pickItemName: lotteryStatusData.pickItemName,
    pickAbilityName: lotteryStatusData.pickAbilityName,
    isItemRefreshed: Boolean(lotteryStatusData.isItemRefreshed),
    isAbilityRefreshed: Boolean(lotteryStatusData.isAbilityRefreshed),
  };
}

export function GetMember(steamAccountID: string): MemberDto | undefined {
  const memberData = CustomNetTables.GetTableValue('member_table', steamAccountID);
  if (!memberData) {
    return undefined;
  }

  return {
    steamId: memberData.steamId,
    enable: Boolean(memberData.enable),
    expireDateString: memberData.expireDateString,
  };
}

function Boolean(value: number): boolean {
  return value === 1;
}
