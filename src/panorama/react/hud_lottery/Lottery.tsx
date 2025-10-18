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

  // 初始化时计算 maxPassiveCount
  const [maxPassiveCount, setMaxPassiveCount] = useState<number>(() => {
    const gameOptions = CustomNetTables.GetTableValue('game_options', 'game_options');
    if (!gameOptions) return 1;

    const startingGold = gameOptions.starting_gold_player;
    if (startingGold >= 4982 && startingGold < 5000) return 2;
    if (startingGold === 4981) return 3;
    return 1;
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 使用 useRef 来访问最新的 maxPassiveCount,避免闭包问题
  const maxPassiveCountRef = React.useRef(maxPassiveCount);
  React.useEffect(() => {
    maxPassiveCountRef.current = maxPassiveCount;
  }, [maxPassiveCount]);

  const getIsVisible = (lotteryStatus: LotteryStatusDto | null) => {
    $.Msg('=== getIsVisible Debug ===');

    if (!lotteryStatus) {
      $.Msg('No lottery status, hiding UI');
      return false;
    }

    $.Msg('isSkillResetMode: ' + lotteryStatus.isSkillResetMode);

    if (lotteryStatus.isSkillResetMode) {
      $.Msg('Skill reset mode active, showing UI');
      return true;
    }

    // 使用 ref 中的值,而不是重新计算
    const currentMaxPassiveCount = maxPassiveCountRef.current;
    const passiveCount = lotteryStatus.passiveAbilityCount || 0;
    const activeCount = lotteryStatus.activeAbilityCount || 0;


    if (activeCount>=1 && passiveCount >= currentMaxPassiveCount) {
      $.Msg('All abilities selected, hiding UI');
      return false;
    }

    $.Msg('Not all abilities selected, showing UI',passiveCount,currentMaxPassiveCount);
    $.Msg('Not all abilities selected, showing UI',activeCount);
    $.Msg('Not all abilities selected, showing UI');
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
        // 当 lottery 完成后,将 maxPassiveCount 设置为 1
        if (!data.isSkillResetMode && data.activeAbilityName && data.passiveAbilityName) {
          setMaxPassiveCount(1);
        }
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
