import { LotteryStatusDto } from '../../common/dto/lottery-status';
import { MemberDto } from '../../vscripts/api/player';

const lotteryStatusTable = 'lottery_status';
function Transdata(data: NetworkedData<LotteryStatusDto>): LotteryStatusDto {
  return {
    activeAbilityName: data.activeAbilityName,
    activeAbilityLevel: data.activeAbilityLevel,
    isActiveAbilityRefreshed: Boolean(data.isActiveAbilityRefreshed),
    passiveAbilityName: data.passiveAbilityName,
    passiveAbilityLevel: data.passiveAbilityLevel,
    isPassiveAbilityRefreshed: Boolean(data.isPassiveAbilityRefreshed),
  };
}
export function GetLotteryStatus(steamAccountID: string): LotteryStatusDto | null {
  const data = CustomNetTables.GetTableValue(lotteryStatusTable, steamAccountID);
  if (!data) {
    return null;
  }

  return Transdata(data);
}
export function SubscribeLotteryStatus(
  steamAccountID: string,
  callback: (data: LotteryStatusDto) => void,
) {
  return CustomNetTables.SubscribeNetTableListener(lotteryStatusTable, (_tableName, key, value) => {
    if (key === steamAccountID && value) {
      callback(Transdata(value));
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
