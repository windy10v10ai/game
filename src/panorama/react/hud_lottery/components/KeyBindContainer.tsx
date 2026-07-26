import React, { useEffect, useState, useRef } from 'react';
import KeySettingButton from './KeySettingButton';
import WardKeySettingButton from './WardKeySettingButton';
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

interface KeyBindSettingState {
  isRememberAbilityKey: boolean;
  activeAbilityKey: string;
  passiveAbilityKey: string;
  passiveAbilityKey2: string;
  activeAbilityQuickCast: boolean;
  passiveAbilityQuickCast: boolean;
  passiveAbilityQuickCast2: boolean;
  wardObserverKey: string;
  wardObserverQuickCast: boolean;
  wardSentryKey: string;
  wardSentryQuickCast: boolean;
  inventorySlot7Key: string;
  inventorySlot7QuickCast: boolean;
  inventorySlot8Key: string;
  inventorySlot8QuickCast: boolean;
  inventorySlot9Key: string;
  inventorySlot9QuickCast: boolean;
}

function normalizeKeyBindSetting(playerSetting: PlayerSetting): KeyBindSettingState {
  return {
    isRememberAbilityKey: playerSetting.isRememberAbilityKey,
    activeAbilityKey: playerSetting.activeAbilityKey,
    passiveAbilityKey: playerSetting.passiveAbilityKey,
    passiveAbilityKey2: playerSetting.passiveAbilityKey2 ?? '',
    activeAbilityQuickCast: playerSetting.activeAbilityQuickCast,
    passiveAbilityQuickCast: playerSetting.passiveAbilityQuickCast,
    passiveAbilityQuickCast2: playerSetting.passiveAbilityQuickCast2 ?? false,
    wardObserverKey: playerSetting.wardObserverKey ?? '',
    wardObserverQuickCast: playerSetting.wardObserverQuickCast ?? false,
    wardSentryKey: playerSetting.wardSentryKey ?? '',
    wardSentryQuickCast: playerSetting.wardSentryQuickCast ?? false,
    inventorySlot7Key: playerSetting.inventorySlot7Key ?? '',
    inventorySlot7QuickCast: playerSetting.inventorySlot7QuickCast ?? false,
    inventorySlot8Key: playerSetting.inventorySlot8Key ?? '',
    inventorySlot8QuickCast: playerSetting.inventorySlot8QuickCast ?? false,
    inventorySlot9Key: playerSetting.inventorySlot9Key ?? '',
    inventorySlot9QuickCast: playerSetting.inventorySlot9QuickCast ?? false,
  };
}

function keyBindSettingsEqual(left: KeyBindSettingState, right: KeyBindSettingState): boolean {
  return (
    left.isRememberAbilityKey === right.isRememberAbilityKey &&
    left.activeAbilityKey === right.activeAbilityKey &&
    left.passiveAbilityKey === right.passiveAbilityKey &&
    left.passiveAbilityKey2 === right.passiveAbilityKey2 &&
    left.activeAbilityQuickCast === right.activeAbilityQuickCast &&
    left.passiveAbilityQuickCast === right.passiveAbilityQuickCast &&
    left.passiveAbilityQuickCast2 === right.passiveAbilityQuickCast2 &&
    left.wardObserverKey === right.wardObserverKey &&
    left.wardObserverQuickCast === right.wardObserverQuickCast &&
    left.wardSentryKey === right.wardSentryKey &&
    left.wardSentryQuickCast === right.wardSentryQuickCast &&
    left.inventorySlot7Key === right.inventorySlot7Key &&
    left.inventorySlot7QuickCast === right.inventorySlot7QuickCast &&
    left.inventorySlot8Key === right.inventorySlot8Key &&
    left.inventorySlot8QuickCast === right.inventorySlot8QuickCast &&
    left.inventorySlot9Key === right.inventorySlot9Key &&
    left.inventorySlot9QuickCast === right.inventorySlot9QuickCast
  );
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
  const [activeAbilityKey, setActiveAbilityKey] = useState(playerSetting.activeAbilityKey);
  const [passiveAbilityKey, setPassiveAbilityKey] = useState(playerSetting.passiveAbilityKey);
  const [passiveAbilityKey2, setPassiveAbilityKey2] = useState(
    playerSetting.passiveAbilityKey2 ?? '',
  );
  const [activeAbilityQuickCast, setActiveAbilityQuickCast] = useState(
    playerSetting.activeAbilityQuickCast,
  );
  const [passiveAbilityQuickCast, setPassiveAbilityQuickCast] = useState(
    playerSetting.passiveAbilityQuickCast,
  );
  const [passiveAbilityQuickCast2, setPassiveAbilityQuickCast2] = useState(
    playerSetting.passiveAbilityQuickCast2 ?? false,
  );
  const [isRememberAbilityKey, setIsRememberAbilityKey] = useState(
    playerSetting.isRememberAbilityKey,
  );
  const [wardObserverKey, setWardObserverKey] = useState(playerSetting.wardObserverKey ?? '');
  const [wardObserverQuickCast, setWardObserverQuickCast] = useState(
    playerSetting.wardObserverQuickCast ?? false,
  );
  const [wardSentryKey, setWardSentryKey] = useState(playerSetting.wardSentryKey ?? '');
  const [wardSentryQuickCast, setWardSentryQuickCast] = useState(
    playerSetting.wardSentryQuickCast ?? false,
  );
  const [inventorySlot7Key, setInventorySlot7Key] = useState(playerSetting.inventorySlot7Key ?? '');
  const [inventorySlot7QuickCast, setInventorySlot7QuickCast] = useState(
    playerSetting.inventorySlot7QuickCast ?? false,
  );
  const [inventorySlot8Key, setInventorySlot8Key] = useState(playerSetting.inventorySlot8Key ?? '');
  const [inventorySlot8QuickCast, setInventorySlot8QuickCast] = useState(
    playerSetting.inventorySlot8QuickCast ?? false,
  );
  const [inventorySlot9Key, setInventorySlot9Key] = useState(playerSetting.inventorySlot9Key ?? '');
  const [inventorySlot9QuickCast, setInventorySlot9QuickCast] = useState(
    playerSetting.inventorySlot9QuickCast ?? false,
  );
  const [hasHydratedPlayerSetting, setHasHydratedPlayerSetting] = useState(false);
  const lastSyncedSetting = useRef<KeyBindSettingState | null>(null);

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

    const setting = normalizeKeyBindSetting(playerSetting);
    lastSyncedSetting.current = setting;
    // Player settings arrive asynchronously from the net table after Panorama mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRememberAbilityKey(setting.isRememberAbilityKey);
    setActiveAbilityKey(setting.activeAbilityKey);
    setPassiveAbilityKey(setting.passiveAbilityKey);
    setPassiveAbilityKey2(setting.passiveAbilityKey2);
    setActiveAbilityQuickCast(setting.activeAbilityQuickCast);
    setPassiveAbilityQuickCast(setting.passiveAbilityQuickCast);
    setPassiveAbilityQuickCast2(setting.passiveAbilityQuickCast2);
    setWardObserverKey(setting.wardObserverKey);
    setWardObserverQuickCast(setting.wardObserverQuickCast);
    setWardSentryKey(setting.wardSentryKey);
    setWardSentryQuickCast(setting.wardSentryQuickCast);
    setInventorySlot7Key(setting.inventorySlot7Key);
    setInventorySlot7QuickCast(setting.inventorySlot7QuickCast);
    setInventorySlot8Key(setting.inventorySlot8Key);
    setInventorySlot8QuickCast(setting.inventorySlot8QuickCast);
    setInventorySlot9Key(setting.inventorySlot9Key);
    setInventorySlot9QuickCast(setting.inventorySlot9QuickCast);
    setHasHydratedPlayerSetting(true);
  }, [hasHydratedPlayerSetting, playerSetting, playerSettingLoaded]);

  useEffect(() => {
    if (!hasHydratedPlayerSetting) {
      return;
    }

    const setting: KeyBindSettingState = {
      isRememberAbilityKey,
      activeAbilityKey,
      passiveAbilityKey,
      passiveAbilityKey2,
      activeAbilityQuickCast,
      passiveAbilityQuickCast,
      passiveAbilityQuickCast2,
      wardObserverKey,
      wardObserverQuickCast,
      wardSentryKey,
      wardSentryQuickCast,
      inventorySlot7Key,
      inventorySlot7QuickCast,
      inventorySlot8Key,
      inventorySlot8QuickCast,
      inventorySlot9Key,
      inventorySlot9QuickCast,
    };
    if (lastSyncedSetting.current && keyBindSettingsEqual(setting, lastSyncedSetting.current)) {
      return;
    }
    lastSyncedSetting.current = setting;

    GameEvents.SendCustomGameEventToServer('save_bind_ability_key', {
      isRememberAbilityKey,
      activeAbilityKey,
      passiveAbilityKey,
      passiveAbilityKey2,
      activeAbilityQuickCast,
      passiveAbilityQuickCast,
      passiveAbilityQuickCast2,
      wardObserverKey,
      wardObserverQuickCast,
      wardSentryKey,
      wardSentryQuickCast,
      inventorySlot7Key,
      inventorySlot7QuickCast,
      inventorySlot8Key,
      inventorySlot8QuickCast,
      inventorySlot9Key,
      inventorySlot9QuickCast,
    });
  }, [
    hasHydratedPlayerSetting,
    isRememberAbilityKey,
    activeAbilityKey,
    passiveAbilityKey,
    passiveAbilityKey2,
    activeAbilityQuickCast,
    passiveAbilityQuickCast,
    passiveAbilityQuickCast2,
    wardObserverKey,
    wardObserverQuickCast,
    wardSentryKey,
    wardSentryQuickCast,
    inventorySlot7Key,
    inventorySlot7QuickCast,
    inventorySlot8Key,
    inventorySlot8QuickCast,
    inventorySlot9Key,
    inventorySlot9QuickCast,
  ]);

  useEffect(() => {
    // 每秒刷新一次改键显示
    const timer = setInterval(() => {
      saveInputKeyborard(
        lotteryStatus?.activeAbilityName,
        activeAbilityKey,
        lotteryStatus?.passiveAbilityName,
        passiveAbilityKey,
        lotteryStatus?.passiveAbilityName2,
        passiveAbilityKey2,
      );
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [
    lotteryStatus,
    activeAbilityKey,
    passiveAbilityKey,
    passiveAbilityKey2,
    activeAbilityQuickCast,
    passiveAbilityQuickCast,
    passiveAbilityQuickCast2,
  ]);

  useEffect(() => {
    const refreshInventoryHotkeys = () => {
      saveInventorySlotHotkeys(inventorySlot7Key, inventorySlot8Key, inventorySlot9Key);
    };
    refreshInventoryHotkeys();
    const timer = setInterval(refreshInventoryHotkeys, 250);
    return () => {
      clearInterval(timer);
    };
  }, [inventorySlot7Key, inventorySlot8Key, inventorySlot9Key]);

  return (
    <Panel style={containerStyle} className="container">
      <Panel style={{ flowChildren: 'right' }}>
        <KeySettingButton
          abilityname={lotteryStatus?.activeAbilityName}
          bindKeyText={activeAbilityKey}
          setBindKeyText={setActiveAbilityKey}
          quickCast={activeAbilityQuickCast}
          setQuickCast={setActiveAbilityQuickCast}
        />
        <KeySettingButton
          abilityname={lotteryStatus?.passiveAbilityName}
          bindKeyText={passiveAbilityKey}
          setBindKeyText={setPassiveAbilityKey}
          quickCast={passiveAbilityQuickCast}
          setQuickCast={setPassiveAbilityQuickCast}
        />
        <KeySettingButton
          abilityname={lotteryStatus?.passiveAbilityName2}
          bindKeyText={passiveAbilityKey2}
          setBindKeyText={setPassiveAbilityKey2}
          quickCast={passiveAbilityQuickCast2}
          setQuickCast={setPassiveAbilityQuickCast2}
        />
      </Panel>
      <Panel style={{ flowChildren: 'right' }}>
        <WardKeySettingButton
          itemname="item_ward_observer"
          abilityname="ability_ward_observer_slot"
          bindKeyText={wardObserverKey}
          setBindKeyText={setWardObserverKey}
          quickCast={wardObserverQuickCast}
          setQuickCast={setWardObserverQuickCast}
        />
        <WardKeySettingButton
          itemname="item_ward_sentry"
          abilityname="ability_ward_sentry_slot"
          bindKeyText={wardSentryKey}
          setBindKeyText={setWardSentryKey}
          quickCast={wardSentryQuickCast}
          setQuickCast={setWardSentryQuickCast}
        />
      </Panel>
      <Panel style={{ flowChildren: 'right' }}>
        <InventorySlotKeySettingButton
          inventorySlot={6}
          displaySlot={7}
          bindKeyText={inventorySlot7Key}
          setBindKeyText={setInventorySlot7Key}
          quickCast={inventorySlot7QuickCast}
          setQuickCast={setInventorySlot7QuickCast}
        />
        <InventorySlotKeySettingButton
          inventorySlot={7}
          displaySlot={8}
          bindKeyText={inventorySlot8Key}
          setBindKeyText={setInventorySlot8Key}
          quickCast={inventorySlot8QuickCast}
          setQuickCast={setInventorySlot8QuickCast}
        />
        <InventorySlotKeySettingButton
          inventorySlot={8}
          displaySlot={9}
          bindKeyText={inventorySlot9Key}
          setBindKeyText={setInventorySlot9Key}
          quickCast={inventorySlot9QuickCast}
          setQuickCast={setInventorySlot9QuickCast}
        />
      </Panel>
      <KeyBindRemember
        isRememberAbilityKey={isRememberAbilityKey}
        setIsRememberAbilityKey={setIsRememberAbilityKey}
      />
    </Panel>
  );
};

export default KeyBindContainer;
