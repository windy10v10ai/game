import React from 'react';
import { ChallengeUnit } from '../../../../../common/dto/daily-challenge';
import { formatChallengeValue, getChallengeProgressLayers } from './daily-challenge-ui';

interface ChallengeProgressProps {
  progress: number;
  provisionalProgress?: number;
  target: number;
  unit: ChallengeUnit;
  showBreakdown?: boolean;
}

export function ChallengeProgress({
  progress,
  provisionalProgress = 0,
  target,
  unit,
  showBreakdown = false,
}: ChallengeProgressProps) {
  const language = $.Language();
  const layers = getChallengeProgressLayers(progress, provisionalProgress, target);
  const formalValue = formatChallengeValue(progress, unit, language);
  const provisionalValue = formatChallengeValue(provisionalProgress, unit, language);
  const targetValue = formatChallengeValue(target, unit, language);

  return (
    <Panel className="daily-challenge-progress-wrap">
      <Panel className="daily-challenge-progress-track">
        <Panel
          className="daily-challenge-progress-fill daily-challenge-progress-fill-formal"
          style={{ width: `${layers.formalPercent}%` }}
        />
        {layers.provisionalPercent > 0 && (
          <Panel
            className="daily-challenge-progress-fill daily-challenge-progress-fill-provisional"
            style={{ width: `${layers.provisionalPercent}%` }}
          />
        )}
      </Panel>
      {showBreakdown ? (
        <Panel className="daily-challenge-progress-breakdown">
          <Label
            className="daily-challenge-progress-formal-text"
            text={$.Localize('#daily_challenge_progress_formal').replace('{n}', formalValue)}
          />
          <Label
            className="daily-challenge-progress-provisional-text"
            text={$.Localize('#daily_challenge_progress_provisional').replace(
              '{n}',
              provisionalValue,
            )}
          />
          <Label
            className="daily-challenge-progress-target-text"
            text={$.Localize('#daily_challenge_progress_target').replace('{n}', targetValue)}
          />
        </Panel>
      ) : (
        <Label
          className="daily-challenge-progress-text"
          text={`${formatChallengeValue(layers.displayedProgress, unit, language)} / ${targetValue}`}
        />
      )}
    </Panel>
  );
}
