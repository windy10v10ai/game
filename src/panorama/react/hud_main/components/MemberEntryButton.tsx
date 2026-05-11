import { useEffect, useRef } from 'react';
import { FindDotaHudElement, GetLocalPlayerSteamAccountID } from '@utils/utils';
import { useNavigation } from '../store/NavigationContext';
import { useNetTable } from '../../shared/hooks/useNetTable';

const MEMBER_BUTTON_ID = 'memberButton';

export function MemberEntryButton() {
  const { currentPage, currentParam, openPage, closePage } = useNavigation();
  const steamId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamId);
  const member = player?.member ?? null;

  const memberRef = useRef(member);
  useEffect(() => {
    memberRef.current = member;
  }, [member]);

  const navRef = useRef({ currentPage, currentParam, openPage, closePage });
  useEffect(() => {
    navRef.current = { currentPage, currentParam, openPage, closePage };
  }, [currentPage, currentParam, openPage, closePage]);

  // Effect 1: 创建 panel，绑定事件（一次性）
  useEffect(() => {
    let buttonBar: Panel | null = null;
    try {
      buttonBar = FindDotaHudElement('ButtonBar');
    } catch (e) {
      $.Msg('[MemberEntryButton] cannot locate ButtonBar: ', e);
    }
    if (!buttonBar) {
      return () => {
        /* noop */
      };
    }

    const existing = buttonBar.FindChild(MEMBER_BUTTON_ID);
    const button = existing ?? $.CreatePanel('Button', buttonBar, MEMBER_BUTTON_ID);

    button.style.width = '46px';
    button.style.height = '46px';
    button.style.marginLeft = '2px';
    button.style.marginRight = '2px';
    button.style.backgroundSize = '100% 100%';
    button.style.backgroundRepeat = 'no-repeat';

    button.SetPanelEvent('onactivate', () => {
      const nav = navRef.current;
      if (nav.currentPage === 'profile' && nav.currentParam === 'member') {
        nav.closePage();
      } else {
        nav.openPage('profile', 'member');
      }
    });

    button.SetPanelEvent('onmouseover', () => {
      const key = memberRef.current?.enable
        ? '#member_button_tooltip_active'
        : '#member_button_tooltip_inactive';
      $.DispatchEvent('DOTAShowTextTooltip', button, $.Localize(key));
    });

    button.SetPanelEvent('onmouseout', () => {
      $.DispatchEvent('DOTAHideTextTooltip');
    });

    return () => {
      button.ClearPanelEvent('onactivate');
      button.ClearPanelEvent('onmouseover');
      button.ClearPanelEvent('onmouseout');
      button.DeleteAsync(0);
    };
  }, []);

  // Effect 2: 响应 member 变化，更新背景图
  useEffect(() => {
    let buttonBar: Panel | null = null;
    try {
      buttonBar = FindDotaHudElement('ButtonBar');
    } catch {
      /* ignore */
    }
    if (!buttonBar) return;
    const button = buttonBar.FindChild(MEMBER_BUTTON_ID);
    if (!button) return;
    button.style.backgroundImage = member?.enable
      ? "url('file://{images}/custom_game/golden_crown.png')"
      : "url('file://{images}/custom_game/golden_crown_grey.png')";
  }, [member]);

  return null;
}
