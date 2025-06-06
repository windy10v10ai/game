import React from 'react';
import { colors } from '@utils/colors';
import { AbilityItemType } from '../../../../common/dto/lottery';

interface LotteryAbilityItemProps {
  level: number;
  name: string;
  type: AbilityItemType;
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
      return colors.tier1;
    case 2:
      return colors.tier2;
    case 3:
      return colors.tier3;
    case 4:
      return colors.tier4;
    case 5:
      return colors.tier5;
    default:
      return colors.tier1;
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
    GameEvents.SendCustomGameEventToServer('lottery_pick_ability', {
      name,
      type,
      level,
    });
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
      <DOTAAbilityImage
        abilityname={name}
        style={imageStyle}
        showtooltip={showtooltip}
        className={className}
      />
    </Panel>
  );
};

export default LotteryAbilityItem;
