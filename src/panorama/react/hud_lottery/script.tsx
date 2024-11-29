import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { render } from 'react-panorama-x';
import * as React from 'react';
import ItemOrAbilityList from './components/LotteryGroup';

function DrawAbilities() {
  return (
    <Panel id="DrawAbility">
      <Label id="DrawAbilityTitle" text="Choose Your Ability" />
      <Panel id="Content">
        {/* <!-- 中间技能和物品区域 --> */}
        <Panel id="LeftColumn">
          {/* <!-- 技能区域 --> */}
          <ItemOrAbilityList type="ability" />

          {/* <!-- 物品区域 --> */}
          <ItemOrAbilityList type="item" />
        </Panel>
      </Panel>
    </Panel>
  );
}
function DrawAbility() {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  return (
    <Panel id="CollapseContainer" className={isCollapsed ? 'collapsed' : 'expanded'}>
      <Button className="CollapseButton" onactivate={toggleCollapse}>
        <Label text={isCollapsed ? '展开' : '折叠'} />
      </Button>

      {!isCollapsed && (
        <Panel id="Content">
          {/* 展开后显示的内容 */}
          <DrawAbilities />
        </Panel>
      )}
    </Panel>
  );
}

render(<DrawAbility />, $.GetContextPanel());
