function LoopSwapInGameGold() {
  if (!Game.GameStateIsBefore(DOTA_GameState.DOTA_GAMERULES_STATE_PRE_GAME)) {
    SwapInGameGold();
  }
  $.Schedule(0.1, LoopSwapInGameGold);
}

var topmostpanel;
var goldLabel;

function SwapInGameGold() {
  SwapGoldLabelText();
}

function SwapGoldLabelText() {
  const player_info = Game.GetLocalPlayerInfo();
  // 观战时没有玩家信息，不执行
  if (!player_info) return;
  const localPlayerID = player_info.player_id;

  if (!topmostpanel) {
    topmostpanel = $.GetContextPanel();
    while (topmostpanel.GetParent() != null) {
      topmostpanel = topmostpanel.GetParent();
    }
  }

  if (!goldLabel) {
    goldLabel = topmostpanel.FindChildTraverse('ShopButton').FindChildTraverse('GoldLabel');
  }

  const virtualGold =
    CustomNetTables.GetTableValue('player_virtual_gold', localPlayerID.toString())?.virtual_gold ??
    0;
  const currentGold = Players.GetGold(localPlayerID);
  if (goldLabel) {
    goldLabel.text = currentGold + virtualGold;
  }
}

(function () {
  GameEvents.Subscribe('game_rules_state_change', function () {
    if (Game.GameStateIsBefore(DOTA_GameState.DOTA_GAMERULES_STATE_PRE_GAME)) return;
    SwapInGameGold();
  });

  LoopSwapInGameGold();
})();
