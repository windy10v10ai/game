import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { render } from 'react-panorama-x';
import React, { useEffect, useState } from 'react';
import ExpandButton from './components/ExpandButton';
import ContentContainer from './components/ContentContainer';
import { LotteryStatusDto } from '../../../common/dto/lottery-status';
import { GetLotteryStatus, SubscribeLotteryStatus } from '@utils/net-table';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';

function Lottery() {
  const steamAccountId = GetLocalPlayerSteamAccountID();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lotteryStatus, setLotteryStatus] = useState<LotteryStatusDto | null>(
    GetLotteryStatus(steamAccountId),
  );

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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

  let isVisible = true;

  if (!lotteryStatus) {
    isVisible = false;
  } else if (lotteryStatus.pickAbilityName && lotteryStatus.pickItemName) {
    isVisible = false;
  }

  const collapseContainerStyle: Partial<VCSSStyleDeclaration> = {
    horizontalAlign: 'center',
    visibility: isVisible ? 'visible' : 'collapse',
  };

  return (
    <Panel style={collapseContainerStyle}>
      <ExpandButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      <ContentContainer isCollapsed={isCollapsed} />
    </Panel>
  );
}

render(<Lottery />, $.GetContextPanel());
