import React from 'react';
import { TaskCandidateDto } from '../../../../../../../common/dto/daily-task';
import { PrimaryButton } from '../../../../../shared/components';

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
    <Panel className={`dailytask-card${selected ? ' dailytask-card-selected' : ''}`}>
      <Panel className="dailytask-card-header">
        <Panel className="dailytask-card-header-left">
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
        <Label
          className="dailytask-card-reward"
          text={$.Localize('#dailytask_reward_hint').replace(
            '{n}',
            String(candidate.rewardSeasonPoint),
          )}
        />
      </Panel>
      <Label className="dailytask-card-title" html={true} text={title} />
      {selected ? (
        <Panel className="dailytask-selected-badge">
          <Label
            className="dailytask-selected-badge-label"
            text={$.Localize('#dailytask_selected_label')}
          />
        </Panel>
      ) : (
        <PrimaryButton
          className="dailytask-select-btn"
          onClick={() => onSelect(candidate.taskId)}
          label={$.Localize('#dailytask_select_button')}
        />
      )}
    </Panel>
  );
}
