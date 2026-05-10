import React, { useEffect, useRef } from 'react';
import { MembershipPlanTier, MEMBERSHIP_PLATFORMS } from '../constants';
import { PlatformCardHeader } from '../PlatformCardHeader';
import { ALIPAY_LOGO, ALIPAY_RECEIVE_ICON } from './constants';
import { QrCodeView } from './QrCodeView';
import { useAlipayOrder } from './useAlipayOrder';

interface AlipaySubscribeCardProps {
  tiers: MembershipPlanTier[];
}

export function AlipaySubscribeCard({ tiers }: AlipaySubscribeCardProps) {
  // alipay 平台的 productCode 一定存在（constants 中已配置）
  const productCode = MEMBERSHIP_PLATFORMS.alipay.productCode!;
  const { order, start, retry, clear, cooling } = useAlipayOrder({ productCode });
  const status = order?.status;

  // paying 完全由 net table 推导：有活动订单（非 IDLE）就显示支付画面
  const paying = !!status && status !== 'IDLE';

  // 支付成功：仅在状态由非 SUCCESS 变为 SUCCESS 的那一刻刷新会员信息一次。
  // 注意：组件 unmount/remount（切走再切回 sub tab）prevStatus 会重置为 undefined，
  // 看到 status='SUCCESS' 时已不是 transition（也是 undefined → SUCCESS），所以
  // 这里用「上一次确实见过非 SUCCESS 状态（CREATING/WAITING）」来识别真正的支付完成时刻。
  const sawPendingRef = useRef(false);
  useEffect(() => {
    if (status === 'CREATING' || status === 'WAITING') {
      sawPendingRef.current = true;
      return;
    }
    if (status === 'SUCCESS' && sawPendingRef.current) {
      sawPendingRef.current = false;
      // 仅刷新会员数据；不跳回状态子页（用户点「关闭」时再回 idle）
      GameEvents.SendCustomGameEventToServer('player_info_refresh', {});
    }
  }, [status]);

  const handleSubscribe = (quantity: number) => {
    // net table 空 → 发新单；已有订单（很少出现，比如另一个 sub tab 同步触发）→ 仅切到 paying
    start(quantity);
  };

  const handleClose = () => {
    // 关闭：任何状态统一清空 net table —— 下次点订阅一定是全新订单
    clear();
  };

  return (
    <Panel className="member-platform-card member-platform-card-alipay">
      <PlatformCardHeader
        logoSrc={ALIPAY_LOGO}
        name={$.Localize('#member_platform_alipay')}
        desc={$.Localize('#member_platform_alipay_desc')}
        descClassName="platform-card-header-desc-alipay"
      />

      {!paying ? (
        <AlipayIdleContent tiers={tiers} onStart={handleSubscribe} disabled={cooling} />
      ) : (
        <AlipayPayingContent
          status={status}
          qrCode={order?.qrCode}
          subject={order?.subject}
          totalAmount={order?.totalAmount}
          onClose={handleClose}
          onRetry={retry}
          cooling={cooling}
        />
      )}
    </Panel>
  );
}

function formatDiscountLabel(discountPercent: number): string {
  return $.Localize('#member_alipay_discount_fmt').replace('{n}', String(discountPercent));
}

function formatMonthLabel(quantity: number): string {
  if (quantity % 12 === 0) {
    return $.Localize('#member_alipay_tier_year_fmt').replace('{n}', String(quantity / 12));
  }
  return $.Localize('#member_alipay_tier_month_fmt').replace('{n}', String(quantity));
}

function AlipayIdleContent({
  tiers,
  onStart,
  disabled,
}: {
  tiers: MembershipPlanTier[];
  onStart: (quantity: number) => void;
  disabled: boolean;
}) {
  return (
    <Panel className="alipay-tier-list">
      {tiers.map((tier) => (
        <Button
          key={tier.quantity}
          className="member-platform-btn member-platform-btn-subscribe alipay-tier-btn"
          onactivate={() => onStart(tier.quantity)}
          enabled={!disabled}
        >
          <Panel className="alipay-tier-btn-content">
            <Label className="alipay-tier-price" text={`¥${tier.pricePerMonth}/月`} />
            <Panel className="alipay-tier-sub-row">
              <Label className="alipay-tier-month" text={formatMonthLabel(tier.quantity)} />
              {tier.discountPercent > 0 && (
                <Label
                  className="alipay-tier-discount"
                  text={formatDiscountLabel(tier.discountPercent)}
                />
              )}
            </Panel>
          </Panel>
        </Button>
      ))}
    </Panel>
  );
}

function AlipayPayingContent({
  status,
  qrCode,
  subject,
  totalAmount,
  onClose,
  onRetry,
  cooling,
}: {
  status: string | undefined;
  qrCode: string | undefined;
  subject: string | undefined;
  totalAmount: string | undefined;
  onClose: () => void;
  onRetry: () => void;
  cooling: boolean;
}) {
  // SUCCESS 单独走专用展示
  if (status === 'SUCCESS') {
    return <AlipaySuccessContent onClose={onClose} />;
  }

  const showQr = status === 'WAITING' && !!qrCode;
  // RATE_LIMITED 不显示重试按钮（重试也会被立即拦截，没意义）
  const showRetry = status === 'CLOSED' || status === 'FAILED' || status === 'ERROR';

  const statusKey = (() => {
    switch (status) {
      case 'CREATING':
        return '#member_alipay_status_creating';
      case 'WAITING':
        return '#member_alipay_status_waiting';
      case 'CLOSED':
        return '#member_alipay_status_closed';
      case 'FAILED':
        return '#member_alipay_status_failed';
      case 'ERROR':
        return '#member_alipay_status_error';
      case 'RATE_LIMITED':
        return '#member_alipay_status_rate_limited';
      default:
        return '#member_alipay_status_creating';
    }
  })();

  return (
    <React.Fragment>
      {showQr ? (
        <QrCodeView value={qrCode!} cellSize={6} />
      ) : (
        <Panel className="alipay-card-placeholder" />
      )}

      {(subject || totalAmount) && (
        <Panel className="alipay-card-info-row">
          {subject && <Label className="alipay-card-subject" text={subject} />}
          {totalAmount && <Label className="alipay-card-amount" text={`¥${totalAmount}`} />}
        </Panel>
      )}

      <Label className="alipay-card-status" text={$.Localize(statusKey)} />

      <Panel className="alipay-card-actions">
        {showRetry && (
          <Button
            className="member-platform-btn alipay-card-btn-retry"
            onactivate={onRetry}
            enabled={!cooling}
          >
            <Label
              className="member-platform-btn-label"
              text={$.Localize('#member_alipay_retry')}
            />
          </Button>
        )}
        <Button className="member-platform-btn alipay-card-btn-cancel" onactivate={onClose}>
          <Label
            className="member-platform-btn-label member-platform-btn-label-ghost"
            text={$.Localize('#member_alipay_close')}
          />
        </Button>
      </Panel>
    </React.Fragment>
  );
}

function AlipaySuccessContent({ onClose }: { onClose: () => void }) {
  return (
    <React.Fragment>
      <Image className="alipay-card-success-icon" src={ALIPAY_RECEIVE_ICON} />
      <Label
        className="alipay-card-success-title"
        text={$.Localize('#member_alipay_status_paid_title')}
      />
      <Panel className="alipay-card-actions">
        <Button className="member-platform-btn alipay-card-btn-close" onactivate={onClose}>
          <Label className="member-platform-btn-label" text={$.Localize('#member_alipay_close')} />
        </Button>
      </Panel>
    </React.Fragment>
  );
}
