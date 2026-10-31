import React, { useEffect, useState } from 'react';
import { IsInGameHudLayer } from '@utils/utils';
import { useNetTable } from '../../shared/hooks/useNetTable';
import { formatStatNumber } from '../../shared/utils/format-stat-number';
import { getMetricShortLabel, getTaskTitle } from '../pages/profile/tabs/dailytask/dailytask-ui';
import { useNavigation } from '../store/NavigationContext';
import { getDailyTaskHudState } from './dailytask-progress-state';

const localize = (key: string): string => $.Localize(key);

function isGameStarted(): boolean {
  return !Game.GameStateIsBefore(DOTA_GameState.DOTA_GAMERULES_STATE_PRE_GAME);
}

/**
 * 局内每日任务进度浮窗。屏幕角落常驻一行，点击打开每日任务面板。
 */
export function DailyTaskProgressWidget() {
  const { currentPage, currentParam, openPage, closePage } = useNavigation();
  const playerId = Game.GetLocalPlayerID();
  const rowKey = playerId >= 0 ? String(playerId) : null;
  const dailyTask = useNetTable('daily_task', rowKey);
  const progress = useNetTable('daily_task_progress', rowKey);
  const [gameStarted, setGameStarted] = useState(isGameStarted);
  // hud_main 同时注册在三层，只在游戏内 HUD 层渲染一份；所在层不会变，只判定一次
  const [inHudLayer] = useState(IsInGameHudLayer);

  useEffect(() => {
    const listener = GameEvents.Subscribe('game_rules_state_change', () => {
      setGameStarted(isGameStarted());
    });
    return () => {
      GameEvents.Unsubscribe(listener);
    };
  }, []);

  const state = getDailyTaskHudState(
    dailyTask,
    progress,
    playerId >= 0 ? Players.GetPlayerSelectedHero(playerId) : '',
    gameStarted,
  );
  const hidden = !inHudLayer || state.kind === 'hidden';

  let modifierClass = '';
  let heroName: string | undefined;
  let stars = '';
  let mainText = '';
  let tooltipText = '';

  if (state.kind === 'unclaimed') {
    modifierClass = ' dailytask-hud-unclaimed';
    mainText = localize('#dailytask_hud_unclaimed');
    tooltipText = localize('#dailytask_hud_unclaimed_tip');
  } else if (state.kind === 'hero_mismatch') {
    modifierClass = ' dailytask-hud-mismatch';
    heroName = state.candidate.heroName;
    stars = '★'.repeat(state.candidate.star);
    mainText = localize('#dailytask_hud_hero_mismatch');
    tooltipText = localize('#dailytask_hud_hero_mismatch_tip');
  } else if (state.kind === 'progress') {
    const { candidate, value, completed } = state;
    const isChinese = $.Language() === 'schinese';
    modifierClass = completed ? ' dailytask-hud-completed' : '';
    heroName = candidate.heroName;
    stars = '★'.repeat(candidate.star);
    // 达标后封顶显示 target/target，超出多少已无意义，17/10 这种写法容易被当成显示错误
    const shown = formatStatNumber(Math.min(value, candidate.target), isChinese);
    const target = formatStatNumber(candidate.target, isChinese);
    const label = getMetricShortLabel(candidate.metric, localize) ?? '';
    mainText = `${label} ${shown}/${target}${completed ? ' ✓' : ''}`;
    tooltipText = getTaskTitle(candidate, $.Language(), localize) ?? '';
  }

  const handleClick = () => {
    if (currentPage === 'profile' && currentParam === 'dailytask') {
      closePage();
    } else {
      openPage('profile', 'dailytask');
    }
  };

  return (
    <Panel
      className={`dailytask-hud${modifierClass}`}
      style={{ visibility: hidden ? 'collapse' : 'visible' }}
      onactivate={handleClick}
      onmouseover={(panel) => $.DispatchEvent('DOTAShowTextTooltip', panel, tooltipText)}
      onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
    >
      {heroName ? (
        <DOTAHeroImage className="dailytask-hud-hero" heroname={heroName} heroimagestyle="icon" />
      ) : null}
      {stars ? <Label className="dailytask-hud-star" text={stars} /> : null}
      <Label className="dailytask-hud-text" text={mainText} />
    </Panel>
  );
}
