import React, { useRef } from 'react';
import { openUrl } from './constants';
import { PlatformCardHeader } from './PlatformCardHeader';

interface ExternalPlatformCardProps {
  /** 卡片 className 后缀，用于平台主题色（border-color 等） */
  variantClassName: string;
  /** 描述文字额外类（用于平台主题色） */
  descClassName: string;
  logoSrc: string;
  name: string;
  desc: string;
  subscribeUrl: string;
  subscribePrice: string;
  subscribeUnitText: string;
  shopUrl: string;
  activateUrl: string;
}

/**
 * 外部跳链型平台卡片（Afdian / Ko-fi）：
 * 点订阅 / 购买积分按钮 → 在外部浏览器打开订阅链接，不在游戏内做支付状态机。
 */
export function ExternalPlatformCard({
  variantClassName,
  descClassName,
  logoSrc,
  name,
  desc,
  subscribeUrl,
  subscribePrice,
  subscribeUnitText,
  shopUrl,
  activateUrl,
}: ExternalPlatformCardProps) {
  return (
    <Panel className={`member-platform-card ${variantClassName}`}>
      <PlatformCardHeader logoSrc={logoSrc} name={name} desc={desc} descClassName={descClassName} />
      <Button
        className="member-platform-btn member-platform-btn-subscribe"
        onactivate={openUrl(subscribeUrl)}
      >
        <Panel className="subscribe-price-row">
          <Label
            className="subscribe-price-main"
            text={$.Localize('#member_platform_subscribe_btn') + subscribePrice}
          />
          <Label className="subscribe-price-unit" text={subscribeUnitText} />
        </Panel>
      </Button>
      <Panel className="member-platform-divider">
        <Label
          className="member-platform-divider-label"
          text={$.Localize('#member_shop_divider')}
        />
      </Panel>
      <Button
        className="member-platform-btn member-platform-btn-shop"
        onactivate={openUrl(shopUrl)}
      >
        <Label
          className="member-platform-btn-label member-platform-btn-label-ghost"
          text={$.Localize('#member_shop_title')}
        />
      </Button>
      <ActivateRow activateUrl={activateUrl} />
    </Panel>
  );
}

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
