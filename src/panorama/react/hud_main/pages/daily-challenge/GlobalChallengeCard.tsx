import React from 'react';
import {
  DailyChallengeGlobalRewardTiersDto,
  DailyChallengeTaskSnapshotDto,
} from '../../../../../common/dto/daily-challenge';
import { fillChallengeTarget, fillGlobalRewardTier } from './daily-challenge-ui';
import { ChallengeProgress } from './ChallengeProgress';

export function GlobalChallengeCard({
  task,
  rewardTiers,
}: {
  task?: DailyChallengeTaskSnapshotDto;
  rewardTiers: DailyChallengeGlobalRewardTiersDto;
}) {
  if (!task) {
    return (
      <Panel className="daily-challenge-card daily-challenge-global-card">
        <Label
          className="daily-challenge-section-title"
          text={$.Localize('#daily_challenge_global_title')}
        />
        <Label
          className="daily-challenge-empty"
          text={$.Localize('#daily_challenge_global_empty')}
        />
      </Panel>
    );
  }
  const language = $.Language();
  return (
    <Panel className="daily-challenge-card daily-challenge-global-card">
      <Panel className="daily-challenge-card-header">
        <Label
          className="daily-challenge-section-title"
          text={$.Localize('#daily_challenge_global_title')}
        />
        <Label
          className="daily-challenge-reward"
          text={$.Localize('#daily_challenge_global_tier_badge')}
        />
      </Panel>
      <Label
        className="daily-challenge-task-title"
        text={fillChallengeTarget(task.title, task.target, task.unit, language)}
      />
      <Label
        className="daily-challenge-task-description"
        text={fillChallengeTarget(task.description, task.target, task.unit, language)}
      />
      <ChallengeProgress progress={task.progress} target={task.target} unit={task.unit} />
      <Panel className="daily-challenge-tier-row">
        <Label
          className="daily-challenge-tier daily-challenge-tier-top"
          text={fillGlobalRewardTier(
            $.Localize('#daily_challenge_global_tier_top'),
            rewardTiers.topRewardSeasonPoint,
            rewardTiers.topPercent,
          )}
        />
        <Label
          className="daily-challenge-tier daily-challenge-tier-middle"
          text={fillGlobalRewardTier(
            $.Localize('#daily_challenge_global_tier_middle'),
            rewardTiers.middleRewardSeasonPoint,
            rewardTiers.middlePercent,
          )}
        />
        <Label
          className="daily-challenge-tier daily-challenge-tier-base"
          text={fillGlobalRewardTier(
            $.Localize('#daily_challenge_global_tier_base'),
            rewardTiers.baseRewardSeasonPoint,
          )}
        />
      </Panel>
      <Label
        className="daily-challenge-hint"
        text={$.Localize('#daily_challenge_global_reward_hint')}
      />
    </Panel>
  );
}
