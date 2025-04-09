import React, { useEffect, useState } from 'react';
import KeySettingButton from './KeySettingButton';
import { GetLotteryStatus, SubscribeLotteryStatus } from '@utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { saveInputKeyborard } from '../hotkey';

interface KeyBindContainerProps {
  isCollapsed: boolean;
}

interface BindKeyTextArray {
  activeAbilityKey: string;
  passiveAbilityKey: string;
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
  const [bindKeyTextArray, setBindKeyTextArray] = useState<BindKeyTextArray>({
    activeAbilityKey: '',
    passiveAbilityKey: '',
  });
  console.log('KeyBindContainer bindKeyTextArray:', bindKeyTextArray);
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
        bindKeyTextArray.activeAbilityKey,
        lotteryStatus?.passiveAbilityName,
        bindKeyTextArray.passiveAbilityKey,
      );
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [lotteryStatus, bindKeyTextArray]);

  return (
    <Panel style={containerStyle} className="container">
      <KeySettingButton
        abilityname={lotteryStatus?.passiveAbilityName}
        bindKeyTextArray={bindKeyTextArray}
        setBindKeyTextArray={setBindKeyTextArray}
        lotteryStatus={lotteryStatus}
      />
      <KeySettingButton
        abilityname={lotteryStatus?.activeAbilityName}
        bindKeyTextArray={bindKeyTextArray}
        setBindKeyTextArray={setBindKeyTextArray}
        lotteryStatus={lotteryStatus}
      />
    </Panel>
  );
};

export default KeyBindContainer;
