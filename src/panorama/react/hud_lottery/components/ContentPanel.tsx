import React from 'react';
import DrawAbilities from './DrawAbilities';

interface ContentPanelProps {
  isCollapsed: boolean;
}

const ContentPanel: React.FC<ContentPanelProps> = ({ isCollapsed }) => {
  const contentStyle: Partial<VCSSStyleDeclaration> = {
    // 位置
    marginTop: '25%',
    verticalAlign: 'center',
    // flowChildren: 'down',
    // 显示 / 隐藏 控制
    visibility: isCollapsed ? 'collapse' : 'visible',

    // 样式
    border: '2px solid #ffd700',
    borderRadius: '25px',
    // backgroundColor: '#1b1e28f2',
    boxShadow: 'inset 0 0 1px #62758B',
  };

  return (
    <Panel style={contentStyle} className="content-container">
      <DrawAbilities />
    </Panel>
  );
};

export default ContentPanel;
