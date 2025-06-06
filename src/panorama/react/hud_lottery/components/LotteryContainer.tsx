import React from 'react';
import LotteryRow from './LotteryRow';

interface ContentPanelProps {
  isCollapsed: boolean;
}

const LotteryContainer: React.FC<ContentPanelProps> = ({ isCollapsed }) => {
  const containerStyle: Partial<VCSSStyleDeclaration> = {
    // 位置
    marginTop: '120px',
    padding: '30px',
    horizontalAlign: 'center',
    verticalAlign: 'top',
    visibility: isCollapsed ? 'collapse' : 'visible',
    flowChildren: 'down',

    // 样式
    border: '2px solid #ffd700',
    borderRadius: '5px',
    boxShadow: 'inset 0 0 1px #62758B',
  };

  return (
    <Panel style={containerStyle} className="content-container">
      <LotteryRow type="abilityActive" />
      <LotteryRow type="abilityPassive" />
    </Panel>
  );
};

export default LotteryContainer;
