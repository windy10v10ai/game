import React from 'react';
import LotteryRow from './LotteryRow';

interface ContentPanelProps {
  isCollapsed: boolean;
}

const ContentContainer: React.FC<ContentPanelProps> = ({ isCollapsed }) => {
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
      {/* <!-- 中间技能和物品区域 --> */}
      <LotteryRow type="ability" />
      <LotteryRow type="item" />
    </Panel>
  );
};

export default ContentContainer;
