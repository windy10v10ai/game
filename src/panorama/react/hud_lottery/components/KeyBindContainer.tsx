import React, { useEffect, useState } from 'react';
import KeySettingButton from './KeySettingButton';
import KeyBindRemember from './KeyBindRemember';
import { GetLotteryStatus, GetPlayer, SubscribeLotteryStatus } from '@utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { saveInputKeyborard } from '../hotkey';

interface KeyBindContainerProps {
  isCollapsed: boolean;
}

const KeyBindContainer: React.FC<KeyBindContainerProps> = ({ isCollapsed }) => {
  const playerSetting = GetPlayer(GetLocalPlayerSteamAccountID())?.playerSetting ?? {
    isRememberAbilityKey: true,
    activeAbilityKey: '',
    passiveAbilityKey: '',
    activeAbilityQuickCast: false,
    passiveAbilityQuickCast: false,
  };

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
  const [activeAbilityQuickCast, setActiveAbilityQuickCast] = useState(
    playerSetting.activeAbilityQuickCast,
  );
  const [passiveAbilityQuickCast, setPassiveAbilityQuickCast] = useState(
    playerSetting.passiveAbilityQuickCast,
  );
  const [isRememberAbilityKey, setIsRememberAbilityKey] = useState(
    playerSetting.isRememberAbilityKey,
  );
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
    // 每秒刷新一次改键显示
    const timer = setInterval(() => {
      saveInputKeyborard(
        lotteryStatus?.activeAbilityName,
        activeAbilityKey,
        lotteryStatus?.passiveAbilityName,
        passiveAbilityKey,
      );
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [lotteryStatus, activeAbilityKey, passiveAbilityKey, isRememberAbilityKey]);

  // 发送快捷键设置到服务器端进行保存
  useEffect(() => {
    GameEvents.SendCustomGameEventToServer('save_bind_ability_key', {
      isRememberAbilityKey,
      activeAbilityKey,
      passiveAbilityKey,
      activeAbilityQuickCast,
      passiveAbilityQuickCast,
    });
  }, [
    isRememberAbilityKey,
    activeAbilityKey,
    passiveAbilityKey,
    activeAbilityQuickCast,
    passiveAbilityQuickCast,
  ]);

  return (
    <Panel style={containerStyle} className="container">
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
      <KeyBindRemember
        isRememberAbilityKey={isRememberAbilityKey}
        setIsRememberAbilityKey={setIsRememberAbilityKey}
      />
    </Panel>
  );
};

export default KeyBindContainer;
