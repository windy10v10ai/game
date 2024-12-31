import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { useEffect, useState } from 'react';
import ExpandButton from './components/ExpandButton';
import ContentContainer from './components/ContentContainer';
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

const getIsVisible = (lotteryStatus: LotteryStatusDto | null) => {
  if (!lotteryStatus) {
    return false;
  }

  if (lotteryStatus.pickAbilityName && lotteryStatus.pickItemName) {
    return false;
  }

  return true;
};

function Lottery() {
  const steamAccountId = GetLocalPlayerSteamAccountID();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const [containerStyle, setContainerStyle] = useState<Partial<VCSSStyleDeclaration>>(() => {
    const lotteryStatus = GetLotteryStatus(steamAccountId);
    const isVisible = getIsVisible(lotteryStatus);
    return isVisible ? containerStyleShow : containerStyleInit;
  });
  // 监听nettable数据变化
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
      <ExpandButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      <ContentContainer isCollapsed={isCollapsed} />
    </Panel>
  );
}

export default Lottery;
