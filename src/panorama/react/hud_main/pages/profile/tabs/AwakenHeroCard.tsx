import { PrimaryButton } from '../../../../shared/components';

interface AwakenHeroCardProps {
  heroName: string;
  abilityName: string;
  isUnlocked: boolean;
  isFreeTrial: boolean;
  enabled: boolean;
  canAfford: boolean;
  onUnlockClick: (heroName: string, abilityName: string) => void;
}

// 卡片宽 124px，角标与间距约占 52px，名字宽过此值就挤不进同一行
const NAME_INLINE_MAX_WIDTH = 72;
const CJK_PATTERN = /[　-〿一-鿿＀-￯]/;

/** Panorama 取不到已渲染文本宽度，按字号 14px 粗体的经验字宽估算 */
function estimateTextWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += CJK_PATTERN.test(char) ? 14 : 8;
  }
  return width;
}

/** 觉醒技能预览卡：未觉醒展示解锁按钮，已觉醒用金色描边 + 徽标替代，限时免费体验加右上角角标 */
export function AwakenHeroCard({
  heroName,
  abilityName,
  isUnlocked,
  isFreeTrial,
  enabled,
  canAfford,
  onUnlockClick,
}: AwakenHeroCardProps) {
  const heroLabel = $.Localize('#' + heroName);
  // 名字优先占满第一行，塞不下角标时角标退到第二行
  const badgeInline = isFreeTrial && estimateTextWidth(heroLabel) <= NAME_INLINE_MAX_WIDTH;
  const badgeWrapped = isFreeTrial && !badgeInline;

  return (
    <Panel className={isUnlocked ? 'awaken-card awaken-card-unlocked' : 'awaken-card'}>
      <DOTAHeroImage className="awaken-hero" heroname={heroName} heroimagestyle="portrait" />
      <Panel
        className={badgeWrapped ? 'awaken-top-scrim awaken-top-scrim-tall' : 'awaken-top-scrim'}
      />
      <Label
        className={
          badgeInline ? 'awaken-hero-name-top awaken-hero-name-top-inline' : 'awaken-hero-name-top'
        }
        text={heroLabel}
      />
      {isFreeTrial && (
        <Panel
          className={
            badgeWrapped ? 'awaken-free-badge awaken-free-badge-wrapped' : 'awaken-free-badge'
          }
          onmouseover={(panel) =>
            $.DispatchEvent('DOTAShowTextTooltip', panel, $.Localize('#awaken_free_trial_tooltip'))
          }
          onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
        >
          <Label
            className="awaken-free-badge-label"
            text={$.Localize('#awaken_free_trial_badge')}
          />
        </Panel>
      )}
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
