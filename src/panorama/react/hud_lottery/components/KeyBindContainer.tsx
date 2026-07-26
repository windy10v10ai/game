import React, { useEffect, useState, useRef } from 'react';
import KeySettingButton from './KeySettingButton';
import InventorySlotKeySettingButton from './InventorySlotKeySettingButton';
import KeyBindRemember from './KeyBindRemember';
import { GetLotteryStatus, SubscribeLotteryStatus } from '@utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { saveInputKeyborard, saveInventorySlotHotkeys } from '../hotkey';
import { PlayerSetting } from '../../../../vscripts/api/player';

interface KeyBindContainerProps {
  isCollapsed: boolean;
  playerSetting: PlayerSetting;
  playerSettingLoaded: boolean;
}

/** 从事件契约派生，整个 state 对象即 save_bind_ability_key 的 payload。 */
type KeyBindSettingState = Required<SaveBindAbilityKeyEventData>;

function normalizeKeyBindSetting(playerSetting: PlayerSetting): KeyBindSettingState {
  return {
    isRememberAbilityKey: playerSetting.isRememberAbilityKey,
    activeAbilityKey: playerSetting.activeAbilityKey,
    passiveAbilityKey: playerSetting.passiveAbilityKey,
    passiveAbilityKey2: playerSetting.passiveAbilityKey2 ?? '',
    activeAbilityQuickCast: playerSetting.activeAbilityQuickCast,
    passiveAbilityQuickCast: playerSetting.passiveAbilityQuickCast,
    passiveAbilityQuickCast2: playerSetting.passiveAbilityQuickCast2 ?? false,
    inventorySlot7Key: playerSetting.inventorySlot7Key ?? '',
    inventorySlot7QuickCast: playerSetting.inventorySlot7QuickCast ?? false,
    inventorySlot8Key: playerSetting.inventorySlot8Key ?? '',
    inventorySlot8QuickCast: playerSetting.inventorySlot8QuickCast ?? false,
    inventorySlot9Key: playerSetting.inventorySlot9Key ?? '',
    inventorySlot9QuickCast: playerSetting.inventorySlot9QuickCast ?? false,
  };
}

const KeyBindContainer: React.FC<KeyBindContainerProps> = ({
  isCollapsed,
  playerSetting,
  playerSettingLoaded,
}) => {
  const containerStyle: Partial<VCSSStyleDeclaration> = {
    visibility: isCollapsed ? 'collapse' : 'visible',
    flowChildren: 'down',
  };
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const [lotteryStatus, setLotteryStatus] = useState<LotteryStatusDto | null>(
    GetLotteryStatus(steamAccountId),
  );
  const [setting, setSetting] = useState<KeyBindSettingState>(() =>
    normalizeKeyBindSetting(playerSetting),
  );
  const [hasHydratedPlayerSetting, setHasHydratedPlayerSetting] = useState(false);
  const lastSyncedSetting = useRef<KeyBindSettingState | null>(null);

  // 值没变就返回原引用，React 据此跳过重渲染，同步 effect 也不会重发相同设置
  const patchSetting = (patch: Partial<KeyBindSettingState>) => {
    setSetting((current) => {
      const patchedKeys = Object.keys(patch) as (keyof KeyBindSettingState)[];
      const changed = patchedKeys.some((key) => current[key] !== patch[key]);
      return changed ? { ...current, ...patch } : current;
    });
  };

  // 监听nettable数据变化
  useEffect(() => {
    const statusListenerId = SubscribeLotteryStatus(steamAccountId, (data) => {
      setLotteryStatus(data);
    });
    return () => {
      CustomNetTables.UnsubscribeNetTableListener(statusListenerId);
    };
  }, [steamAccountId]);

  useEffect(() => {
    if (!playerSettingLoaded || hasHydratedPlayerSetting) {
      return;
    }

    const hydrated = normalizeKeyBindSetting(playerSetting);
    lastSyncedSetting.current = hydrated;
    // Player settings arrive asynchronously from the net table after Panorama mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSetting(hydrated);
    setHasHydratedPlayerSetting(true);
  }, [hasHydratedPlayerSetting, playerSetting, playerSettingLoaded]);

  useEffect(() => {
    if (!hasHydratedPlayerSetting || lastSyncedSetting.current === setting) {
      return;
    }
    lastSyncedSetting.current = setting;

    GameEvents.SendCustomGameEventToServer('save_bind_ability_key', setting);
  }, [hasHydratedPlayerSetting, setting]);

  useEffect(() => {
    // 每秒刷新一次改键显示
    const timer = setInterval(() => {
      saveInputKeyborard(
        lotteryStatus?.activeAbilityName,
        setting.activeAbilityKey,
        lotteryStatus?.passiveAbilityName,
        setting.passiveAbilityKey,
        lotteryStatus?.passiveAbilityName2,
        setting.passiveAbilityKey2,
      );
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [
    lotteryStatus,
    setting.activeAbilityKey,
    setting.passiveAbilityKey,
    setting.passiveAbilityKey2,
  ]);

  useEffect(() => {
    const refreshInventoryHotkeys = () => {
      saveInventorySlotHotkeys(
        setting.inventorySlot7Key,
        setting.inventorySlot8Key,
        setting.inventorySlot9Key,
      );
    };
    refreshInventoryHotkeys();
    const timer = setInterval(refreshInventoryHotkeys, 250);
    return () => {
      clearInterval(timer);
    };
  }, [setting.inventorySlot7Key, setting.inventorySlot8Key, setting.inventorySlot9Key]);

  return (
    <Panel style={containerStyle} className="container">
      <Panel style={{ flowChildren: 'right' }}>
        <KeySettingButton
          abilityname={lotteryStatus?.activeAbilityName}
          bindKeyText={setting.activeAbilityKey}
          setBindKeyText={(value) => patchSetting({ activeAbilityKey: value })}
          quickCast={setting.activeAbilityQuickCast}
          setQuickCast={(value) => patchSetting({ activeAbilityQuickCast: value })}
        />
        <KeySettingButton
          abilityname={lotteryStatus?.passiveAbilityName}
          bindKeyText={setting.passiveAbilityKey}
          setBindKeyText={(value) => patchSetting({ passiveAbilityKey: value })}
          quickCast={setting.passiveAbilityQuickCast}
          setQuickCast={(value) => patchSetting({ passiveAbilityQuickCast: value })}
        />
        <KeySettingButton
          abilityname={lotteryStatus?.passiveAbilityName2}
          bindKeyText={setting.passiveAbilityKey2}
          setBindKeyText={(value) => patchSetting({ passiveAbilityKey2: value })}
          quickCast={setting.passiveAbilityQuickCast2}
          setQuickCast={(value) => patchSetting({ passiveAbilityQuickCast2: value })}
        />
      </Panel>
      <Panel style={{ flowChildren: 'right' }}>
        <InventorySlotKeySettingButton
          inventorySlot={6}
          displaySlot={7}
          bindKeyText={setting.inventorySlot7Key}
          setBindKeyText={(value) => patchSetting({ inventorySlot7Key: value })}
          quickCast={setting.inventorySlot7QuickCast}
          setQuickCast={(value) => patchSetting({ inventorySlot7QuickCast: value })}
        />
        <InventorySlotKeySettingButton
          inventorySlot={7}
          displaySlot={8}
          bindKeyText={setting.inventorySlot8Key}
          setBindKeyText={(value) => patchSetting({ inventorySlot8Key: value })}
          quickCast={setting.inventorySlot8QuickCast}
          setQuickCast={(value) => patchSetting({ inventorySlot8QuickCast: value })}
        />
        <InventorySlotKeySettingButton
          inventorySlot={8}
          displaySlot={9}
          bindKeyText={setting.inventorySlot9Key}
          setBindKeyText={(value) => patchSetting({ inventorySlot9Key: value })}
          quickCast={setting.inventorySlot9QuickCast}
          setQuickCast={(value) => patchSetting({ inventorySlot9QuickCast: value })}
        />
      </Panel>
      <KeyBindRemember
        isRememberAbilityKey={setting.isRememberAbilityKey}
        setIsRememberAbilityKey={(value) => patchSetting({ isRememberAbilityKey: value })}
      />
    </Panel>
  );
};

export default KeyBindContainer;
