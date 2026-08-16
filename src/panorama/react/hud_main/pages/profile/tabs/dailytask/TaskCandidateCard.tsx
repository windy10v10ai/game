import React from 'react';
import { TaskCandidateDto } from '../../../../../../../common/dto/daily-task';

interface TaskCandidateCardProps {
  candidate: TaskCandidateDto;
  title: string;
  selected: boolean;
  onSelect: (taskId: string) => void;
}

export function TaskCandidateCard({
  candidate,
  title,
  selected,
  onSelect,
}: TaskCandidateCardProps) {
  return (
    <Panel
      className={`dailytask-card${selected ? ' dailytask-card-selected' : ''}`}
      onactivate={() => onSelect(candidate.taskId)}
    >
      <Panel className="dailytask-card-header">
        {candidate.heroName ? (
          <DOTAHeroImage
            className="dailytask-card-hero-icon"
            heroname={candidate.heroName}
            heroimagestyle="icon"
          />
        ) : null}
        <Panel className={`dailytask-star-badge dailytask-star-${candidate.star}`}>
          <Label className="dailytask-star-visual" text={'★'.repeat(candidate.star)} />
        </Panel>
      </Panel>
      <Label className="dailytask-card-title" html={false} text={title} />
      <Label
        className="dailytask-card-reward"
        text={$.Localize('#dailytask_reward_hint').replace(
          '{n}',
          String(candidate.rewardSeasonPoint),
        )}
      />
    </Panel>
  );
}
