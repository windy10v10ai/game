import React from 'react';
import { ItemOrAbility } from './LotteryRow';

interface RefreshButtonProps {
  type: ItemOrAbility;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ type }) => {
  const labelTextToken = type === 'item' ? '#lottery_item_refresh' : '#lottery_ability_refresh';
  const labelText = $.Localize(labelTextToken);

  const refreshEventName = type === 'item' ? 'lottery_refresh_item' : 'lottery_refresh_ability';

  const handleRefreshClick = () => {
    GameEvents.SendCustomGameEventToServer(refreshEventName, {
      PlayerID: Game.GetLocalPlayerID(),
    });
  };

  const buttonStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'center',
    verticalAlign: 'center',
  };

  const imageStyle: Partial<VCSSStyleDeclaration> = {
    width: '100px',
    height: '100px',
  };

  return (
    <Button onactivate={handleRefreshClick} style={buttonStyle}>
      <Image
        src="file://{images}/compendium/international2023/icon_rerolltoken.png"
        style={imageStyle}
      />
    </Button>
  );
};

export default RefreshButton;
