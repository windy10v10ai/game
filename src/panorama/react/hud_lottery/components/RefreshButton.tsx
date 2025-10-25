import React from 'react';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { MemberDto } from '../../../../vscripts/api/player';
import { GetOpenMemberUrl } from '@utils/utils';
import { AbilityItemType } from '../../../../common/dto/lottery';
// 特殊用户 Steam ID 列表(可以刷新 100 次)
// 在文件顶部添加权限配置(与后端保持一致)
const REFRESH_TIER_CONFIGS = [
  { tier: 1, maxCount: 100, steamIds: ['116431158'] },
  { tier: 2, maxCount: 10, steamIds: ['76561198111111111', '76561198222222222'] },
  {
    tier: 3,
    maxCount: 3,
    steamIds: ['436804590', '295351477', '180074451', '92159660', '370099556'],
  },
  { tier: 4, maxCount: 2, steamIds: ['198490822'] },
];

function getMaxRefreshCount(steamAccountID: string): number {
  for (const config of REFRESH_TIER_CONFIGS) {
    if (config.steamIds.includes(steamAccountID)) {
      return config.maxCount;
    }
  }
  return 1; // 默认会员
}
interface RefreshButtonProps {
  type: AbilityItemType;
  lotteryStatus: LotteryStatusDto | null;
  member: MemberDto | null;
}

const buttonStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'bottom',
};

const imageStyle: Partial<VCSSStyleDeclaration> = {
  marginBottom: '20px',
  width: '50px',
  height: '50px',
};

const getTooltipTextToken = (
  type: AbilityItemType,
  isMember: boolean | undefined,
  isRefreshed: boolean | undefined,
  pickedName: string | undefined,
) => {
  if (!isMember) {
    return '#lottery_tooltip_ability_refresh_not_member';
  }
  if (isRefreshed) {
    return '#lottery_tooltip_ability_refresh_used';
  }
  if (pickedName) {
    return '#lottery_tooltip_ability_refresh_picked';
  }
  return '#lottery_tooltip_ability_refresh';
};

const RefreshButton: React.FC<RefreshButtonProps> = ({ type, lotteryStatus, member }) => {
  const localPlayerID = Players.GetLocalPlayer();
  const steamID = Game.GetPlayerInfo(localPlayerID).player_steamid;

  const isMember = member?.enable;
  const refreshCount =
    type === 'abilityActive'
      ? lotteryStatus?.activeAbilityRefreshCount || 0
      : lotteryStatus?.passiveAbilityRefreshCount || 0;

  const maxRefreshCount = getMaxRefreshCount(steamID);
  const isRefreshed = refreshCount >= maxRefreshCount;

  const pickedName =
    type === 'abilityActive' ? lotteryStatus?.activeAbilityName : lotteryStatus?.passiveAbilityName;

  // 添加重选模式检查
  const isSkillResetMode = lotteryStatus?.isSkillResetMode === true;

  // 在重选模式下或其他条件不满足时禁用刷新按钮
  const enabled = isMember && !isRefreshed && !pickedName && !isSkillResetMode;

  const imageSrc = enabled
    ? 'file://{images}/custom_game/lottery/icon_rerolltoken.png'
    : 'file://{images}/custom_game/lottery/icon_rerolltoken_disabled.png';

  // 提示文本 - 为特殊用户显示剩余次数
  let tooltipText: string;
  if (isMember && !pickedName && !isSkillResetMode) {
    const remainingCount = maxRefreshCount - refreshCount;
    tooltipText =
      $.Localize('#lottery_tooltip_ability_refresh') + ` (${remainingCount}/${maxRefreshCount})`;
  } else {
    const tooltipTextToken = getTooltipTextToken(type, isMember, isRefreshed, pickedName);
    tooltipText = $.Localize(tooltipTextToken);
  }

  // 刷新事件
  const refreshEventName = 'lottery_refresh_ability';

  const handleButtonClick = () => {
    $.Msg('=== RefreshButton Click Debug ===');
    $.Msg('isMember: ' + isMember);
    $.Msg('isRefreshed: ' + isRefreshed);
    $.Msg('refreshCount: ' + refreshCount);
    $.Msg('maxRefreshCount: ' + maxRefreshCount);
    $.Msg('pickedName: ' + pickedName);
    $.Msg('isSkillResetMode: ' + isSkillResetMode);
    $.Msg('enabled: ' + enabled);
    $.Msg('================================');

    if (!isMember) {
      $.DispatchEvent('ExternalBrowserGoToURL', GetOpenMemberUrl());
      return;
    }

    if (isSkillResetMode) {
      $.Msg('[RefreshButton] In skill reset mode, button should be disabled');
      return;
    }

    if (isRefreshed) {
      $.Msg('[RefreshButton] Already refreshed maximum times, ignoring click');
      return;
    }

    $.Msg('[RefreshButton] Sending refresh event');
    GameEvents.SendCustomGameEventToServer(refreshEventName, {
      type,
    });
  };

  return (
    <Button
      onactivate={handleButtonClick}
      style={buttonStyle}
      onmouseover={(panel) => $.DispatchEvent('DOTAShowTextTooltip', panel, tooltipText)}
      onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
    >
      <Image src={imageSrc} style={imageStyle} />
    </Button>
  );
};

export default RefreshButton;
