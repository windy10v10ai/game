import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React from 'react';
import { render } from 'react-panorama-x';
import HudMain from './HudMain';

const MAX_POSSESSION_SELECT_ATTEMPTS = 30;
let possessionSelectionRevision = 0;

function selectPossessionEntityWhenControllable(
  entindex: EntityIndex,
  revision: number,
  attempt = 0,
): void {
  if (revision !== possessionSelectionRevision) return;

  const localPlayerId = Game.GetLocalPlayerID();
  if (
    Entities.IsValidEntity(entindex) &&
    Entities.IsControllableByPlayer(entindex, localPlayerId) &&
    !Entities.IsOutOfGame(entindex)
  ) {
    // 不建立服务器 override；等待客户端确认选择成功后就停止重试，之后仍可自由查看其他英雄。
    GameUI.SelectUnit(entindex, false);
    if (
      Players.GetLocalPlayerPortraitUnit() !== entindex &&
      attempt < MAX_POSSESSION_SELECT_ATTEMPTS
    ) {
      $.Schedule(0.03, () =>
        selectPossessionEntityWhenControllable(entindex, revision, attempt + 1),
      );
    }
    return;
  }

  if (attempt < MAX_POSSESSION_SELECT_ATTEMPTS) {
    $.Schedule(0.03, () => selectPossessionEntityWhenControllable(entindex, revision, attempt + 1));
  }
}

GameEvents.Subscribe('death_prophet_possession_select', ({ entindex }) => {
  possessionSelectionRevision++;
  selectPossessionEntityWhenControllable(entindex, possessionSelectionRevision);
});

render(<HudMain />, $.GetContextPanel());
