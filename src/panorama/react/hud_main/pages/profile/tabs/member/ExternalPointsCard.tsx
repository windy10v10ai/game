import React, { useRef } from 'react';
import { openUrl } from './constants';
import { PlatformCardHeader } from './PlatformCardHeader';

export interface PointsButton {
  label: string;
  price: string;
  onClick: () => void;
}

interface ExternalPointsCardProps {
  variantClassName: string;
  descClassName: string;
  logoSrc: string;
  name: string;
  desc: string;
  buttons: PointsButton[];
  activateUrl: string;
}

/** 外链积分卡（爱发电 / Ko-fi）：三档位按钮各自跳浏览器，底部保留手动激活链接。 */
export function ExternalPointsCard({
  variantClassName,
  descClassName,
  logoSrc,
  name,
  desc,
  buttons,
  activateUrl,
}: ExternalPointsCardProps) {
  return (
    <Panel className={`member-platform-card ${variantClassName}`}>
      <PlatformCardHeader logoSrc={logoSrc} name={name} desc={desc} descClassName={descClassName} />
      {buttons.map((btn, i) => (
        <Button
          key={i}
          className="member-platform-btn member-platform-btn-subscribe points-external-btn"
          onactivate={btn.onClick}
        >
          <Panel className="subscribe-price-row">
            <Label className="subscribe-price-main" text={btn.label} />
            <Label className="subscribe-price-unit" text={btn.price} />
          </Panel>
        </Button>
      ))}
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
