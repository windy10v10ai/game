import React, { useState } from 'react';
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

// ---------- 子页1：会员状态 ----------

interface BenefitItemProps {
  textKey: string;
  active: boolean;
  isPremium?: boolean;
}

function BenefitItem({ textKey, active, isPremium }: BenefitItemProps) {
  const rowClass = active
    ? 'member-benefit-item'
    : 'member-benefit-item member-benefit-item-inactive';
  return (
    <Panel className={rowClass}>
      <Panel className={active ? 'benefit-icon-active' : 'benefit-icon-inactive'} />
      <Label className="benefit-text" text={$.Localize(textKey)} />
      {isPremium && (
        <Label className="benefit-premium-badge" text={$.Localize('#member_status_premium')} />
      )}
    </Panel>
  );
}

interface StatusPageProps {
  enable: boolean;
  hasBaseBenefit: boolean; // 拥有基础权益（普通或高级会员均满足）
  isPremium: boolean; // 高级会员专属权益是否解锁
  statusText: string;
  expireText: string;
}

function StatusPage({
  enable,
  hasBaseBenefit,
  isPremium,
  statusText,
  expireText,
}: StatusPageProps) {
  const crownSrc = enable ? CROWN_GOLD : CROWN_GREY;
  const statusCardClass = enable
    ? 'member-status-card member-status-card-active'
    : 'member-status-card member-status-card-inactive';

  return (
    <Panel className="member-subpage">
      <Panel className={statusCardClass}>
        <Image className="member-crown-icon" src={crownSrc} />
        <Panel className="member-status-info">
          <Label className="member-status-title" text={statusText} />
          {expireText !== '' && <Label className="member-expire-label" text={expireText} />}
        </Panel>
      </Panel>

      <Panel className="member-benefits-container">
        <Label className="member-section-title" text={$.Localize('#member_benefit_title_base')} />
        <BenefitItem textKey="#member_benefit_revive" active={hasBaseBenefit} />
        <BenefitItem textKey="#member_benefit_buyback" active={hasBaseBenefit} />
        <BenefitItem textKey="#member_benefit_reroll" active={hasBaseBenefit} />
        <BenefitItem textKey="#member_benefit_daily_exp" active={hasBaseBenefit} />

        <Label
          className="member-section-title member-section-title-premium"
          text={$.Localize('#member_benefit_title_premium')}
        />
        <BenefitItem textKey="#member_benefit_8pick" active={isPremium} isPremium />
        <BenefitItem textKey="#member_benefit_gold_cap" active={isPremium} isPremium />
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
          />
        )}
        {subTab === 'subscribe' && <SubscribePage isNormalOnly={isNormalOnly} />}
      </Panel>
    </Panel>
  );
}
