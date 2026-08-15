import React from 'react';
import { DailyChallengeStreakStateDto } from '../../../../../common/dto/daily-challenge';

export function StreakPanel({ streak }: { streak: DailyChallengeStreakStateDto }) {
  return (
    <Panel className="daily-challenge-card daily-challenge-streak-card">
      <Label
        className="daily-challenge-section-title"
        text={$.Localize('#daily_challenge_streak_title')}
      />
      <Panel className="daily-challenge-streak-main">
        <Label className="daily-challenge-streak-days" text={String(streak.currentDays)} />
        <Label
          className="daily-challenge-streak-days-unit"
          text={$.Localize('#daily_challenge_streak_days_unit')}
        />
      </Panel>
      <Label
        className="daily-challenge-streak-next"
        text={$.Localize('#daily_challenge_streak_next')
          .replace('{days}', String(streak.nextMilestoneDays))
          .replace('{points}', String(streak.nextMilestoneRewardSeasonPoint))}
      />
      <Label
        className="daily-challenge-hint"
        text={$.Localize('#daily_challenge_streak_cycle').replace(
          '{days}',
          String(streak.cycleTargetDays),
        )}
      />
    </Panel>
  );
}
