import React from 'react';
import LotteryRow from './LotteryRow';

interface ContentPanelProps {
  isCollapsed: boolean;
}

const rowStyle: Partial<VCSSStyleDeclaration> = {
  // 位置
  padding: '5px',
  horizontalAlign: 'center',
  verticalAlign: 'center',
  flowChildren: 'down',
};

const titleStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center', // 标题居中
  fontSize: '24px',
  color: 'gradient(linear, 0% 0%, 0% 100%, from(#FFFFFF), color-stop(0.6, #FFE982), to(#CA8E25))',

  textOverflow: 'shrink',
  textAlign: 'center',
  fontWeight: 'bold', // 粗体
};

const LotteryContainer: React.FC<ContentPanelProps> = ({ isCollapsed }) => {
  // 直接读取游戏选项，不需要状态和 useEffect
  const gameOptions = CustomNetTables.GetTableValue('game_options', 'game_options');
  const extraPassiveEnabled = gameOptions?.extra_passive_abilities === 1;

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
      <Panel style={rowStyle}>
        <Label style={titleStyle} text={$.Localize('#lottery_active_ability_title')} />
        <LotteryRow type="abilityActive" />
      </Panel>
      <Panel style={rowStyle}>
        <Label style={titleStyle} text={$.Localize('#lottery_passive_ability_title')} />
        <LotteryRow type="abilityPassive" />
        {extraPassiveEnabled && <LotteryRow type="abilityPassive2" />}
      </Panel>
    </Panel>
  );
};

export default LotteryContainer;
