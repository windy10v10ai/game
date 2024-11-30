import React from 'react';
import { ItemOrAbility } from './LotteryRow';
import { GetLotteryStatus, GetMember } from '@utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';

interface RefreshButtonProps {
  type: ItemOrAbility;
}

const buttonStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'center',
};

const imageStyle: Partial<VCSSStyleDeclaration> = {
  width: '90px',
  height: '90px',
};

const RefreshButton: React.FC<RefreshButtonProps> = ({ type }) => {
  // 刷新事件
  const refreshEventName = type === 'item' ? 'lottery_refresh_item' : 'lottery_refresh_ability';

  const handleRefreshClick = () => {
    GameEvents.SendCustomGameEventToServer(refreshEventName, {
      PlayerID: Game.GetLocalPlayerID(),
    });
  };

  // 根据会员 抽选状态判断是否禁用
  // FIXME 监听事件变化
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const member = GetMember(steamAccountId);
  const lotteryStatus = GetLotteryStatus(steamAccountId);
  const isMember = member?.enable;
  const isRefreshed =
    type === 'item' ? lotteryStatus?.isItemRefreshed : lotteryStatus?.isAbilityRefreshed;
  const enabled = isMember && !isRefreshed;
  $.Msg('isMember:', isMember, 'isRefreshed:', isRefreshed, 'enabled:', enabled);
  const imageSrc = enabled
    ? 'file://{images}/custom_game/lottery/icon_rerolltoken.png'
    : 'file://{images}/custom_game/lottery/icon_rerolltoken_disabled.png';

  // TODO tooltip
  return (
    <Button onactivate={handleRefreshClick} style={buttonStyle}>
      <Image src={imageSrc} style={imageStyle} />
    </Button>
  );
};

export default RefreshButton;
