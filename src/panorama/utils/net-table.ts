import { LotteryStatusDto } from '../../common/dto/lottery-status';
import { PlayerInfoDto } from '../../vscripts/api/player';

const lotteryStatusTable = 'lottery_status';
function TransLotteryData(data: NetworkedData<LotteryStatusDto>): LotteryStatusDto {
  return {
    activeAbilityName: data.activeAbilityName,
    activeAbilityLevel: data.activeAbilityLevel,
    isActiveAbilityRefreshed: Boolean(data.isActiveAbilityRefreshed),
    passiveAbilityName: data.passiveAbilityName,
    passiveAbilityLevel: data.passiveAbilityLevel,
    isPassiveAbilityRefreshed: Boolean(data.isPassiveAbilityRefreshed),
    // 第二个被动技能槽位
    passiveAbilityName2: data.passiveAbilityName2,
    passiveAbilityLevel2: data.passiveAbilityLevel2,
    isPassiveAbilityRefreshed2: Boolean(data.isPassiveAbilityRefreshed2),
    // 可重选技能的次数
    abilityResettableCount: data.abilityResettableCount,
    showAbilityResetButton: Boolean(data.showAbilityResetButton),
  };
}
/** @deprecated 在 React 组件中请使用 `useNetTable('lottery_status', steamAccountID)` 代替 */
export function GetLotteryStatus(steamAccountID: string): LotteryStatusDto | null {
  const data = CustomNetTables.GetTableValue(lotteryStatusTable, steamAccountID);
  if (!data) {
    return null;
  }

  return TransLotteryData(data);
}
/** @deprecated 在 React 组件中请使用 `useNetTable('lottery_status', steamAccountID)` 代替 */
export function SubscribeLotteryStatus(
  steamAccountID: string,
  callback: (data: LotteryStatusDto) => void,
) {
  return CustomNetTables.SubscribeNetTableListener(lotteryStatusTable, (_tableName, key, value) => {
    if (key === steamAccountID && value) {
      callback(TransLotteryData(value));
    }
  });
}

const playerTable = 'player_table';
function TransPlayerData(data: NetworkedData<PlayerInfoDto>): PlayerInfoDto {
  const result: PlayerInfoDto = {
    id: data.id,
    matchCount: data.matchCount,
    winCount: data.winCount,
    disconnectCount: data.disconnectCount,
    conductPoint: data.conductPoint,
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
  };
  if (data.properties != null) {
    result.properties = Object.values(data.properties);
  }
  if (data.playerSetting != null) {
    result.playerSetting = {
      isRememberAbilityKey: Boolean(data.playerSetting.isRememberAbilityKey),
      activeAbilityKey: data.playerSetting.activeAbilityKey,
      passiveAbilityKey: data.playerSetting.passiveAbilityKey,
      activeAbilityQuickCast: Boolean(data.playerSetting.activeAbilityQuickCast),
      passiveAbilityQuickCast: Boolean(data.playerSetting.passiveAbilityQuickCast),
      passiveAbilityKey2: data.playerSetting.passiveAbilityKey2,
      passiveAbilityQuickCast2: Boolean(data.playerSetting.passiveAbilityQuickCast2 ?? 0),
    };
  }
  if (data.member != null) {
    result.member = {
      steamId: data.member.steamId,
      enable: Boolean(data.member.enable),
      expireDateString: data.member.expireDateString,
      level: data.member.level,
    };
  }
  return result;
}

/** @deprecated 在 React 组件中请使用 `useNetTable('player_table', steamAccountID)` 代替 */
export function GetPlayer(steamAccountID: string): PlayerInfoDto | null {
  const playerData = CustomNetTables.GetTableValue(playerTable, steamAccountID);
  if (!playerData) {
    return null;
  }
  return TransPlayerData(playerData);
}

function Boolean(value: number): boolean {
  return value === 1;
}
