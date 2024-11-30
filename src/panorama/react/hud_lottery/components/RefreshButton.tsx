import React from 'react';
import { ItemOrAbility } from './LotteryRow';

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

  // TODO 根据会员 抽选状态判断是否禁用
  const isMember = false;
  const isRefreshed = false;
  const enabled = isMember && !isRefreshed;
  const imageSrc = enabled
    ? 'file://{images}/custom_game/lottery/icon_rerolltoken.png'
    : 'file://{images}/custom_game/lottery/icon_rerolltoken_disabled.png';
  return (
    <Button onactivate={handleRefreshClick} style={buttonStyle}>
      <Image src={imageSrc} style={imageStyle} />
    </Button>
  );
};

export default RefreshButton;
