import React, { useEffect, useState, useRef } from 'react';
import KeySettingButton from './KeySettingButton';
import KeyBindRemember from './KeyBindRemember';
import { GetLotteryStatus, SubscribeLotteryStatus } from '@utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { saveInputKeyborard } from '../hotkey';
import { PlayerSetting } from '../../../../vscripts/api/player';

interface KeyBindContainerProps {
  isCollapsed: boolean;
  playerSetting: PlayerSetting;
}

const KeyBindContainer: React.FC<KeyBindContainerProps> = ({ isCollapsed, playerSetting }) => {
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
  const isFirstRender = useRef(true);

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
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    GameEvents.SendCustomGameEventToServer('save_bind_ability_key', {
      isRememberAbilityKey,
      activeAbilityKey,
      passiveAbilityKey,
      passiveAbilityKey2,
      activeAbilityQuickCast,
      passiveAbilityQuickCast,
      passiveAbilityQuickCast2,
    });
  }, [
    isRememberAbilityKey,
    activeAbilityKey,
    passiveAbilityKey,
    passiveAbilityKey2,
    activeAbilityQuickCast,
    passiveAbilityQuickCast,
    passiveAbilityQuickCast2,
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
      <KeyBindRemember
        isRememberAbilityKey={isRememberAbilityKey}
        setIsRememberAbilityKey={setIsRememberAbilityKey}
      />
    </Panel>
  );
};

export default KeyBindContainer;
