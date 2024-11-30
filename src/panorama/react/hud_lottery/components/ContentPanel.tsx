import React from 'react';
import LotteryRow from './LotteryRow';

interface ContentPanelProps {
  isCollapsed: boolean;
}

const titleStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center', // 标题居中
  fontSize: '30px',
  margin: '10px',
  color: 'gradient(linear, 0% 0%, 0% 100%, from(#FFFFFF), color-stop(0.6, #FFE982), to(#CA8E25))',

  textOverflow: 'shrink',
  textAlign: 'center',
  fontWeight: 'bold', // 粗体
};

const contentStyle: Partial<VCSSStyleDeclaration> = {
  flowChildren: 'down',
  margin: '10px',
};

const ContentPanel: React.FC<ContentPanelProps> = ({ isCollapsed }) => {
  const containerStyle: Partial<VCSSStyleDeclaration> = {
    // 位置
    marginTop: '25%',
    padding: '30px',
    horizontalAlign: 'center',
    verticalAlign: 'center',
    visibility: isCollapsed ? 'collapse' : 'visible',
    flowChildren: 'down',

    // 样式
    border: '2px solid #ffd700',
    borderRadius: '5px',
    boxShadow: 'inset 0 0 1px #62758B',
  };

  return (
    <Panel style={containerStyle} className="content-container">
      <Label style={titleStyle} text={$.Localize('#lottery_title')} />
      <Panel style={contentStyle}>
        {/* <!-- 中间技能和物品区域 --> */}
        <LotteryRow type="ability" />
        <LotteryRow type="item" />
      </Panel>
    </Panel>
  );
};

export default ContentPanel;
