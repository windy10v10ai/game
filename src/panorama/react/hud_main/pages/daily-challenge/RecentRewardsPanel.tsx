import React from 'react';
import { DailyChallengeRewardHistoryDto } from '../../../../../common/dto/daily-challenge';
import {
  getDailyChallengeContributionTierLocalizationKey,
  getDailyChallengeRewardSourceLocalizationKey,
  getDailyChallengeRewardTaskTitle,
} from './daily-challenge-ui';

interface RecentRewardsPanelProps {
  rewards: DailyChallengeRewardHistoryDto[];
}

export function RecentRewardsPanel({ rewards }: RecentRewardsPanelProps) {
  const language = $.Language();

  return (
    <Panel className="daily-challenge-reward-history">
      <Label
        className="daily-challenge-section-title"
        text={$.Localize('#daily_challenge_reward_history_title')}
      />
      {rewards.length === 0 ? (
        <Label
          className="daily-challenge-reward-history-empty"
          text={$.Localize('#daily_challenge_reward_history_empty')}
        />
      ) : (
        <Panel className="daily-challenge-reward-history-list">
          {rewards.map((reward) => {
            const taskTitle = getDailyChallengeRewardTaskTitle(reward, language, (key) =>
              $.Localize(key),
            );
            return (
              <Panel key={reward.rewardId} className="daily-challenge-reward-history-row">
                <Panel className="daily-challenge-reward-history-main">
                  <Label
                    className="daily-challenge-reward-history-source"
                    text={$.Localize(getDailyChallengeRewardSourceLocalizationKey(reward.source))}
                  />
                  {taskTitle !== '' && (
                    <Label className="daily-challenge-reward-history-task" text={taskTitle} />
                  )}
                  <Panel className="daily-challenge-reward-history-meta">
                    <Label
                      text={$.Localize('#daily_challenge_reward_history_day').replace(
                        '{day}',
                        reward.dayId,
                      )}
                    />
                    {reward.contributionTier && (
                      <Label
                        text={$.Localize(
                          getDailyChallengeContributionTierLocalizationKey(reward.contributionTier),
                        )}
                      />
                    )}
                    {reward.streakDays !== undefined && (
                      <Label
                        text={$.Localize('#daily_challenge_reward_streak_days').replace(
                          '{days}',
                          String(reward.streakDays),
                        )}
                      />
                    )}
                  </Panel>
                </Panel>
                <Label
                  className="daily-challenge-reward-history-points"
                  text={$.Localize('#daily_challenge_reward_history_points').replace(
                    '{points}',
                    String(reward.seasonPoint),
                  )}
                />
              </Panel>
            );
          })}
        </Panel>
      )}
    </Panel>
  );
}
