import * as React from 'react';
import ItemOrAbilityList from './LotteryGroup';

function DrawAbilities() {
  const contentStyle: Partial<VCSSStyleDeclaration> = {
    flowChildren: 'right' /* 确保内容按顺序排列 */,
    marginTop: '50px',
  };

  const drawAbilityStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'center',
    verticalAlign: 'center',
    margin: '0 auto',
    padding: '20px',
    border: '2px solid #000',
  };

  const drawAbilityTitleStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'center', // 标题居中
    fontSize: '30px',
    marginTop: '0px',
    marginBottom: '20px',
    color: '#ffffff',
    fontWeight: 'bold', // 粗体
  };
  const leftColumnStyle: Partial<VCSSStyleDeclaration> = {
    flowChildren: 'down' /* 左侧项目名垂直排列 */,
    marginRight: '20px',
  };

  return (
    <Panel style={drawAbilityStyle}>
      <Label style={drawAbilityTitleStyle} text="Choose Your Ability" />
      <Panel style={contentStyle}>
        {/* <!-- 中间技能和物品区域 --> */}
        <Panel style={leftColumnStyle}>
          {/* <!-- 技能区域 --> */}
          <ItemOrAbilityList type="ability" />

          {/* <!-- 物品区域 --> */}
          <ItemOrAbilityList type="item" />
        </Panel>
      </Panel>
    </Panel>
  );
}

export default DrawAbilities;
