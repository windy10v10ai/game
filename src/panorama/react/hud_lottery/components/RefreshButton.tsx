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

  return (
    <Button className="CommonButton" onactivate={handleRefreshClick} style={buttonStyle}>
      <Label text={labelText} />
    </Button>
  );
};

export default RefreshButton;
