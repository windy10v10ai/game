import React from 'react';

interface PlatformCardHeaderProps {
  logoSrc: string;
  name: string;
  desc: string;
  /** 描述文字额外类（用于不同平台的颜色） */
  descClassName?: string;
}

/**
 * 平台卡片头部：logo 在左，名称 + 描述（两行）在右。
 * Afdian / Ko-fi / Alipay 三张卡片共用此组件。
 */
export function PlatformCardHeader({
  logoSrc,
  name,
  desc,
  descClassName,
}: PlatformCardHeaderProps) {
  return (
    <Panel className="platform-card-header">
      <Image className="platform-card-header-logo" src={logoSrc} />
      <Panel className="platform-card-header-text">
        <Label className="platform-card-header-name" text={name} />
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
