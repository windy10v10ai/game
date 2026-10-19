import React from 'react';

interface PlatformCardHeaderProps {
  logoSrc: string;
  name: string;
  desc: string;
  /** 描述文字额外类（用于不同平台的颜色） */
  descClassName?: string;
  /** 「推荐」角标，支付宝卡与 Stripe 卡用 */
  recommended?: boolean;
}

/**
 * 平台卡片头部：logo 在左，名称 + 描述（两行）在右。
 * Afdian / Ko-fi / Alipay / Stripe 卡片共用此组件。
 */
export function PlatformCardHeader({
  logoSrc,
  name,
  desc,
  descClassName,
  recommended,
}: PlatformCardHeaderProps) {
  return (
    <Panel className="platform-card-header">
      <Image className="platform-card-header-logo" src={logoSrc} />
      <Panel className="platform-card-header-text">
        <Panel className="platform-card-header-name-row">
          <Label className="platform-card-header-name" text={name} />
          {recommended && (
            <Panel className="platform-recommended-badge">
              <Label
                className="platform-recommended-badge-label"
                text={$.Localize('#member_platform_recommended')}
              />
            </Panel>
          )}
        </Panel>
        <Label
          className={
            descClassName
              ? `platform-card-header-desc ${descClassName}`
              : 'platform-card-header-desc'
          }
          text={desc}
        />
      </Panel>
    </Panel>
  );
}
