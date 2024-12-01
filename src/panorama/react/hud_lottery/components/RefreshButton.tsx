import React from 'react';
import { ItemOrAbility } from './LotteryRow';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { MemberDto } from '../../../../vscripts/api/player';

interface RefreshButtonProps {
  type: ItemOrAbility;
  lotteryStatus: LotteryStatusDto | null;
  member: MemberDto | null;
}

const buttonStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'center',
};

const imageStyle: Partial<VCSSStyleDeclaration> = {
  width: '90px',
  height: '90px',
};

const RefreshButton: React.FC<RefreshButtonProps> = ({ type, lotteryStatus, member }) => {
  // 刷新事件
  const refreshEventName = type === 'item' ? 'lottery_refresh_item' : 'lottery_refresh_ability';

  const handleRefreshClick = () => {
    GameEvents.SendCustomGameEventToServer(refreshEventName, {
      PlayerID: Game.GetLocalPlayerID(),
    });
  };

  // 根据会员 抽选状态判断是否禁用
  // FIXME 监听事件变化
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
