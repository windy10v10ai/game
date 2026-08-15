import React from 'react';
import { DailyChallengeTaskSnapshotDto } from '../../../../../common/dto/daily-challenge';
import { PrimaryButton } from '../../../shared/components';
import { ChallengeProgress } from './ChallengeProgress';
import {
  DailyChallengeAcceptButtonState,
  getDailyChallengeTaskTitle,
  getDailyChallengeStarVisual,
  getDailyChallengeTaskStar,
} from './daily-challenge-ui';

interface TaskStarBadgeProps {
  task: DailyChallengeTaskSnapshotDto;
}

export function TaskStarBadge({ task }: TaskStarBadgeProps) {
  const star = getDailyChallengeTaskStar(task);
  return (
    <Panel className={`daily-challenge-star-badge star-${star}`}>
      <Label className="daily-challenge-star-visual" text={getDailyChallengeStarVisual(star)} />
      <Label
        className="daily-challenge-star-label"
        text={$.Localize('#daily_challenge_star_label').replace('{star}', String(star))}
      />
    </Panel>
  );
}

interface PersonalCandidateCardProps {
  task: DailyChallengeTaskSnapshotDto;
  accepted: boolean;
  buttonState: DailyChallengeAcceptButtonState;
  onAccept?: (assignmentId: string) => void;
  provisionalProgress?: number;
}

export function PersonalCandidateCard({
  task,
  accepted,
  buttonState,
  onAccept,
  provisionalProgress = 0,
}: PersonalCandidateCardProps) {
  const language = $.Language();
  const title = getDailyChallengeTaskTitle(task, language, (key) => $.Localize(key));
  return (
    <Panel
      className={`daily-challenge-card daily-challenge-personal-card${accepted ? ' is-accepted' : ''}`}
    >
      <Panel className="daily-challenge-card-header">
        <Panel className="daily-challenge-task-heading">
          <TaskStarBadge task={task} />
          <Label className="daily-challenge-task-title" text={title} />
        </Panel>
        <Label
          className="daily-challenge-reward"
          text={$.Localize('#daily_challenge_task_reward_hint').replace(
            '{n}',
            String(task.rewardSeasonPoint),
          )}
        />
      </Panel>
      {accepted ? (
        <ChallengeProgress
          progress={task.progress}
          provisionalProgress={provisionalProgress}
          target={task.target}
          unit={task.unit}
          showBreakdown={true}
        />
      ) : (
        <PrimaryButton
          className="daily-challenge-accept-button"
          label={$.Localize(buttonState.labelKey)}
          enabled={buttonState.enabled}
          onClick={() => onAccept?.(task.assignmentId)}
        />
      )}
    </Panel>
  );
}
