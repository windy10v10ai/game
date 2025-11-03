import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React from 'react';
import { useEffect, useState } from 'react';
import ExpandButton from './components/ExpandButton';
import LotteryContainer from './components/LotteryContainer';
import { LotteryStatusDto } from '../../../common/dto/lottery-status';
import { GetLotteryStatus, SubscribeLotteryStatus } from '@utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';

const containerStyleBase: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  transitionProperty: 'transform, opacity, width, height',
  transitionDelay: '0s',
  transitionDuration: '1s',
  transitionTimingFunction: 'ease-in-out',
};

const containerStyleInit: Partial<VCSSStyleDeclaration> = {
  ...containerStyleBase,
  visibility: 'collapse',
  opacity: '0',
  transform: 'translateY(-50%)',
};

const containerStyleFadeout: Partial<VCSSStyleDeclaration> = {
  ...containerStyleBase,
  visibility: 'visible',
  opacity: '0',
  transform: 'translateY(-50%)',
};

const containerStyleShow: Partial<VCSSStyleDeclaration> = {
  ...containerStyleBase,
  visibility: 'visible',
  opacity: '1',
  transform: 'translateY(0)',
};

function Lottery() {
  const steamAccountId = GetLocalPlayerSteamAccountID();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getIsVisible = (lotteryStatus: LotteryStatusDto | null) => {
    if (!lotteryStatus) {
      return false;
    }

    // 检查是否有可用的技能重选次数，如果有则不隐藏
    const hasAbilityResetCount = lotteryStatus.abilityResettableCount > 0;
    if (hasAbilityResetCount) {
      return true;
    }

    // 检查所有技能是否都已选择
    const allAbilitiesSelected =
      lotteryStatus.activeAbilityName &&
      lotteryStatus.passiveAbilityName &&
      lotteryStatus.passiveAbilityName2;

    // 如果所有技能都已选择，隐藏 UI
    if (allAbilitiesSelected) {
      return false;
    }

    // 如果还有技能未选择，则显示 UI
    return true;
  };

  const [containerStyle, setContainerStyle] = useState<Partial<VCSSStyleDeclaration>>(() => {
    const lotteryStatus = GetLotteryStatus(steamAccountId);
    const isVisible = getIsVisible(lotteryStatus);
    return isVisible ? containerStyleShow : containerStyleInit;
  });

  // 监听 lottery 完成事件,将 maxPassiveCount 设置为 1
  useEffect(() => {
    const statusListenerId = SubscribeLotteryStatus(steamAccountId, (data) => {
      const isVisible = getIsVisible(data);
      if (isVisible) {
        setContainerStyle(containerStyleShow);
      } else {
        setContainerStyle(containerStyleFadeout);
      }
    });

    return () => {
      CustomNetTables.UnsubscribeNetTableListener(statusListenerId);
    };
  }, [steamAccountId]);

  return (
    <Panel style={containerStyle}>
      <Panel style={{ horizontalAlign: 'center', marginTop: '45px' }}>
        <ExpandButton
          textToken={isCollapsed ? '#lottery_expand' : '#lottery_collapsed'}
          toggleCollapse={toggleCollapse}
        />
      </Panel>
      <LotteryContainer isCollapsed={isCollapsed} />
    </Panel>
  );
}

export default Lottery;
