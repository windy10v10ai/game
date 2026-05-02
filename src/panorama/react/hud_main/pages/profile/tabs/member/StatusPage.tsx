import React from 'react';
import { ClickablePanel } from './ClickablePanel';
import { CROWN_GOLD, CROWN_GREY } from './constants';

interface BenefitItemProps {
  textKey: string;
  active: boolean;
  isPremium?: boolean;
}

function BenefitItem({ textKey, active, isPremium }: BenefitItemProps) {
  return (
    <Panel
      className={
        active ? 'member-benefit-item' : 'member-benefit-item member-benefit-item-inactive'
      }
    >
      <Panel className={active ? 'benefit-icon-active' : 'benefit-icon-inactive'} />
      <Label className="benefit-text" text={$.Localize(textKey)} />
      {isPremium && (
        <Label className="benefit-premium-badge" text={$.Localize('#member_status_premium')} />
      )}
    </Panel>
  );
}

interface BenefitSectionProps {
  titleKey: string;
  active: boolean; // 权益是否已解锁（决定标题颜色和可点击性）
  isPremium?: boolean; // 是否高级专属区块（标题用金色）
  onActivate: () => void;
  children: React.ReactNode;
}

function BenefitSection({
  titleKey,
  active,
  isPremium,
  onActivate,
  children,
}: BenefitSectionProps) {
  const titleClass = active
    ? isPremium
      ? 'member-section-title member-section-title-premium'
      : 'member-section-title'
    : isPremium
      ? 'member-section-title member-section-title-premium member-section-title-inactive'
      : 'member-section-title member-section-title-inactive';

  const tooltipKey = isPremium
    ? '#member_benefit_click_hint_premium'
    : '#member_status_card_click_hint';

  return (
    <ClickablePanel
      className={
        active
          ? 'member-benefit-section'
          : 'member-benefit-section member-benefit-section-clickable'
      }
      clickable={!active}
      tooltipKey={tooltipKey}
      onActivate={onActivate}
    >
      <Label className={titleClass} text={$.Localize(titleKey)} />
      {children}
    </ClickablePanel>
  );
}

interface StatusPageProps {
  enable: boolean;
  hasBaseBenefit: boolean; // 普通或高级会员
  isPremium: boolean; // 仅高级会员
  isNormalOnly: boolean; // 仅普通会员
  statusText: string;
  expireText: string;
  onOpenSubscribe: () => void;
}

export function StatusPage({
  enable,
  hasBaseBenefit,
  isPremium,
  isNormalOnly,
  statusText,
  expireText,
  onOpenSubscribe,
}: StatusPageProps) {
  const crownSrc = enable ? CROWN_GOLD : CROWN_GREY;
  const cardClass = enable
    ? 'member-status-card member-status-card-active'
    : 'member-status-card member-status-card-inactive member-status-card-clickable';

  return (
    <Panel className="member-subpage">
      <ClickablePanel
        className={cardClass}
        clickable={!enable}
        tooltipKey="#member_status_card_click_hint"
        onActivate={onOpenSubscribe}
      >
        <Image className="member-crown-icon" src={crownSrc} />
        <Panel className="member-status-info">
          <Label className="member-status-title" text={statusText} />
          {expireText !== '' && <Label className="member-expire-label" text={expireText} />}
        </Panel>
      </ClickablePanel>

      <Panel className="member-benefits-container">
        {isNormalOnly ? (
          <>
            <BenefitSection
              titleKey="#member_benefit_title_base"
              active={hasBaseBenefit}
              onActivate={onOpenSubscribe}
            >
              <BenefitItem textKey="#member_benefit_exp_normal" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_revive" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_buyback" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_reroll" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_daily_exp" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_buff" active={hasBaseBenefit} />
            </BenefitSection>

            <BenefitSection
              titleKey="#member_benefit_title_premium"
              active={isPremium}
              isPremium
              onActivate={onOpenSubscribe}
            >
              <BenefitItem textKey="#member_benefit_exp_premium" active={isPremium} isPremium />
              <BenefitItem textKey="#member_benefit_8pick" active={isPremium} isPremium />
              <BenefitItem textKey="#member_benefit_gold_cap" active={isPremium} isPremium />
            </BenefitSection>
          </>
        ) : (
          <ClickablePanel
            className={
              hasBaseBenefit
                ? 'member-benefit-section'
                : 'member-benefit-section member-benefit-section-clickable'
            }
            clickable={!hasBaseBenefit}
            tooltipKey="#member_status_card_click_hint"
            onActivate={onOpenSubscribe}
          >
            <Label
              className={
                isPremium
                  ? 'member-section-title member-section-title-premium'
                  : 'member-section-title member-section-title-inactive'
              }
              text={$.Localize('#member_benefit_title_all')}
            />
            <BenefitItem textKey="#member_benefit_revive" active={hasBaseBenefit} />
            <BenefitItem textKey="#member_benefit_buyback" active={hasBaseBenefit} />
            <BenefitItem textKey="#member_benefit_reroll" active={hasBaseBenefit} />
            <BenefitItem textKey="#member_benefit_daily_exp" active={hasBaseBenefit} />
            <BenefitItem textKey="#member_benefit_buff" active={hasBaseBenefit} />
            <BenefitItem textKey="#member_benefit_exp_premium" active={isPremium} isPremium />
            <BenefitItem textKey="#member_benefit_8pick" active={isPremium} isPremium />
            <BenefitItem textKey="#member_benefit_gold_cap" active={isPremium} isPremium />
          </ClickablePanel>
        )}
      </Panel>
    </Panel>
  );
}
