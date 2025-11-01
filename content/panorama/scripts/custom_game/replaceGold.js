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
    CustomNetTables.GetTableValue('player_virtual_gold', Game.GetLocalPlayerID().toString())
      ?.virtual_gold ?? 0;
  const currentGold = Players.GetGold(Game.GetLocalPlayerID());
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
