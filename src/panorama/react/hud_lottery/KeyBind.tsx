import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { useState, useEffect } from 'react';
import ExpandButton from './components/ExpandButton';
import KeyBindContainer from './components/KeyBindContainer';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { GetPlayer } from '@utils/net-table';

const containerStyle: Partial<VCSSStyleDeclaration> = {
  flowChildren: 'down',
  horizontalAlign: 'left',
  verticalAlign: 'bottom',
  marginBottom: '270px',
};

function KeyBind() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const playerSetting = GetPlayer(GetLocalPlayerSteamAccountID())?.playerSetting ?? {
    isRememberAbilityKey: false,
    activeAbilityKey: '',
    passiveAbilityKey: '',
    activeAbilityQuickCast: false,
    passiveAbilityQuickCast: false,
  };

  useEffect(() => {
    // 如果快捷键有设置，则默认折叠
    if (playerSetting.activeAbilityKey || playerSetting.passiveAbilityKey) {
      setIsCollapsed(true);
    }
  }, [playerSetting.activeAbilityKey, playerSetting.passiveAbilityKey]);

  // 获取玩家steamId，如果获取失败，则为观战，不显示
  const steamAccountId = GetLocalPlayerSteamAccountID();
  if (!steamAccountId) {
    return null;
  }

  return (
    <Panel style={containerStyle}>
      <KeyBindContainer isCollapsed={isCollapsed} playerSetting={playerSetting} />
      <Panel style={{ horizontalAlign: 'left', verticalAlign: 'bottom' }}>
        <ExpandButton
          textToken={isCollapsed ? '#key_bind' : '#key_bind_collapsed'}
          toggleCollapse={toggleCollapse}
        />
      </Panel>
    </Panel>
  );
}

export default KeyBind;
