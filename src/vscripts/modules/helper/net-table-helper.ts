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
        skillResetRemovedCount: 0,
        skillResetPickedCount: 0,
        isSkillResetMode: false,
      };
    }

    return {
      activeAbilityName: lotteryStatusData.activeAbilityName,
      activeAbilityLevel: lotteryStatusData.activeAbilityLevel,
      activeAbilityCount: lotteryStatusData.activeAbilityCount ?? 0,
      isActiveAbilityRefreshed: Boolean(lotteryStatusData.isActiveAbilityRefreshed),
      passiveAbilityName: lotteryStatusData.passiveAbilityName,
      passiveAbilityLevel: lotteryStatusData.passiveAbilityLevel,
      passiveAbilityCount: lotteryStatusData.passiveAbilityCount ?? 0, // 添加这一行
      isPassiveAbilityRefreshed: Boolean(lotteryStatusData.isPassiveAbilityRefreshed),
      skillResetRemovedCount: lotteryStatusData.skillResetRemovedCount ?? 0,
      skillResetPickedCount: lotteryStatusData.skillResetPickedCount ?? 0,
      isSkillResetMode: Boolean(lotteryStatusData.isSkillResetMode ?? 0),
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
