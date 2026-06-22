import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { useState } from 'react';
import ExpandButton from './components/ExpandButton';
import KeyBindContainer from './components/KeyBindContainer';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { useNetTable } from '../shared/hooks/useNetTable';

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

  const steamAccountId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamAccountId);
  const playerSetting = player?.playerSetting ?? {
    isRememberAbilityKey: false,
    activeAbilityKey: '',
    passiveAbilityKey: '',
    passiveAbilityKey2: '',
    activeAbilityQuickCast: false,
    passiveAbilityQuickCast: false,
    passiveAbilityQuickCast2: false,
  };

  // 仅首次加载到玩家数据时判断一次：已有任一快捷键设置就默认折叠；之后修改键位不再自动折叠
  const [hasCheckedInitialKeys, setHasCheckedInitialKeys] = useState(false);
  if (!hasCheckedInitialKeys && player) {
    setHasCheckedInitialKeys(true);
    if (
      playerSetting.activeAbilityKey ||
      playerSetting.passiveAbilityKey ||
      playerSetting.passiveAbilityKey2 ||
      playerSetting.wardObserverKey ||
      playerSetting.wardSentryKey
    ) {
      setIsCollapsed(true);
    }
  }

  // 获取玩家steamId，如果获取失败，则为观战，不显示
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
