import React from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { AlipaySubscribeCard } from './alipay';
import {
  AFDIAN_ACTIVATE_URL,
  AFDIAN_ICON,
  AFDIAN_SHOP_URL,
  GetAfdianSubscribeUrl,
  KOFI_ACTIVATE_URL,
  KOFI_LOGO,
  KOFI_SHOP_URL,
  KOFI_SUBSCRIBE_URL,
  MembershipPlanTier,
  MembershipPlatform,
  MEMBERSHIP_PLATFORMS,
} from './constants';
import { ExternalPlatformCard } from './ExternalPlatformCard';

interface SubscribePageProps {
  isNormalOnly: boolean; // 仅普通会员（非高级），显示折算说明
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * 生成单档位的订阅按钮文案，例：
 *   alipay tier{quantity:1,price:'28.00'}  → "订阅会员 ¥28.00/月"
 * 未来若需"3 个月套餐"则在文案中体现 quantity；当前只取 quantity=1 简化展示。
 */
function getSubscribeButtonText(platform: MembershipPlatform, tier: MembershipPlanTier) {
  const { currency } = MEMBERSHIP_PLATFORMS[platform];
  const currencyText = currency === 'cny' ? `¥${tier.price}` : `$${tier.price}`;
  return (
    $.Localize('#member_platform_subscribe_btn') +
    currencyText +
    $.Localize('#member_platform_subscribe_month')
  );
}

/** 取平台默认档位（首期一档；未来可在卡片内做档位切换） */
const defaultTier = (platform: MembershipPlatform) => MEMBERSHIP_PLATFORMS[platform].tiers[0];

export function SubscribePage({ isNormalOnly, refreshing, onRefresh }: SubscribePageProps) {
  const steamId = GetLocalPlayerSteamAccountID();

  return (
    <Panel className="member-subpage member-subscribe-page">
      {/* 共同提示区 + 刷新按钮 */}
      <Panel className="member-status-row">
        <Panel className="member-subscribe-info">
          <Label
            className="member-subscribe-title-cta"
            text={$.Localize('#member_subscribe_title')}
          />
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
        <Button
          className={
            refreshing ? 'member-refresh-btn member-refresh-btn-loading' : 'member-refresh-btn'
          }
          onactivate={onRefresh}
        >
          <Label className="member-refresh-label" text={$.Localize('#member_refresh')} />
        </Button>
      </Panel>

      {/* 三平台并排 */}
      <Panel className="member-platform-cards">
        {/* 支付宝 */}
        <AlipaySubscribeCard
          tier={defaultTier('alipay')}
          subscribeButtonText={getSubscribeButtonText('alipay', defaultTier('alipay'))}
        />

        {/* 爱发电 */}
        <ExternalPlatformCard
          variantClassName="member-platform-card-afdian"
          descClassName="member-platform-desc-cn"
          logoSrc={AFDIAN_ICON}
          name={$.Localize('#member_platform_afdian')}
          desc={$.Localize('#member_platform_afdian_desc')}
          subscribeUrl={GetAfdianSubscribeUrl()}
          subscribeButtonText={getSubscribeButtonText('afdian', defaultTier('afdian'))}
          shopUrl={AFDIAN_SHOP_URL}
          activateUrl={AFDIAN_ACTIVATE_URL}
        />

        {/* Ko-fi */}
        <ExternalPlatformCard
          variantClassName="member-platform-card-kofi"
          descClassName="member-platform-desc-intl"
          logoSrc={KOFI_LOGO}
          name={$.Localize('#member_platform_kofi')}
          desc={$.Localize('#member_platform_kofi_desc')}
          subscribeUrl={KOFI_SUBSCRIBE_URL}
          subscribeButtonText={getSubscribeButtonText('kofi', defaultTier('kofi'))}
          shopUrl={KOFI_SHOP_URL}
          activateUrl={KOFI_ACTIVATE_URL}
        />
      </Panel>
    </Panel>
  );
}
