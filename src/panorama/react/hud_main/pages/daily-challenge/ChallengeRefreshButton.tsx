import React from 'react';
import { DailyChallengePlayerSnapshotDto } from '../../../../../common/dto/daily-challenge';
import { PrimaryButton } from '../../../shared/components';
import { useNavigation } from '../../store/NavigationContext';
import {
  getDailyChallengeFreeRefreshStateLocalizationKey,
  getDailyChallengeRefreshIntent,
  getDailyChallengeRefreshQuota,
} from './daily-challenge-ui';

interface ChallengeRefreshButtonProps {
  snapshot: DailyChallengePlayerSnapshotDto;
  memberPointBalance: number;
  pending: boolean;
  onRefresh: () => void;
}

export function ChallengeRefreshButton({
  snapshot,
  memberPointBalance,
  pending,
  onRefresh,
}: ChallengeRefreshButtonProps) {
  const { openPage } = useNavigation();
  const quota = getDailyChallengeRefreshQuota(snapshot.refresh);
  const noRefreshLeft = !quota.freeRefreshAvailable && quota.paidRefreshesRemaining <= 0;
  const locked = pending || !!snapshot.acceptedTask || noRefreshLeft || snapshot.status !== 'open';
  const intent = getDailyChallengeRefreshIntent({
    locked,
    isMember: snapshot.refresh.isMember,
    cost: snapshot.refresh.nextCostMemberPoint,
    balance: memberPointBalance,
  });

  const handleClick = () => {
    if (intent === 'open_member') {
      openPage('profile', 'member');
      return;
    }
    if (intent === 'open_points') {
      openPage('profile', 'member:points');
      return;
    }
    if (intent === 'refresh') onRefresh();
  };

  const label = !snapshot.refresh.isMember
    ? $.Localize('#daily_challenge_refresh_member')
    : quota.freeRefreshAvailable
      ? $.Localize('#daily_challenge_refresh_free')
      : noRefreshLeft
        ? $.Localize('#daily_challenge_refresh_exhausted')
        : $.Localize('#daily_challenge_refresh_cost').replace(
            '{n}',
            String(snapshot.refresh.nextCostMemberPoint),
          );
  const freeRefreshState = $.Localize(
    getDailyChallengeFreeRefreshStateLocalizationKey(
      snapshot.refresh.isMember,
      quota.freeRefreshAvailable,
    ),
  );
  const quotaLabel = $.Localize('#daily_challenge_refresh_quota')
    .replace('{free}', freeRefreshState)
    .replace('{remaining}', String(quota.paidRefreshesRemaining))
    .replace('{total}', String(quota.paidRefreshLimit));

  return (
    <Panel className="daily-challenge-refresh-row">
      <PrimaryButton
        className="daily-challenge-refresh-button"
        label={label}
        enabled={intent !== 'locked'}
        onClick={handleClick}
      />
      <Label className="daily-challenge-refresh-remaining" text={quotaLabel} />
    </Panel>
  );
}
