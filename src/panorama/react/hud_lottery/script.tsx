import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { render } from 'react-panorama-x';
import * as React from 'react';
import ItemOrAbilityList from './component/LotteryGroup';

function DrawAbilities() {
  const handleShuffleClick = () => {
    GameEvents.SendCustomGameEventToServer('lottery_refresh_item', {
      PlayerID: Game.GetLocalPlayerID(),
    });
  };

  return (
    <Panel id="DrawAbility">
      <Label id="DrawAbilityTitle" text="Choose Your Ability" />
      <Panel id="Content">
        {/* <!-- 中间技能和物品区域 --> */}
        <Panel id="LeftColumn">
          {/* <!-- 技能区域 --> */}
          <Panel style={{ flowChildren: 'right' }}>
            <Label className="ProjectName" text="项目1" />
            <ItemOrAbilityList type="ability" />
          </Panel>
          <Button className="CommonButton">
            <Label text={$.Localize('#item_choice_shuffle')} />
          </Button>

          {/* <!-- 物品区域 --> */}
          <Panel style={{ flowChildren: 'right' }}>
            <Label className="ProjectName" text="项目2" />
            <ItemOrAbilityList type="item" />
          </Panel>
          <Button className="CommonButton" onactivate={handleShuffleClick}>
            <Label text={$.Localize('#item_choice_shuffle')} />
          </Button>
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
