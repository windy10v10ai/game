import { LotteryStatusDto } from '../../common/dto/lottery-status';
import { MemberDto } from '../../vscripts/api/player';

const lotteryStatusTable = 'lottery_status';
function TransLotteryStatusData(data: NetworkedData<LotteryStatusDto>): LotteryStatusDto {
  return {
    pickItemName: data.pickItemName,
    pickAbilityName: data.pickAbilityName,
    isItemRefreshed: Boolean(data.isItemRefreshed),
    isAbilityRefreshed: Boolean(data.isAbilityRefreshed),
  };
}
export function GetLotteryStatus(steamAccountID: string): LotteryStatusDto | null {
  const lotteryStatusData = CustomNetTables.GetTableValue(lotteryStatusTable, steamAccountID);
  if (!lotteryStatusData) {
    return null;
  }

  return TransLotteryStatusData(lotteryStatusData);
}
export function SubscribeLotteryStatus(
  steamAccountID: string,
  callback: (data: LotteryStatusDto) => void,
) {
  return CustomNetTables.SubscribeNetTableListener(lotteryStatusTable, (_tableName, key, value) => {
    if (key === steamAccountID && value) {
      callback(TransLotteryStatusData(value));
    }
  });
}

const memberTable = 'member_table';
function TransMemberData(data: NetworkedData<MemberDto>): MemberDto {
  return {
    steamId: data.steamId,
    enable: Boolean(data.enable),
    expireDateString: data.expireDateString,
  };
}
export function GetMember(steamAccountID: string): MemberDto | null {
  const memberData = CustomNetTables.GetTableValue(memberTable, steamAccountID);
  if (!memberData) {
    return null;
  }

  return TransMemberData(memberData);
}
export function SubscribeMember(steamAccountID: string, callback: (data: MemberDto) => void) {
  return CustomNetTables.SubscribeNetTableListener(memberTable, (_tableName, key, value) => {
    if (key === steamAccountID && value) {
      callback(TransMemberData(value));
    }
  });
}

function Boolean(value: number): boolean {
  return value === 1;
}
