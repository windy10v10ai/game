import React, { useRef, useState } from 'react';
import { SubTabNavigation } from '../../../../shared/components';
import { useNetTable } from '../../../../shared/hooks/useNetTable';
import {
  GetLocalPlayerSteamAccountID,
  GetAfdianSubscribeUrl,
  KOFI_SUBSCRIBE_URL,
  AFDIAN_SHOP_URL,
  KOFI_SHOP_URL,
} from '@utils/utils';

const enum MemberLevel {
  NORMAL = 1,
  PREMIUM = 2,
}

const CROWN_GOLD = 'file://{images}/custom_game/golden_crown.png';
const CROWN_GREY = 'file://{images}/custom_game/golden_crown_grey.png';
const AFDIAN_ICON = 'file://{images}/custom_game/afdian.png';
const KOFI_LOGO = 'file://{images}/custom_game/member/ko-fi-logo-small.png';

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

function StatusPage({
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
              <BenefitItem textKey="#member_benefit_revive" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_buyback" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_reroll" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_daily_exp" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_exp_normal" active={hasBaseBenefit} />
              <BenefitItem textKey="#member_benefit_buff" active={hasBaseBenefit} />
            </BenefitSection>

            <BenefitSection
              titleKey="#member_benefit_title_premium"
              active={isPremium}
              isPremium
              onActivate={onOpenSubscribe}
            >
              <BenefitItem textKey="#member_benefit_8pick" active={isPremium} isPremium />
              <BenefitItem textKey="#member_benefit_gold_cap" active={isPremium} isPremium />
              <BenefitItem textKey="#member_benefit_exp_premium" active={isPremium} isPremium />
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
            <BenefitItem textKey="#member_benefit_8pick" active={isPremium} isPremium />
            <BenefitItem textKey="#member_benefit_gold_cap" active={isPremium} isPremium />
            <BenefitItem textKey="#member_benefit_exp_premium" active={isPremium} isPremium />
          </ClickablePanel>
        )}
      </Panel>
    </Panel>
  );
}

// ---------- 子页2：开通会员 ----------

interface SubscribePageProps {
  isNormalOnly: boolean; // 仅普通会员（非高级），显示折算说明
}

const openUrl = (url: string) => () => $.DispatchEvent('ExternalBrowserGoToURL', url);

const AFDIAN_ACTIVATE_URL = 'https://windy10v10ai.com/regist/afdian';
const KOFI_ACTIVATE_URL = 'https://windy10v10ai.com/regist/kofi';

function ActivateRow({ activateUrl }: { activateUrl: string }) {
  const tipRef = useRef<ImagePanel | null>(null);
  const tooltipText = $.Localize('#member_activate_tooltip');
  return (
    <Panel className="member-platform-activate-row">
      <Label
        className="member-platform-activate"
        text={$.Localize('#member_activate')}
        onactivate={openUrl(activateUrl)}
      />
      <Image
        ref={tipRef}
        className="member-activate-tip-icon"
        src="s2r://panorama/images/status_icons/information_psd.vtex"
        onmouseover={() =>
          tipRef.current && $.DispatchEvent('DOTAShowTextTooltip', tipRef.current, tooltipText)
        }
        onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
      />
    </Panel>
  );
}

function SubscribePage({ isNormalOnly }: SubscribePageProps) {
  const steamId = GetLocalPlayerSteamAccountID();

  return (
    <Panel className="member-subpage member-subscribe-page">
      {/* 共同提示区 */}
      <Panel className="member-subscribe-info">
        <Label className="member-subscribe-title-cta" text={$.Localize('#member_subscribe_title')} />
        <Panel className="member-subscribe-steam-id-row">
          <Label
            className="member-subscribe-steam-id-label"
            text={$.Localize('#member_steam_id')}
          />
          <Label
            className="member-subscribe-steam-id-value"
            text={String(steamId)}
            enabled={true}
            acceptsfocus={true}
            allowtextselection={true}
          />
          <Label
            className="member-subscribe-steam-id-hint"
            text={$.Localize('#member_steam_id_select_hint')}
          />
        </Panel>
        <Label className="member-subscribe-hint" text={$.Localize('#member_subscribe_hint')} />
        {isNormalOnly && (
          <Label
            className="member-subscribe-upgrade-hint"
            text={$.Localize('#member_subscribe_normal_upgrade_hint')}
          />
        )}
      </Panel>

      {/* 两平台并排 */}
      <Panel className="member-platform-cards">
        {/* 爱发电 */}
        <Panel className="member-platform-card member-platform-card-afdian">
          <Image className="member-platform-logo" src={AFDIAN_ICON} />
          <Label className="member-platform-name" text={$.Localize('#member_platform_afdian')} />
          <Label
            className="member-platform-desc member-platform-desc-cn"
            text={$.Localize('#member_platform_afdian_desc')}
          />
          <Button
            className="member-platform-btn member-platform-btn-subscribe"
            onactivate={openUrl(GetAfdianSubscribeUrl())}
          >
            <Label
              className="member-platform-btn-label"
              text={$.Localize('#member_subscribe_title')}
            />
          </Button>
          <Panel className="member-platform-divider">
            <Label
              className="member-platform-divider-label"
              text={$.Localize('#member_shop_divider')}
            />
          </Panel>
          <Button
            className="member-platform-btn member-platform-btn-shop"
            onactivate={openUrl(AFDIAN_SHOP_URL)}
          >
            <Label
              className="member-platform-btn-label member-platform-btn-label-ghost"
              text={$.Localize('#member_shop_title')}
            />
          </Button>
          <ActivateRow activateUrl={AFDIAN_ACTIVATE_URL} />
        </Panel>

        {/* Ko-fi */}
        <Panel className="member-platform-card member-platform-card-kofi">
          <Image className="member-platform-logo" src={KOFI_LOGO} />
          <Label className="member-platform-name" text={$.Localize('#member_platform_kofi')} />
          <Label
            className="member-platform-desc member-platform-desc-intl"
            text={$.Localize('#member_platform_kofi_desc')}
          />
          <Button
            className="member-platform-btn member-platform-btn-subscribe"
            onactivate={openUrl(KOFI_SUBSCRIBE_URL)}
          >
            <Label
              className="member-platform-btn-label"
              text={$.Localize('#member_subscribe_title')}
            />
          </Button>
          <Panel className="member-platform-divider">
            <Label
              className="member-platform-divider-label"
              text={$.Localize('#member_shop_divider')}
            />
          </Panel>
          <Button
            className="member-platform-btn member-platform-btn-shop"
            onactivate={openUrl(KOFI_SHOP_URL)}
          >
            <Label
              className="member-platform-btn-label member-platform-btn-label-ghost"
              text={$.Localize('#member_shop_title')}
            />
          </Button>
          <ActivateRow activateUrl={KOFI_ACTIVATE_URL} />
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
            isNormalOnly={isNormalOnly}
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
