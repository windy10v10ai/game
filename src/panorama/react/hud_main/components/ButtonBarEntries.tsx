import React from 'react';
import { GetLocalPlayerSteamAccountID, IsInHeroSelectionLayer, WEBSITE_URL } from '@utils/utils';
import { useNavigation } from '../store/NavigationContext';
import { useNetTable } from '../../shared/hooks/useNetTable';
import { ButtonBarEntry } from './ButtonBarEntry';

const PROFILE_ICON = 'file://{images}/custom_game/profile/icon_profile.png';
const MEMBER_ICON = 'file://{images}/custom_game/member/golden_crown.png';
const MEMBER_ICON_INACTIVE = 'file://{images}/custom_game/member/golden_crown_grey.png';
const WEBSITE_ICON = 'file://{images}/custom_game/website/icon_website.png';
const FEEDBACK_ICON = 'file://{images}/custom_game/feedback/icon_feedback.png';

/** 按钮栏里的自定义入口，按这里的先后排列 */
export function ButtonBarEntries() {
  const { currentPage, currentParam, openPage, closePage } = useNavigation();
  const player = useNetTable('player_table', GetLocalPlayerSteamAccountID());
  const memberActive = player?.member?.enable ?? false;
  const heroSelect = IsInHeroSelectionLayer();

  // 已打开任何页面时再点即关闭
  const toggleProfile = (tab: string) =>
    currentPage !== null ? closePage() : openPage('profile', tab);

  return (
    <>
      <ButtonBarEntry
        id="OpenProfileButton"
        icon={PROFILE_ICON}
        tooltip={$.Localize('#profile_title')}
        showInHeroSelect={true}
        // 每日任务候选在选英雄阶段就已下发，此时直接打开每日任务
        onActivate={() => toggleProfile(heroSelect ? 'dailytask' : 'awaken')}
      />
      <ButtonBarEntry
        id="memberButton"
        icon={memberActive ? MEMBER_ICON : MEMBER_ICON_INACTIVE}
        tooltip={$.Localize(
          memberActive ? '#member_button_tooltip_active' : '#member_button_tooltip_inactive',
        )}
        onActivate={() =>
          currentPage === 'profile' && currentParam === 'member'
            ? closePage()
            : openPage('profile', 'member')
        }
      />
      <ButtonBarEntry
        id="websiteButton"
        icon={WEBSITE_ICON}
        tooltip={$.Localize('#website_open_button')}
        iconScale={84}
        onActivate={() => $.DispatchEvent('ExternalBrowserGoToURL', WEBSITE_URL)}
      />
      <ButtonBarEntry
        id="feedbackButton"
        icon={FEEDBACK_ICON}
        tooltip={$.Localize('#feedback_open_button')}
        iconScale={84}
        onActivate={() => toggleProfile('feedback')}
      />
    </>
  );
}
