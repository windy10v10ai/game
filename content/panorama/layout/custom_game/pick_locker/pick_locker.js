const lockHeroNames = ['dark_seer'];

const interval = 0.03;

const random_button = FindDotaHudElement('RandomButton');
let random_pressed = false;
let member = GetMember();
let player = GetPlayer();

(() => {
  PickLockerLoop();

  // 监听游戏选项变化
  CustomNetTables.SubscribeNetTableListener('game_options', (table, key, _value) => {
    if (key === 'game_options') {
      // 选项变化时重新检查
      PickLocker();
    }
  });
})();

function PickLockerLoop() {
  if (Game.GameStateIsBefore(DOTA_GameState.DOTA_GAMERULES_STATE_PRE_GAME)) {
    $.Schedule(interval, PickLocker);
  }
}

function PickRandomHero() {
  $.Msg('Random hero pressed');
  // discard random requests if we've already pressed that or have hero selected
  if (random_pressed || Players.GetSelectedHeroID(Players.GetLocalPlayer()) != -1) return;
  random_pressed = true;
  // GameEvents.SendCustomGameEventToServer("pick_random_hero", {});
}

function PickLocker() {
  // 检查是否启用强制随机模式
  const gameOptions = CustomNetTables.GetTableValue('game_options', 'game_options');
  if (gameOptions && gameOptions.same_hero_selection === 1) {
    // 强制随机模式:锁定所有选择按钮
    lockForceRandomMode();
    PickLockerLoop();
    return;
  }

  // 原有的逻辑
  const possible_hero_selection = Game.GetLocalPlayerInfo().possible_hero_selection;
  if (lockHeroNames.includes(possible_hero_selection)) {
    if (isSeasonLevelBiggerThan(15)) {
      unlockHero();
    } else {
      lockSeasonLevelHero();
    }
  } else {
    unlockHero();
  }

  PickLockerLoop();
}

function lockForceRandomMode() {
  $.Msg('Force Random Mode: Lock all hero picks');
  const pick_button = FindDotaHudElement('LockInButton');
  pick_button.enabled = false;
  pick_button.SetAcceptsFocus(false);
  pick_button.BAcceptsInput(false);
  pick_button.style.saturation = 0.0;
  pick_button.style.brightness = 0.2;

  const label = pick_button.GetChild(0);
  label.text = $.Localize('#DOTA_Hero_Selection_RANDOM_MODE');
  label.style.fontSize = 16;

  // 同时禁用随机按钮
  const random_button = FindDotaHudElement('RandomButton');
  if (random_button) {
    random_button.enabled = false;
    random_button.SetAcceptsFocus(false);
    random_button.BAcceptsInput(false);
  }
}

function unlockHero() {
  $.Msg('Unlock hero Pick');
  const pick_button = FindDotaHudElement('LockInButton');
  pick_button.enabled = true;
  pick_button.SetAcceptsFocus(true);
  pick_button.BAcceptsInput(true);
  pick_button.style.saturation = null;
  pick_button.style.brightness = null;

  const label = pick_button.GetChild(0);
  label.text = $.Localize('#DOTA_Hero_Selection_LOCKIN');
  label.style.fontSize = 20;
}

function lockSeasonLevelHero() {
  const pick_button = FindDotaHudElement('LockInButton');
  pick_button.enabled = false;
  pick_button.SetAcceptsFocus(false);
  pick_button.BAcceptsInput(false);
  pick_button.style.saturation = 0.0;
  pick_button.style.brightness = 0.2;

  const label = pick_button.GetChild(0);
  label.text = 'Locked';
  label.style.fontSize = 16;
}

function isSeasonLevelBiggerThan(level) {
  if (!player) {
    player = GetPlayer();
  }
  if (player && player.seasonLevel >= level) {
    return true;
  } else {
    return false;
  }
}
