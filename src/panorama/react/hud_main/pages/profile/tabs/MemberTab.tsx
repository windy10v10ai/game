import React, { useRef, useState } from 'react';
import { SubTabNavigation } from '../../../../shared/components';
import { useNetTable } from '../../../../shared/hooks/useNetTable';
import { GetLocalPlayerSteamAccountID, GetOpenMemberUrl } from '@utils/utils';

const enum MemberLevel {
  NORMAL = 1,
  PREMIUM = 2,
}

const CROWN_GOLD = 'file://{images}/custom_game/golden_crown.png';
const CROWN_GREY = 'file://{images}/custom_game/golden_crown_grey.png';
const AFDIAN_ICON = 'file://{images}/custom_game/afdian.png';
const KOFI_LOGO = 'file://{images}/custom_game/member/ko-fi-logo-long.png';

type MemberSubTab = 'status' | 'subscribe';

const MEMBER_SUB_TABS: { id: MemberSubTab; label: string }[] = [
  { id: 'status', label: $.Localize('#member_subtab_status') },
  { id: 'subscribe', label: $.Localize('#member_subtab_subscribe') },
];

// ---------- 通用：可点击区块（带 tooltip） ----------

interface ClickablePanelProps {
  className: string;
  clickable: boolean;
  tooltipKey: string;
  onActivate: () => void;
  children: React.ReactNode;
}

function ClickablePanel({
  className,
  clickable,
  tooltipKey,
  onActivate,
  children,
}: ClickablePanelProps) {
  const ref = useRef<Panel | null>(null);
  return (
    <Panel
      ref={ref}
      className={className}
      onactivate={clickable ? onActivate : undefined}
      onmouseover={
        clickable
          ? () =>
              ref.current &&
              $.DispatchEvent('DOTAShowTextTooltip', ref.current, $.Localize(tooltipKey))
          : undefined
      }
      onmouseout={clickable ? () => $.DispatchEvent('DOTAHideTextTooltip') : undefined}
    >
      {children}
    </Panel>
  );
}

// ---------- 子页1：会员状态 ----------

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
    : '#member_benefit_click_hint_base';

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
  statusText: string;
  expireText: string;
  onOpenSubscribe: () => void;
}

function StatusPage({
  enable,
  hasBaseBenefit,
  isPremium,
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
        <BenefitSection
          titleKey="#member_benefit_title_base"
          active={hasBaseBenefit}
          onActivate={onOpenSubscribe}
        >
          <BenefitItem textKey="#member_benefit_revive" active={hasBaseBenefit} />
          <BenefitItem textKey="#member_benefit_buyback" active={hasBaseBenefit} />
          <BenefitItem textKey="#member_benefit_reroll" active={hasBaseBenefit} />
          <BenefitItem textKey="#member_benefit_daily_exp" active={hasBaseBenefit} />
        </BenefitSection>

        <BenefitSection
          titleKey="#member_benefit_title_premium"
          active={isPremium}
          isPremium
          onActivate={onOpenSubscribe}
        >
          <BenefitItem textKey="#member_benefit_8pick" active={isPremium} isPremium />
          <BenefitItem textKey="#member_benefit_gold_cap" active={isPremium} isPremium />
        </BenefitSection>
      </Panel>
    </Panel>
  );
}

// ---------- 子页2：开通会员 ----------

interface SubscribePageProps {
  isNormalOnly: boolean; // 仅普通会员（非高级），显示折算说明
}

function SubscribePage({ isNormalOnly }: SubscribePageProps) {
  const openUrl = () => $.DispatchEvent('ExternalBrowserGoToURL', GetOpenMemberUrl());

  return (
    <Panel className="member-subpage member-subscribe-page">
      <Panel className="member-subscribe-area">
        <Label className="member-subscribe-title" text={$.Localize('#member_subscribe_title')} />
        {isNormalOnly && (
          <Label
            className="member-subscribe-upgrade-hint"
            text={$.Localize('#member_subscribe_normal_upgrade_hint')}
          />
        )}
        <Panel className="member-subscribe-buttons">
          <Button className="member-subscribe-btn member-subscribe-btn-afdian" onactivate={openUrl}>
            <Image className="member-subscribe-icon" src={AFDIAN_ICON} />
            <Label
              className="member-subscribe-btn-label"
              text={$.Localize('#member_subscribe_afdian')}
            />
          </Button>
          <Button className="member-subscribe-btn member-subscribe-btn-kofi" onactivate={openUrl}>
            <Image className="member-subscribe-kofi-logo" src={KOFI_LOGO} />
          </Button>
        </Panel>
      </Panel>
    </Panel>
  );
}

// ---------- 主组件 ----------

export function MemberTab() {
  const [subTab, setSubTab] = useState<MemberSubTab>('status');

  const steamId = GetLocalPlayerSteamAccountID();
  const member = useNetTable('member_table', steamId);

  const enable = member?.enable === true;
  const level = Number(member?.level ?? 0);
  const expireDate = member?.expireDateString ?? '';

  const hasBaseBenefit = enable && level >= MemberLevel.NORMAL; // 普通或高级会员
  const isPremium = enable && level >= MemberLevel.PREMIUM; // 仅高级会员
  const isNormalOnly = hasBaseBenefit && !isPremium; // 仅普通会员

  const statusText = isPremium
    ? $.Localize('#member_status_premium')
    : hasBaseBenefit
      ? $.Localize('#member_status_normal')
      : expireDate
        ? $.Localize('#member_status_expired')
        : $.Localize('#member_status_none');

  const expireText = expireDate
    ? enable
      ? $.Localize('#member_expire_date').replace('{expireDate}', expireDate)
      : $.Localize('#member_expired_date').replace('{expireDate}', expireDate)
    : '';

  return (
    <Panel className="member-layout">
      <SubTabNavigation tabs={MEMBER_SUB_TABS} currentTab={subTab} onTabChange={setSubTab} />
      <Panel className="member-content">
        {subTab === 'status' && (
          <StatusPage
            enable={enable}
            hasBaseBenefit={hasBaseBenefit}
            isPremium={isPremium}
            statusText={statusText}
            expireText={expireText}
            onOpenSubscribe={() => setSubTab('subscribe')}
          />
        )}
        {subTab === 'subscribe' && <SubscribePage isNormalOnly={isNormalOnly} />}
      </Panel>
    </Panel>
  );
}
