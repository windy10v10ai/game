import React from 'react';
import { GetLocalPlayerSteamAccountID, GetAfdianPointsUrl, KOFI_POINTS_URLS } from '@utils/utils';
import { AlipaySubscribeCard, AlipayCardItem } from './alipay';
import { ExternalPointsCard } from './ExternalPointsCard';
import {
  AFDIAN_ACTIVATE_URL,
  AFDIAN_ICON,
  ALIPAY_POINTS_TIERS,
  KOFI_ACTIVATE_URL,
  KOFI_LOGO,
  openUrl,
} from './constants';

interface PointsPageProps {
  refreshing: boolean;
  onRefresh: () => void;
}

// 外链统一显示原价（游戏内无法得知平台会员折扣）
const AFDIAN_POINTS_PRICES = ['98.00', '280.00', '648.00'];
const KOFI_POINTS_PRICES = ['11.99', '36.99', '89.99'];
const POINTS_AMOUNTS = [3500, 11000, 28000];

export function PointsPage({ refreshing, onRefresh }: PointsPageProps) {
  const steamId = GetLocalPlayerSteamAccountID();

  const alipayItems: AlipayCardItem[] = ALIPAY_POINTS_TIERS.map((tier) => ({
    productCode: tier.productCode,
    quantity: 1,
    priceMain: $.Localize('#member_points_amount_fmt').replace('{n}', String(tier.points)),
    subLabel: `¥${tier.price}`,
    discountLabel:
      tier.savedAmount > 0
        ? $.Localize('#member_points_save_fmt').replace('{n}', String(tier.savedAmount))
        : undefined,
  }));

  const pointsLabel = (i: number) =>
    $.Localize('#member_points_amount_fmt').replace('{n}', String(POINTS_AMOUNTS[i]));

  return (
    <Panel className="member-subpage member-points-page">
      <Panel className="member-status-row">
        <Panel className="member-subscribe-info">
          <Label className="member-subscribe-title-cta" text={$.Localize('#member_points_title')} />
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
          <Label className="member-subscribe-hint" text={$.Localize('#member_points_usage_hint')} />
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

      <Panel className="member-platform-cards">
        <AlipaySubscribeCard
          items={alipayItems}
          nameKey="#member_platform_alipay"
          descKey="#member_platform_alipay_desc"
        />

        <ExternalPointsCard
          variantClassName="member-platform-card-afdian"
          descClassName="member-platform-desc-cn"
          logoSrc={AFDIAN_ICON}
          name={$.Localize('#member_platform_afdian')}
          desc={$.Localize('#member_platform_afdian_desc')}
          buttons={POINTS_AMOUNTS.map((_, i) => ({
            label: pointsLabel(i),
            price: `¥${AFDIAN_POINTS_PRICES[i]}`,
            onClick: openUrl(GetAfdianPointsUrl(i)),
          }))}
          activateUrl={AFDIAN_ACTIVATE_URL}
        />

        <ExternalPointsCard
          variantClassName="member-platform-card-kofi"
          descClassName="member-platform-desc-intl"
          logoSrc={KOFI_LOGO}
          name={$.Localize('#member_platform_kofi')}
          desc={$.Localize('#member_platform_kofi_desc')}
          buttons={POINTS_AMOUNTS.map((_, i) => ({
            label: pointsLabel(i),
            price: `$${KOFI_POINTS_PRICES[i]}`,
            onClick: openUrl(KOFI_POINTS_URLS[i]),
          }))}
          activateUrl={KOFI_ACTIVATE_URL}
        />
      </Panel>
    </Panel>
  );
}
