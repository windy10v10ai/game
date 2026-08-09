import { useEffect, useRef } from 'react';
import { FindDotaHudElement, IsInHeroSelectionLayer } from '@utils/utils';
import { getDailyChallengeEntryIndicator } from '../pages/daily-challenge/daily-challenge-ui';
import { useDailyChallenge } from '../store/DailyChallengeContext';
import { useNavigation } from '../store/NavigationContext';

const BUTTON_ID = 'DailyChallengeEntryButton';
const TITLE_LABEL_ID = 'DailyChallengeEntryTitle';
const BADGE_ID = 'DailyChallengeEntryBadge';
const DOT_ID = 'DailyChallengeEntryDot';

export function DailyChallengeEntryButton() {
  const { currentPage, openPage, closePage } = useNavigation();
  const { snapshot } = useDailyChallenge();
  const navRef = useRef({ currentPage, openPage, closePage });

  useEffect(() => {
    navRef.current = { currentPage, openPage, closePage };
  }, [currentPage, openPage, closePage]);

  useEffect(() => {
    const heroSelectLayer = IsInHeroSelectionLayer();
    let host: Panel | null = $.GetContextPanel();
    if (!heroSelectLayer) {
      try {
        host = FindDotaHudElement('ButtonBar');
      } catch (error) {
        $.Msg('[DailyChallengeEntryButton] cannot locate ButtonBar: ', error);
        host = null;
      }
    }
    if (!host) return () => {};

    const button = host.FindChild(BUTTON_ID) ?? $.CreatePanel('Button', host, BUTTON_ID);
    button.style.width = '50px';
    button.style.height = '50px';
    if (heroSelectLayer) {
      button.AddClass('hud-hero-select-daily-challenge-entry-btn');
    } else {
      button.style.marginLeft = '2px';
      button.style.marginRight = '2px';
    }
    button.style.backgroundColor = '#2b1746ee';
    button.style.border = '1px solid #c49a4a88';
    button.style.borderRadius = '5px';

    const title =
      button.FindChild(TITLE_LABEL_ID) ?? $.CreatePanel('Label', button, TITLE_LABEL_ID);
    title.text = $.Localize('#daily_challenge_entry_short');
    title.hittest = false;
    title.style.horizontalAlign = 'center';
    title.style.verticalAlign = 'center';
    title.style.fontSize = '24px';
    title.style.fontWeight = 'bold';
    title.style.color = '#f4d68c';
    title.style.textShadow = '0px 1px 3px 2 #000000';

    const badge = button.FindChild(BADGE_ID) ?? $.CreatePanel('Label', button, BADGE_ID);
    badge.hittest = false;
    badge.style.horizontalAlign = 'right';
    badge.style.verticalAlign = 'top';
    badge.style.minWidth = '18px';
    badge.style.height = '18px';
    badge.style.marginRight = '-4px';
    badge.style.marginTop = '-4px';
    badge.style.paddingLeft = '4px';
    badge.style.paddingRight = '4px';
    badge.style.borderRadius = '9px';
    badge.style.backgroundColor = '#d93636';
    badge.style.color = 'white';
    badge.style.fontSize = '13px';
    badge.style.fontWeight = 'bold';
    badge.style.textAlign = 'center';

    const dot = button.FindChild(DOT_ID) ?? $.CreatePanel('Panel', button, DOT_ID);
    dot.hittest = false;
    dot.style.horizontalAlign = 'right';
    dot.style.verticalAlign = 'top';
    dot.style.width = '12px';
    dot.style.height = '12px';
    dot.style.marginRight = '-2px';
    dot.style.marginTop = '-2px';
    dot.style.borderRadius = '6px';
    dot.style.backgroundColor = '#ef3f3f';
    dot.style.boxShadow = '0px 0px 5px 1 #ef3f3faa';

    button.SetPanelEvent('onactivate', () => {
      const nav = navRef.current;
      if (nav.currentPage === 'daily-challenge') nav.closePage();
      else nav.openPage('daily-challenge');
    });
    button.SetPanelEvent('onmouseover', () => {
      $.DispatchEvent('DOTAShowTextTooltip', button, $.Localize('#daily_challenge_title'));
    });
    button.SetPanelEvent('onmouseout', () => $.DispatchEvent('DOTAHideTextTooltip'));

    return () => {
      button.ClearPanelEvent('onactivate');
      button.ClearPanelEvent('onmouseover');
      button.ClearPanelEvent('onmouseout');
      button.DeleteAsync(0);
    };
  }, []);

  useEffect(() => {
    let host: Panel | null = $.GetContextPanel();
    if (!IsInHeroSelectionLayer()) {
      try {
        host = FindDotaHudElement('ButtonBar');
      } catch {
        host = null;
      }
    }
    const button = host?.FindChild(BUTTON_ID);
    const badge = button?.FindChild(BADGE_ID);
    const dot = button?.FindChild(DOT_ID);
    if (!badge || !dot) return;
    const indicator = getDailyChallengeEntryIndicator(
      snapshot?.unreadRewardCount ?? 0,
      snapshot?.needsSelection ?? false,
    );
    badge.visible = indicator.kind === 'count';
    dot.visible = indicator.kind === 'dot';
    if (indicator.kind === 'count') badge.text = indicator.text;
  }, [snapshot]);

  return null;
}
