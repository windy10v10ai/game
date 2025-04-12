import React, { useEffect, useState } from 'react';
import KeySettingButton from './KeySettingButton';
import KeyBindRemember from './KeyBindRemember';
import { GetLotteryStatus, SubscribeLotteryStatus } from '@utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { saveInputKeyborard } from '../hotkey';

interface KeyBindContainerProps {
  isCollapsed: boolean;
}

const KeyBindContainer: React.FC<KeyBindContainerProps> = ({ isCollapsed }) => {
  const containerStyle: Partial<VCSSStyleDeclaration> = {
    visibility: isCollapsed ? 'collapse' : 'visible',
    flowChildren: 'down',
  };
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const [lotteryStatus, setLotteryStatus] = useState<LotteryStatusDto | null>(
    GetLotteryStatus(steamAccountId),
  );
  const [activeAbilityKey, setActiveAbilityKey] = useState('');
  const [passiveAbilityKey, setPassiveAbilityKey] = useState('');
  const [isRememberAbilityKey, setIsRememberAbilityKey] = useState(true);
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

  return (
    <Panel style={containerStyle} className="container">
      <KeySettingButton
        abilityname={lotteryStatus?.activeAbilityName}
        bindKeyText={activeAbilityKey}
        setBindKeyText={setActiveAbilityKey}
      />
      <KeySettingButton
        abilityname={lotteryStatus?.passiveAbilityName}
        bindKeyText={passiveAbilityKey}
        setBindKeyText={setPassiveAbilityKey}
      />
      <KeyBindRemember
        isRememberAbilityKey={isRememberAbilityKey}
        setIsRememberAbilityKey={setIsRememberAbilityKey}
      />
    </Panel>
  );
};

export default KeyBindContainer;
