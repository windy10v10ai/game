import { PrimaryButton } from '../../../../shared/components';

interface Candidate {
  heroName: string;
  abilityName: string;
}

interface AwakenRandomCandidatesDialogProps {
  candidates: Candidate[];
  onSelect: (heroName: string, abilityName: string) => void;
  onClose: () => void;
}

/** 随机抽选候选层：展示 API 返回的候选英雄，选 1 个进入确认。关闭/退出免费、无副作用 */
export function AwakenRandomCandidatesDialog({
  candidates,
  onSelect,
  onClose,
}: AwakenRandomCandidatesDialogProps) {
  return (
    <Panel className="awaken-confirm-overlay" onactivate={onClose}>
      <Panel className="awaken-candidates-dialog" onactivate={() => {}}>
        <Label
          className="awaken-candidates-title"
          text={$.Localize('#awaken_random_candidates_title')}
        />
        <Panel className="awaken-candidates-row">
          {candidates.map(({ heroName, abilityName }) => (
            <Panel key={heroName} className="awaken-card">
              <DOTAHeroImage
                className="awaken-hero"
                heroname={heroName}
                heroimagestyle="portrait"
              />
              <Panel className="awaken-top-scrim" />
              <Label className="awaken-hero-name-top" text={$.Localize('#' + heroName)} />
              <Panel className="awaken-scrim" />
              <Panel className="awaken-bottom">
                <DOTAAbilityImage
                  className="awaken-ability-icon"
                  abilityname={abilityName}
                  showtooltip={true}
                />
                <PrimaryButton
                  className="awaken-unlock-btn"
                  onClick={() => onSelect(heroName, abilityName)}
                  label={$.Localize('#awaken_random_select_button')}
                />
              </Panel>
            </Panel>
          ))}
        </Panel>
      </Panel>
    </Panel>
  );
}
