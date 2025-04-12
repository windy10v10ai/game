import { LotteryStatusDto } from '../../common/dto/lottery-status';
import { MemberDto, PlayerDto } from '../../vscripts/api/player';

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
    level: data.level,
  };
}
export function GetMember(steamAccountID: string): MemberDto | null {
  const memberData = CustomNetTables.GetTableValue(memberTable, steamAccountID);
  if (!memberData) {
    return null;
  }

  return TransMemberData(memberData);
}

const playerTable = 'player_table';
function TransPlayerData(data: NetworkedData<PlayerDto>): PlayerDto {
  return {
    id: data.id,
    matchCount: data.matchCount,
    winCount: data.winCount,
    disconnectCount: data.disconnectCount,
    seasonPointTotal: data.seasonPointTotal,
    seasonLevel: data.seasonLevel,
    seasonCurrrentLevelPoint: data.seasonCurrrentLevelPoint,
    seasonNextLevelPoint: data.seasonNextLevelPoint,
    memberPointTotal: data.memberPointTotal,
    memberLevel: data.memberLevel,
    memberCurrentLevelPoint: data.memberCurrentLevelPoint,
    memberNextLevelPoint: data.memberNextLevelPoint,
    totalLevel: data.totalLevel,
    useableLevel: data.useableLevel,
    properties: Object.values(data.properties),
    playerSetting: {
      id: data.playerSetting.id,
      isRememberAbilityKey: Boolean(data.playerSetting.isRememberAbilityKey),
      activeAbilityKey: data.playerSetting.activeAbilityKey,
      passiveAbilityKey: data.playerSetting.passiveAbilityKey,
      activeAbilityQuickCast: Boolean(data.playerSetting.activeAbilityQuickCast),
      passiveAbilityQuickCast: Boolean(data.playerSetting.passiveAbilityQuickCast),
    },
  };
}
export function GetPlayer(steamAccountID: string): PlayerDto | null {
  const playerData = CustomNetTables.GetTableValue(playerTable, steamAccountID);
  if (!playerData) {
    return null;
  }
  return TransPlayerData(playerData);
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
