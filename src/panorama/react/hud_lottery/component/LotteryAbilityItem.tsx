import React from 'react';
import { colors } from '@utils/colors';

export type AbilityOrItem = 'ability' | 'item';

interface LotteryAbilityItemProps {
  level: number;
  name: string;
  type: AbilityOrItem;
}
const itemStyle = {
  width: '80px',
  flowChildren: 'down',
  marginRight: '20px',
  marginTop: '20px',
};

const getBoxColor = (level: number) => {
  switch (level) {
    case 1:
      return colors.grey;
    case 2:
      return colors.blue;
    case 3:
      return colors.purple;
    case 4:
      return colors.gold;
    case 5:
      return colors.orange;
    default:
      return colors.grey;
  }
};

const LotteryAbilityItem: React.FC<LotteryAbilityItemProps> = ({ level, name, type }) => {
  const imageStyle = {
    boxShadow: `0 0 5px ${getBoxColor(level)}`,
  };

  const handleClick = () => {
    const eventName = type === 'item' ? 'lottery_pick_item' : 'lottery_pick_ability';
    GameEvents.SendCustomGameEventToServer(eventName, { name });
  };

  return (
    <Panel style={itemStyle} onactivate={handleClick}>
      {type === 'item' ? (
        <DOTAItemImage itemname={name} style={imageStyle} />
      ) : (
        <DOTAAbilityImage abilityname={name} style={imageStyle} />
      )}
    </Panel>
  );
};

export default LotteryAbilityItem;
