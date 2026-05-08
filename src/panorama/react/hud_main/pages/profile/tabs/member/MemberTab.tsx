import React, { useEffect, useRef, useState } from 'react';
import { SubTabNavigation } from '../../../../../shared/components';
import { useNetTable } from '../../../../../shared/hooks/useNetTable';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { MemberLevel, MemberSubTab, MEMBER_SUB_TABS } from './constants';
import { StatusPage } from './StatusPage';
import { SubscribePage } from './SubscribePage';

export function MemberTab() {
  const [subTab, setSubTab] = useState<MemberSubTab>('status');
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  const steamId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamId);
  const member = player?.member;

  // net table 更新后立即恢复按钮，并跳回状态页
  useEffect(() => {
    if (refreshingRef.current) {
      refreshingRef.current = false;
      setRefreshing(false);
      setSubTab('status');
    }
  }, [player]);

  const handleRefresh = () => {
    if (refreshing) return;
    refreshingRef.current = true;
    setRefreshing(true);
    GameEvents.SendCustomGameEventToServer('player_info_refresh', {});
    // 兜底：5 秒后无论成功失败都恢复按钮（本地环境 API 返回 401 不会更新 net table）
    $.Schedule(5, () => {
      if (refreshingRef.current) {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    });
  };

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
      <SubTabNavigation tabs={MEMBER_SUB_TABS} currentTab={subTab} onTabChange={setSubTab} />
      <Panel className="member-content">
        {subTab === 'status' && (
          <StatusPage
            enable={enable}
            hasBaseBenefit={hasBaseBenefit}
            isPremium={isPremium}
            isNormalOnly={isNormalOnly}
            statusText={statusText}
            expireText={expireText}
            onOpenSubscribe={() => setSubTab('subscribe')}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
        {subTab === 'subscribe' && (
          <SubscribePage
            isNormalOnly={isNormalOnly}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </Panel>
    </Panel>
  );
}
