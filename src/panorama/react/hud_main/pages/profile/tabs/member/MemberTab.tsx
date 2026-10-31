import React, { useState } from 'react';
import { SubTabNavigation } from '../../../../../shared/components';
import { useDataOffline } from '../../../../../shared/hooks/useDataOffline';
import { useNetTable } from '../../../../../shared/hooks/useNetTable';
import { usePlayerInfoRefresh } from '../../../../../shared/hooks/usePlayerInfoRefresh';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { MemberLevel, MemberSubTab, MEMBER_SUB_TABS } from './constants';
import { StatusPage } from './StatusPage';
import { SubscribePage } from './SubscribePage';
import { PointsPage } from './PointsPage';

// 模块级缓存：MemberTab unmount/remount 之间保留上一次的 sub tab 选择
let lastMemberSubTab: MemberSubTab = 'status';

interface MemberTabProps {
  // 外部跳转指定的初始子页（如积分不足跳转 'points'），优先于模块级缓存
  initialSubTab?: MemberSubTab;
}

export function MemberTab({ initialSubTab }: MemberTabProps) {
  const [subTab, setSubTabRaw] = useState<MemberSubTab>(initialSubTab ?? lastMemberSubTab);
  const setSubTab = (next: MemberSubTab) => {
    lastMemberSubTab = next;
    setSubTabRaw(next);
  };
  const { refreshing, refresh: handleRefresh, canRefresh } = usePlayerInfoRefresh();
  // 开通与购买都要经服务端下单，读不到服务端时只留状态页
  const offline = useDataOffline();
  const subTabs = offline ? MEMBER_SUB_TABS.filter((t) => t.id === 'status') : MEMBER_SUB_TABS;
  // 抽奖积分不足会直接跳 'points'，离线时兜回状态页
  const activeSubTab = offline ? 'status' : subTab;

  const steamId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamId);
  const member = player?.member;

  const enable = member?.enable === true;
  const level = Number(member?.level ?? 0);
  const expireDate = member?.expireDateString ?? '';

  const hasBaseBenefit = enable && level >= MemberLevel.NORMAL; // 普通或高级会员
  const isPremium = enable && level >= MemberLevel.PREMIUM; // 仅高级会员
  const isNormalOnly = hasBaseBenefit && !isPremium; // 仅普通会员

  const statusText = isPremium
    ? $.Localize('#member_status_premium')
    : hasBaseBenefit
      ? $.Localize('#member_status_normal')
      : expireDate
        ? $.Localize('#member_status_expired')
        : $.Localize('#member_status_none');

  const expireText = expireDate
    ? enable
      ? $.Localize('#member_expire_date').replace('{expireDate}', expireDate)
      : $.Localize('#member_expired_date').replace('{expireDate}', expireDate)
    : '';

  return (
    <Panel className="member-layout">
      <SubTabNavigation tabs={subTabs} currentTab={activeSubTab} onTabChange={setSubTab} />
      <Panel className="member-content">
        {activeSubTab === 'status' && (
          <StatusPage
            enable={enable}
            hasBaseBenefit={hasBaseBenefit}
            isPremium={isPremium}
            isNormalOnly={isNormalOnly}
            statusText={statusText}
            expireText={expireText}
            canSubscribe={!offline}
            onOpenSubscribe={() => setSubTab('subscribe')}
            refreshing={refreshing}
            canRefresh={canRefresh}
            onRefresh={handleRefresh}
          />
        )}
        {activeSubTab === 'subscribe' && (
          <SubscribePage
            isNormalOnly={isNormalOnly}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
        {activeSubTab === 'points' && (
          <PointsPage refreshing={refreshing} onRefresh={handleRefresh} />
        )}
      </Panel>
    </Panel>
  );
}
