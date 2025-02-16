import React from 'react';
import { colors } from '@utils/colors';

export type AbilityOrItem = 'ability' | 'item';

interface LotteryAbilityItemProps {
  level: number;
  name: string;
  type: AbilityOrItem;
  pickedName: string | undefined;
}
const itemStyle = {
  width: '80px',
  flowChildren: 'down',
  margin: '20px',
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

const LotteryAbilityItem: React.FC<LotteryAbilityItemProps> = ({
  level,
  name,
  type,
  pickedName,
}) => {
  const imageStyle = {
    boxShadow: `0 0 5px ${getBoxColor(level)}`,
    borderRadius: '5px',
  };

  const handleClick = () => {
    const eventName = type === 'item' ? 'lottery_pick_item' : 'lottery_pick_ability';
    GameEvents.SendCustomGameEventToServer(eventName, { name });
  };

  const showtooltip = true;
  let className = 'BrightHover';
  if (pickedName === name) {
    className = 'Bright';
  } else if (pickedName) {
    className = 'Darker';
  }

  return (
    <Panel style={itemStyle} onactivate={handleClick}>
      {type === 'item' ? (
        <DOTAItemImage
          itemname={name}
          style={imageStyle}
          showtooltip={showtooltip}
          className={className}
        />
      ) : (
        <DOTAAbilityImage
          abilityname={name}
          style={imageStyle}
          showtooltip={showtooltip}
          className={className}
        />
      )}
    </Panel>
  );
};

export default LotteryAbilityItem;
