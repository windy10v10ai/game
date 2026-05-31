import React, { useEffect, useRef } from 'react';
import { AlipayProductCode } from '../constants';
import { PlatformCardHeader } from '../PlatformCardHeader';
import { ALIPAY_LOGO, ALIPAY_RECEIVE_ICON } from './constants';
import { QrCodeView } from './QrCodeView';
import { useAlipayOrder } from './useAlipayOrder';

/** 会员档位与积分档位统一归一到此形状，喂给同一张卡片 */
export interface AlipayCardItem {
  productCode: AlipayProductCode;
  quantity: number;
  priceMain: string;
  unitText?: string;
  subLabel: string;
  discountLabel?: string;
  /** 积分档位：购买的积分数量（用于成功提示） */
  points?: number;
  /** 成功提示图标（覆盖默认的对勾图标） */
  successIconSrc?: string;
}

interface AlipaySubscribeCardProps {
  items: AlipayCardItem[];
  nameKey: string;
  descKey: string;
}

export function AlipaySubscribeCard({ items, nameKey, descKey }: AlipaySubscribeCardProps) {
  const { order, start, retry, clear, cooling } = useAlipayOrder();
  const status = order?.status;

  const productCodes = items.map((it) => it.productCode);
  // 会员卡与积分卡共用一张 alipay_order net table，按 productCode 区分本卡是否在支付，避免串码
  const paying =
    !!status &&
    status !== 'IDLE' &&
    !!order?.productCode &&
    productCodes.includes(order.productCode as AlipayProductCode);

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

  const handleSubscribe = (productCode: AlipayProductCode, quantity: number) => {
    start(productCode, quantity);
  };

  const handleClose = () => {
    // 关闭：任何状态统一清空 net table —— 下次点订阅一定是全新订单
    clear();
  };

  // 从 net table 里的 productCode + quantity 反查 item，用于成功提示
  const activeItem =
    order?.productCode && order.quantity != null
      ? items.find((it) => it.productCode === order.productCode && it.quantity === order.quantity)
      : items.find((it) => it.productCode === order?.productCode);
  const isPoints = activeItem?.points != null;
  const successIconSrc = activeItem?.successIconSrc ?? ALIPAY_RECEIVE_ICON;
  const successTitle = (() => {
    if (activeItem?.points != null) {
      return $.Localize('#member_points_paid_title').replace('{n}', String(activeItem.points));
    }
    if (activeItem?.subLabel) {
      return $.Localize('#member_subscribe_paid_title').replace('{duration}', activeItem.subLabel);
    }
    return $.Localize('#member_alipay_status_paid_title');
  })();

  return (
    <Panel className="member-platform-card member-platform-card-alipay">
      <PlatformCardHeader
        logoSrc={ALIPAY_LOGO}
        name={$.Localize(nameKey)}
        desc={$.Localize(descKey)}
        descClassName="platform-card-header-desc-alipay"
      />

      {!paying ? (
        <AlipayIdleContent items={items} onStart={handleSubscribe} disabled={cooling} />
      ) : (
        <AlipayPayingContent
          status={status}
          qrCode={order?.qrCode}
          subject={order?.subject}
          totalAmount={order?.totalAmount}
          onClose={handleClose}
          onRetry={retry}
          cooling={cooling}
          successIconSrc={successIconSrc}
          successTitle={successTitle}
          isPoints={isPoints}
        />
      )}
    </Panel>
  );
}

function AlipayIdleContent({
  items,
  onStart,
  disabled,
}: {
  items: AlipayCardItem[];
  onStart: (productCode: AlipayProductCode, quantity: number) => void;
  disabled: boolean;
}) {
  return (
    <Panel className="alipay-tier-list">
      {items.map((item) => (
        <Button
          key={item.productCode + ':' + item.quantity}
          className="member-platform-btn member-platform-btn-subscribe alipay-tier-btn"
          onactivate={() => onStart(item.productCode, item.quantity)}
          enabled={!disabled}
        >
          <Panel className="alipay-tier-btn-content">
            <Panel className="subscribe-price-row">
              <Label className="subscribe-price-main" text={item.priceMain} />
              {item.unitText && <Label className="subscribe-price-unit" text={item.unitText} />}
            </Panel>
            <Panel className="alipay-tier-sub-row">
              <Label className="alipay-tier-month" text={item.subLabel} />
              {item.discountLabel && (
                <Label className="alipay-tier-discount" text={item.discountLabel} />
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
  successIconSrc,
  successTitle,
  isPoints,
}: {
  status: string | undefined;
  qrCode: string | undefined;
  subject: string | undefined;
  totalAmount: string | undefined;
  onClose: () => void;
  onRetry: () => void;
  cooling: boolean;
  successIconSrc: string;
  successTitle: string;
  isPoints: boolean;
}) {
  // SUCCESS 单独走专用展示
  if (status === 'SUCCESS') {
    return (
      <AlipaySuccessContent
        iconSrc={successIconSrc}
        title={successTitle}
        isPoints={isPoints}
        onClose={onClose}
      />
    );
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

function AlipaySuccessContent({
  iconSrc,
  title,
  isPoints,
  onClose,
}: {
  iconSrc: string;
  title: string;
  isPoints: boolean;
  onClose: () => void;
}) {
  const iconClass = isPoints
    ? 'alipay-card-success-icon alipay-card-success-icon-points'
    : 'alipay-card-success-icon alipay-card-success-icon-member';
  return (
    <React.Fragment>
      <Image className={iconClass} src={iconSrc} />
      <Label className="alipay-card-success-title" text={title} />
      <Panel className="alipay-card-actions">
        <Button className="member-platform-btn alipay-card-btn-close" onactivate={onClose}>
          <Label className="member-platform-btn-label" text={$.Localize('#member_alipay_close')} />
        </Button>
      </Panel>
    </React.Fragment>
  );
}
