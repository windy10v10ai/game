import React from 'react';
import { STRIPE_MEMBERSHIP_URL } from '@utils/utils';
import { formatTierDuration, openUrl } from './constants';
import {
  EXTERNAL_LINK_ICON,
  STRIPE_LOGO,
  STRIPE_MEMBER_TIERS,
  STRIPE_PAY_LOGOS,
  STRIPE_POINTS_TIERS,
  StripePointsTier,
} from './constants';
import { PlatformCardHeader } from './PlatformCardHeader';

/** Stripe 卡公共部分：Logo、推荐角标、支付方式小图标、底部网站链接。不做游戏内支付流程，所有按钮跳同一网站链接 */
function StripeCardShell({ children }: { children: React.ReactNode }) {
  return (
    <Panel className="member-platform-card member-platform-card-layered member-platform-card-stripe">
      <Panel className="member-platform-card-body">
        <PlatformCardHeader
          logoSrc={STRIPE_LOGO}
          name={$.Localize('#member_platform_stripe')}
          desc={$.Localize('#member_platform_stripe_desc')}
          descClassName="platform-card-header-desc-stripe"
          recommended
        />
        <Panel className="stripe-pay-logos">
          {STRIPE_PAY_LOGOS.map((logo) => (
            <Panel key={logo.src} className="stripe-pay-logo-chip">
              <Image
                className="stripe-pay-logo-img"
                src={logo.src}
                style={{ width: `${logo.width}px` }}
              />
            </Panel>
          ))}
        </Panel>
        {children}
      </Panel>
      <Panel
        className="member-platform-activate-row stripe-site-link"
        onactivate={openUrl(STRIPE_MEMBERSHIP_URL)}
      >
        <Label
          className="member-platform-activate"
          text={$.Localize('#member_platform_stripe_link')}
        />
        <Image className="stripe-site-link-icon" src={EXTERNAL_LINK_ICON} />
      </Panel>
    </Panel>
  );
}

function StripeTierButton({
  main,
  sub,
  discount,
}: {
  main: string;
  sub: string;
  discount?: string;
}) {
  return (
    <Button
      className="member-platform-btn member-platform-btn-subscribe stripe-tier-btn"
      onactivate={openUrl(STRIPE_MEMBERSHIP_URL)}
    >
      <Panel className="stripe-tier-btn-content">
        <Panel className="subscribe-price-row">
          <Label className="subscribe-price-main" text={main} />
        </Panel>
        <Panel className="stripe-tier-sub-row">
          <Label className="stripe-tier-month" text={sub} />
          {discount && <Label className="stripe-tier-discount" text={discount} />}
        </Panel>
      </Panel>
    </Button>
  );
}

/** 订阅页 Stripe 卡：4 个档位按钮，均跳同一网站链接，不在游戏内下单 */
export function StripeSubscribeCard() {
  return (
    <StripeCardShell>
      <Panel className="stripe-tier-list">
        {STRIPE_MEMBER_TIERS.map((tier) => (
          <StripeTierButton
            key={tier.months}
            main={`$${tier.pricePerMonth} ${$.Localize('#member_platform_subscribe_month')}`}
            sub={formatTierDuration(tier.months)}
            discount={
              tier.discountPercent > 0
                ? $.Localize('#member_alipay_discount_fmt').replace(
                    '{n}',
                    String(tier.discountPercent),
                  )
                : undefined
            }
          />
        ))}
      </Panel>
    </StripeCardShell>
  );
}

const pointsSaveLabel = (tier: StripePointsTier) =>
  tier.savedAmount > 0
    ? $.Localize('#member_points_save_usd_fmt').replace('{n}', String(tier.savedAmount))
    : undefined;

/** 积分页 Stripe 卡：3 个档位按钮，均跳同一网站链接 */
export function StripePointsCard() {
  return (
    <StripeCardShell>
      <Panel className="stripe-tier-list">
        {STRIPE_POINTS_TIERS.map((tier) => (
          <StripeTierButton
            key={tier.points}
            main={$.Localize('#member_points_amount_fmt').replace('{n}', String(tier.points))}
            sub={`$${tier.price}`}
            discount={pointsSaveLabel(tier)}
          />
        ))}
      </Panel>
    </StripeCardShell>
  );
}
