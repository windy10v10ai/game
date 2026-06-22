import { PrimaryButton } from '../../../../shared/components';

interface AwakenHeroCardProps {
  heroName: string;
  abilityName: string;
  isUnlocked: boolean;
  enabled: boolean;
  canAfford: boolean;
  onUnlockClick: (heroName: string, abilityName: string) => void;
}

/** 觉醒技能预览卡：未觉醒展示解锁按钮，已觉醒用金色描边 + 徽标替代 */
export function AwakenHeroCard({
  heroName,
  abilityName,
  isUnlocked,
  enabled,
  canAfford,
  onUnlockClick,
}: AwakenHeroCardProps) {
  return (
    <Panel className={isUnlocked ? 'awaken-card awaken-card-unlocked' : 'awaken-card'}>
      <DOTAHeroImage className="awaken-hero" heroname={heroName} heroimagestyle="portrait" />
      <Panel className="awaken-top-scrim" />
      <Label className="awaken-hero-name-top" text={$.Localize('#' + heroName)} />
      <Panel className="awaken-scrim" />
      <Panel className="awaken-bottom">
        <DOTAAbilityImage
          className="awaken-ability-icon"
          abilityname={abilityName}
          showtooltip={true}
        />
        {isUnlocked ? (
          <Panel className="awaken-unlocked-badge">
            <Label
              className="awaken-unlocked-badge-label"
              text={$.Localize('#awaken_unlocked_label')}
            />
          </Panel>
        ) : (
          <PrimaryButton
            className="awaken-unlock-btn"
            enabled={enabled}
            onClick={() => onUnlockClick(heroName, abilityName)}
            label={$.Localize('#awaken_unlock_button')}
            tooltipText={canAfford ? undefined : $.Localize('#awaken_unlock_tooltip_insufficient')}
          />
        )}
      </Panel>
    </Panel>
  );
}
