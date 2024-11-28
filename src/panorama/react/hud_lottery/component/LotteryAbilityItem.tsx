import React from 'react';
// import colors from './colors.less';

export type AbilityOrItem = 'ability' | 'item';

interface LotteryAbilityItemProps {
  index: number;
  name: string;
  type: AbilityOrItem;
}
const itemStyle = {
  width: '80px',
  flowChildren: 'down',
  marginRight: '20px',
  marginTop: '20px',
};

const LotteryAbilityItem: React.FC<LotteryAbilityItemProps> = ({ index, name, type }) => {
  const boxShadow = index >= 2 ? '0 0 5px #ffd700' : '0 0 5px #a029af';
  //   const boxColor = index >= 2 ? colors.gold : colors.purple;
  //   const boxShadow = `0 0 5px ${boxColor}`;
  return (
    <Panel style={itemStyle}>
      {type === 'item' ? (
        <DOTAItemImage itemname={name} style={{ boxShadow }} />
      ) : (
        <DOTAAbilityImage abilityname={name} />
      )}
    </Panel>
  );
};

export default LotteryAbilityItem;
