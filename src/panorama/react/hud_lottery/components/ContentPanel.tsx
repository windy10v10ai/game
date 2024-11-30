import React from 'react';
import LotteryRow from './LotteryRow';

interface ContentPanelProps {
  isCollapsed: boolean;
}

const contentStyle: Partial<VCSSStyleDeclaration> = {
  flowChildren: 'right' /* 确保内容按顺序排列 */,
  marginTop: '50px',
};

const drawAbilityTitleStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center', // 标题居中
  fontSize: '30px',
  marginTop: '0px',
  marginBottom: '20px',
  color: 'gradient(linear, 0% 0%, 0% 100%, from(#FFFFFF), color-stop(0.6, #FFE982), to(#CA8E25))',

  textOverflow: 'shrink',
  textAlign: 'center',
  fontWeight: 'bold', // 粗体
};
const leftColumnStyle: Partial<VCSSStyleDeclaration> = {
  flowChildren: 'down' /* 左侧项目名垂直排列 */,
  marginRight: '20px',
};

const ContentPanel: React.FC<ContentPanelProps> = ({ isCollapsed }) => {
  const containerStyle: Partial<VCSSStyleDeclaration> = {
    // 位置
    marginTop: '25%',
    padding: '20px',
    horizontalAlign: 'center',
    verticalAlign: 'center',
    visibility: isCollapsed ? 'collapse' : 'visible',

    // 样式
    border: '2px solid #ffd700',
    borderRadius: '5px',
    boxShadow: 'inset 0 0 1px #62758B',
  };

  return (
    <Panel style={containerStyle} className="content-container">
      <Label style={drawAbilityTitleStyle} text={$.Localize('#lottery_title')} />
      <Panel style={contentStyle}>
        {/* <!-- 中间技能和物品区域 --> */}
        <Panel style={leftColumnStyle}>
          {/* <!-- 技能区域 --> */}
          <LotteryRow type="ability" />

          {/* <!-- 物品区域 --> */}
          <LotteryRow type="item" />
        </Panel>
      </Panel>
    </Panel>
  );
};

export default ContentPanel;
