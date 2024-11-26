import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { render } from 'react-panorama-x';
import * as React from 'react';
import ItemOrAbilityList from './component/ItemOrAbilityList';

const abilities = [
  { name: 'rattletrap_hookshot', displayName: 'Ability 1' },
  { name: 'sandking_burrowstrike', displayName: 'Ability 2' },
  { name: 'sandking_sand_storm', displayName: 'Ability 3' },
  { name: 'shredder_chakram', displayName: 'Ability 4' },
  { name: 'crystal_maiden_frostbite', displayName: 'Ability 5' },
];

const items = [
  { name: 'item_great_famango', displayName: 'items 1' },
  { name: 'item_great_famango', displayName: 'items 2' },
  { name: 'item_great_famango', displayName: 'items 3' },
  { name: 'item_great_famango', displayName: 'items 4' },
  { name: 'item_great_famango', displayName: 'items 5' },
];

function DrawAbilities() {
  return (
    <Panel id="DrawAbility">
      <Label id="DrawAbilityTitle" text="Choose Your Ability" />
      <Panel id="Content">
        {/* <!-- 中间技能和物品区域 --> */}
        <Panel id="LeftColumn">
          {/* <!-- 技能区域 --> */}
          <Panel style={{ flowChildren: 'right' }}>
            <Label className="ProjectName" text="项目1" />
            <ItemOrAbilityList data={abilities} type="ability" />
          </Panel>
          <Button className="CommonButton">
            <Label text={$.Localize('#item_choice_shuffle')} />
          </Button>

          {/* <!-- 物品区域 --> */}
          <Panel style={{ flowChildren: 'right' }}>
            <Label className="ProjectName" text="项目2" />
            <ItemOrAbilityList data={items} type="item" />
          </Panel>
          <Button className="CommonButton">
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
