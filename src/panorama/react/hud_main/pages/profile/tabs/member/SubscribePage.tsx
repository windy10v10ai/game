import React, { useRef } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import {
  AFDIAN_ACTIVATE_URL,
  AFDIAN_ICON,
  AFDIAN_SHOP_URL,
  GetAfdianSubscribeUrl,
  KOFI_ACTIVATE_URL,
  KOFI_LOGO,
  KOFI_SHOP_URL,
  KOFI_SUBSCRIBE_URL,
  openUrl,
} from './constants';

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

interface SubscribePageProps {
  isNormalOnly: boolean; // 仅普通会员（非高级），显示折算说明
}

export function SubscribePage({ isNormalOnly }: SubscribePageProps) {
  const steamId = GetLocalPlayerSteamAccountID();

  return (
    <Panel className="member-subpage member-subscribe-page">
      {/* 共同提示区 */}
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

      {/* 两平台并排 */}
      <Panel className="member-platform-cards">
        {/* 爱发电 */}
        <Panel className="member-platform-card member-platform-card-afdian">
          <Image className="member-platform-logo" src={AFDIAN_ICON} />
          <Label className="member-platform-name" text={$.Localize('#member_platform_afdian')} />
          <Label
            className="member-platform-desc member-platform-desc-cn"
            text={$.Localize('#member_platform_afdian_desc')}
          />
          <Button
            className="member-platform-btn member-platform-btn-subscribe"
            onactivate={openUrl(GetAfdianSubscribeUrl())}
          >
            <Label
              className="member-platform-btn-label"
              text={$.Localize('#member_subscribe_title')}
            />
          </Button>
          <Panel className="member-platform-divider">
            <Label
              className="member-platform-divider-label"
              text={$.Localize('#member_shop_divider')}
            />
          </Panel>
          <Button
            className="member-platform-btn member-platform-btn-shop"
            onactivate={openUrl(AFDIAN_SHOP_URL)}
          >
            <Label
              className="member-platform-btn-label member-platform-btn-label-ghost"
              text={$.Localize('#member_shop_title')}
            />
          </Button>
          <ActivateRow activateUrl={AFDIAN_ACTIVATE_URL} />
        </Panel>

        {/* Ko-fi */}
        <Panel className="member-platform-card member-platform-card-kofi">
          <Image className="member-platform-logo" src={KOFI_LOGO} />
          <Label className="member-platform-name" text={$.Localize('#member_platform_kofi')} />
          <Label
            className="member-platform-desc member-platform-desc-intl"
            text={$.Localize('#member_platform_kofi_desc')}
          />
          <Button
            className="member-platform-btn member-platform-btn-subscribe"
            onactivate={openUrl(KOFI_SUBSCRIBE_URL)}
          >
            <Label
              className="member-platform-btn-label"
              text={$.Localize('#member_subscribe_title')}
            />
          </Button>
          <Panel className="member-platform-divider">
            <Label
              className="member-platform-divider-label"
              text={$.Localize('#member_shop_divider')}
            />
          </Panel>
          <Button
            className="member-platform-btn member-platform-btn-shop"
            onactivate={openUrl(KOFI_SHOP_URL)}
          >
            <Label
              className="member-platform-btn-label member-platform-btn-label-ghost"
              text={$.Localize('#member_shop_title')}
            />
          </Button>
          <ActivateRow activateUrl={KOFI_ACTIVATE_URL} />
        </Panel>
      </Panel>
    </Panel>
  );
}
