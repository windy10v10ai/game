'use strict';

function CheckForHostPrivileges() {
  var player_info = Game.GetLocalPlayerInfo();
  if (!player_info) {
    return undefined;
  } else {
    return player_info.player_has_host_privileges;
  }
}

function InitializeUI(keys) {
  if (keys.PlayerID !== Game.GetLocalPlayerID()) {
    return;
  }
  var is_host = CheckForHostPrivileges();
  if (is_host === undefined) {
    $.Schedule(1, InitializeUI);
    return;
  } else if (is_host) {
    $('#game_options_container').style.visibility = 'visible';
    $('#ChatHideButtonHide').visible = true;
  } else {
    $('#ChatHideButtonHide').visible = true;
  }

  var hit_test_blocker = $.GetContextPanel()
    .GetParent()
    .FindChild('SidebarAndBattleCupLayoutContainer');
  if (hit_test_blocker) {
    hit_test_blocker.hittest = false;
    hit_test_blocker.hittestchildren = false;
  }
  var iScreenWidth = Game.GetScreenWidth();
  var iScreenHeight = Game.GetScreenHeight();
  if (iScreenWidth / iScreenHeight < (16 / 10 + 4 / 3) / 2) {
    $('#ChatHideButtonContainer').SetHasClass('ChatHideButtonContainerPos4_3', true);
  } else if (iScreenWidth / iScreenHeight < (16 / 10 + 16 / 9) / 2) {
    $('#ChatHideButtonContainer').SetHasClass('ChatHideButtonContainerPos16_10', true);
  } else {
    $('#ChatHideButtonContainer').SetHasClass('ChatHideButtonContainerPos16_9', true);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HideChatTeamActivate() {
  $.GetContextPanel().GetParent().GetParent().FindChildTraverse('LoadingScreenChat').visible =
    false;

  $('#ChatHideButtonHide').visible = false;
  $('#ChatHideButtonShow').visible = true;
  GameEvents.SendCustomGameEventToAllClients('LoadingScreenTeamHide', {
    iPlayerID: Players.GetLocalPlayer(),
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ShowChatTeamActivate() {
  $.GetContextPanel().GetParent().GetParent().FindChildTraverse('LoadingScreenChat').visible = true;
  $('#ChatHideButtonHide').visible = true;
  $('#ChatHideButtonShow').visible = false;
  GameEvents.SendCustomGameEventToAllClients('LoadingScreenTeamShow', {
    iPlayerID: Players.GetLocalPlayer(),
  });
}

// -------- Game Setting --------

function InitCustomSetting() {
  $('#force_random_hero').checked = false; // 默认不强制随机
  $('#enable_player_attribute').checked = true;
  $('#player_gold_xp_multiplier_dropdown').SetSelected('1.5');
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('10');
  $('#radiant_player_number_dropdown').SetSelected('1');
  $('#dire_player_number_dropdown').SetSelected('10');

  $('#respawn_time_percentage_dropdown').SetSelected('50');
  $('#max_level_dropdown').SetSelected('200');
  $('#tower_power_dropdown').SetSelected('400');

  $('#starting_gold_player_dropdown').SetSelected('5000');
  $('#starting_gold_bot_dropdown').SetSelected('3000');
  $('#fixed_ability_dropdown').SetSelected('none');

  // 开发模式
  if (Game.IsInToolsMode()) {
    $('#player_gold_xp_multiplier_dropdown').SetSelected('5');
    $('#bot_gold_xp_multiplier_dropdown').SetSelected('10');
    $('#radiant_player_number_dropdown').SetSelected('3');
    $('#dire_player_number_dropdown').SetSelected('3');
    $('#starting_gold_bot_dropdown').SetSelected('5000');
  }
}

// -------- Difficulty Setting --------

function LockOption() {
  $('#player_gold_xp_multiplier_dropdown').enabled = false;
  $('#bot_gold_xp_multiplier_dropdown').enabled = false;
  $('#radiant_player_number_dropdown').enabled = false;
  $('#dire_player_number_dropdown').enabled = false;

  $('#respawn_time_percentage_dropdown').enabled = false;
  $('#max_level_dropdown').enabled = false;
  $('#tower_power_dropdown').enabled = false;

  $('#starting_gold_player_dropdown').enabled = false;
  $('#starting_gold_bot_dropdown').enabled = false;
  $('#fixed_ability_dropdown').enabled = false;
  $('#force_random_hero').enabled = false;
  $('#enable_player_attribute').enabled = false;
}

function UnLockOptionAll() {
  $('#player_gold_xp_multiplier_dropdown').enabled = true;
  $('#bot_gold_xp_multiplier_dropdown').enabled = true;
  $('#radiant_player_number_dropdown').enabled = true;
  $('#dire_player_number_dropdown').enabled = true;

  $('#respawn_time_percentage_dropdown').enabled = true;
  $('#max_level_dropdown').enabled = true;
  $('#tower_power_dropdown').enabled = true;

  $('#starting_gold_player_dropdown').enabled = true;
  $('#starting_gold_bot_dropdown').enabled = true;
  $('#fixed_ability_dropdown').enabled = true;
  $('#force_random_hero').enabled = true;
  $('#enable_player_attribute').enabled = true;
}

// N1-N6 通用设置
function InitDifficultyCommonSetting() {
  $('#radiant_player_number_dropdown').SetSelected('1');
  $('#dire_player_number_dropdown').SetSelected('10');

  $('#respawn_time_percentage_dropdown').SetSelected('100');
  $('#max_level_dropdown').SetSelected('50');

  $('#fixed_ability_dropdown').SetSelected('none');
  $('#force_random_hero').checked = false;
  $('#enable_player_attribute').checked = true;
}

function InitN1Setting() {
  $('#player_gold_xp_multiplier_dropdown').SetSelected('1.5');
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('2');

  $('#tower_power_dropdown').SetSelected('100');

  $('#starting_gold_player_dropdown').SetSelected('5000');
  $('#starting_gold_bot_dropdown').SetSelected('1000');
}
function InitN2Setting() {
  $('#player_gold_xp_multiplier_dropdown').SetSelected('1.5');
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('3');

  $('#tower_power_dropdown').SetSelected('150');

  $('#starting_gold_player_dropdown').SetSelected('3000');
  $('#starting_gold_bot_dropdown').SetSelected('1000');
}
function InitN3Setting() {
  $('#player_gold_xp_multiplier_dropdown').SetSelected('1.5');
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('4');

  $('#tower_power_dropdown').SetSelected('200');

  $('#starting_gold_player_dropdown').SetSelected('3000');
  $('#starting_gold_bot_dropdown').SetSelected('3000');
}
function InitN4Setting() {
  $('#player_gold_xp_multiplier_dropdown').SetSelected('1.5');
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('5');

  $('#tower_power_dropdown').SetSelected('250');

  $('#starting_gold_player_dropdown').SetSelected('3000');
  $('#starting_gold_bot_dropdown').SetSelected('3000');
}
function InitN5Setting() {
  $('#player_gold_xp_multiplier_dropdown').SetSelected('1.5');
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('7');

  $('#tower_power_dropdown').SetSelected('300');

  $('#starting_gold_player_dropdown').SetSelected('3000');
  $('#starting_gold_bot_dropdown').SetSelected('3000');
}
function InitN6Setting() {
  $('#player_gold_xp_multiplier_dropdown').SetSelected('1.5');
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('10');

  $('#tower_power_dropdown').SetSelected('400');

  $('#starting_gold_player_dropdown').SetSelected('3000');
  $('#starting_gold_bot_dropdown').SetSelected('5000');
}
// -------- send to server --------
function StateChange() {
  if (Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP)) {
    // 游戏选项显示（全体玩家）
    $('#display_options_container').style.visibility = 'visible';
    // 统计玩家语言
    SendPlayerLanguage();
  } else if (Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_HERO_SELECTION)) {
    GameEvents.SendCustomGameEventToServer('loading_set_options', {
      host_privilege: CheckForHostPrivileges(),
      game_options: {
        player_gold_xp_multiplier: $('#player_gold_xp_multiplier_dropdown').GetSelected().id,
        bot_gold_xp_multiplier: $('#bot_gold_xp_multiplier_dropdown').GetSelected().id,
        radiant_player_number: $('#radiant_player_number_dropdown').GetSelected().id,
        dire_player_number: $('#dire_player_number_dropdown').GetSelected().id,
        respawn_time_percentage: $('#respawn_time_percentage_dropdown').GetSelected().id,
        tower_power: $('#tower_power_dropdown').GetSelected().id,
        starting_gold_player: $('#starting_gold_player_dropdown').GetSelected().id,
        starting_gold_bot: $('#starting_gold_bot_dropdown').GetSelected().id,
        max_level: $('#max_level_dropdown').GetSelected().id,
        fixed_ability: $('#fixed_ability_dropdown').GetSelected().id,
        force_random_hero: $('#force_random_hero').checked,
        enable_player_attribute: $('#enable_player_attribute').checked,
      },
    });
    SendGameOptionsToServer();
  }
}

function SendGameOptionsToServer() {
  if (!CheckForHostPrivileges()) {
    return;
  }

  const playerGoldXpMultiplier = $('#player_gold_xp_multiplier_dropdown').GetSelected().id;
  const botGoldXpMultiplier = $('#bot_gold_xp_multiplier_dropdown').GetSelected().id;
  const radiantPlayerNumber = $('#radiant_player_number_dropdown').GetSelected().id;
  const direPlayerNumber = $('#dire_player_number_dropdown').GetSelected().id;
  const towerPower = $('#tower_power_dropdown').GetSelected().id;
  const respawnTimePercentage = $('#respawn_time_percentage_dropdown').GetSelected().id;
  const startingGoldPlayer = $('#starting_gold_player_dropdown').GetSelected().id;
  const startingGoldBot = $('#starting_gold_bot_dropdown').GetSelected().id;
  const maxLevel = $('#max_level_dropdown').GetSelected().id;
  const fixedAbility = $('#fixed_ability_dropdown').GetSelected().id;
  const forceRandomHero = $('#force_random_hero').checked;
  const enablePlayerAttribute = $('#enable_player_attribute').checked;

  GameEvents.SendCustomGameEventToServer('game_options_change', {
    multiplier_radiant: Number(playerGoldXpMultiplier),
    multiplier_dire: Number(botGoldXpMultiplier),
    player_number_radiant: Number(radiantPlayerNumber),
    player_number_dire: Number(direPlayerNumber),
    tower_power_pct: Number(towerPower),
    respawn_time_pct: Number(respawnTimePercentage),
    starting_gold_player: Number(startingGoldPlayer),
    starting_gold_bot: Number(startingGoldBot),
    max_level: Number(maxLevel),
    fixed_ability: fixedAbility,
    force_random_hero: forceRandomHero,
    enable_player_attribute: enablePlayerAttribute,
  });
}

/**
 * 非主机玩家显示游戏选项内容设定
 */
function ShowGameOptionsChange(_table, key, value) {
  if (!value) {
    return;
  }

  if (key === 'game_options') {
    $('#DisplayOptionsPlayerGoldXp').text = value.multiplier_radiant
      .toFixed(1)
      .replace(/\.0+$/, '');
    $('#DisplayOptionsBotGoldXp').text = value.multiplier_dire.toFixed(1).replace(/\.0+$/, '');
    $('#DisplayOptionsTowerPower').text = `${value.tower_power_pct}%`;
  } else if (key === 'point_multiplier') {
    $('#DisplaySeasonPointMulti').text =
      'x' + value.point_multiplier.toFixed(1).replace(/\.0+$/, '');
  }
}

function OnDifficultyDropDownChanged(difficulty) {
  $('#DisplayGameDifficulty').text = $.Localize('#game_difficulty_n' + difficulty);
  const optionId = difficulty;
  if (optionId === 0) {
    UnLockOptionAll();
    InitCustomSetting();
  } else {
    InitDifficultyCommonSetting();
    if (optionId === 1) {
      InitN1Setting();
    } else if (optionId === 2) {
      InitN2Setting();
    } else if (optionId === 3) {
      InitN3Setting();
    } else if (optionId === 4) {
      InitN4Setting();
    } else if (optionId === 5) {
      InitN5Setting();
    } else if (optionId === 6) {
      InitN6Setting();
    }
    LockOption();
  }
}

function OnGameDifficultyChoiceChange(table, key, value) {
  $.Msg('OnGameDifficultyChoiceChange', key, value);
  if (!value) {
    return;
  }
  const difficulty = value.difficulty;
  if (key !== 'all') {
    return;
  }
  OnDifficultyDropDownChanged(difficulty);
}

// -------- 链接按钮 --------
function DispatchLinkPanel() {
  const random = Math.random();
  const chanceSurvivor = 0.2;
  const chanceOMGAI = 0.4;
  if (random < chanceSurvivor) {
    $('#DotaSurvivorPanel').visible = true;
    $('#OMGAIPanel').visible = false;
    $('#TenvTenRemakePanel').visible = false;
    DispatchDotaSurvivor();
  } else if (random < chanceOMGAI) {
    $('#DotaSurvivorPanel').visible = false;
    $('#OMGAIPanel').visible = true;
    $('#TenvTenRemakePanel').visible = false;
    DispatchOMGAI();
  } else {
    $('#DotaSurvivorPanel').visible = false;
    $('#OMGAIPanel').visible = false;
    $('#TenvTenRemakePanel').visible = true;
    DispatchTenvTenRemake();
  }
}

function DispatchDotaSurvivor() {
  const button = $('#DotaSurvivorButton');
  button.SetPanelEvent('onactivate', () => {
    $.DispatchEvent('DOTAShowCustomGamePage', 3359951052);
  });
}

function DispatchOMGAI() {
  const button = $('#OMGAIButton');
  button.SetPanelEvent('onactivate', () => {
    $.DispatchEvent('DOTAShowCustomGamePage', 2841790376);
  });
}

function DispatchTenvTenRemake() {
  const button = $('#TenvTenRemakeButton');
  button.SetPanelEvent('onactivate', () => {
    $.DispatchEvent('DOTAShowCustomGamePage', 3564393242);
  });
}

function DispatchQQ() {
  const button = $('#QQPanel');
  button.SetPanelEvent('onactivate', () => {
    $.DispatchEvent(
      'ExternalBrowserGoToURL',
      'https://qm.qq.com/cgi-bin/qm/qr?k=6yNcbJ0GOuPECq1dmIvsmdj8y7dZBiHs',
    );
  });
  button.SetPanelEvent('onmouseover', () => {
    $.DispatchEvent('DOTAShowTextTooltip', button, $.Localize('#join_qq'));
  });
  button.SetPanelEvent('onmouseout', () => {
    $.DispatchEvent('DOTAHideTextTooltip');
  });
}
function DispatchDiscord() {
  const button = $('#DiscordPanel');
  button.SetPanelEvent('onactivate', () => {
    $.DispatchEvent('ExternalBrowserGoToURL', 'https://discord.gg/PhXyPfCQg5');
  });
  button.SetPanelEvent('onmouseover', () => {
    $.DispatchEvent('DOTAShowTextTooltip', button, $.Localize('#join_discord'));
  });
  button.SetPanelEvent('onmouseout', () => {
    $.DispatchEvent('DOTAHideTextTooltip');
  });
}

function SendPlayerLanguage() {
  const language = $.Language();
  GameEvents.SendCustomGameEventToServer('player_language', { language });
}

(function () {
  if (Game.GameStateIsAfter(DOTA_GameState.DOTA_GAMERULES_STATE_HERO_SELECTION)) {
    // 选择英雄界面不再执行
    return;
  }
  LockOption();
  // 游戏选择项目table监听
  CustomNetTables.SubscribeNetTableListener('game_options', ShowGameOptionsChange);
  CustomNetTables.SubscribeNetTableListener('game_difficulty', OnGameDifficultyChoiceChange);
  // 初始化游戏难度
  CustomNetTables.GetTableValue('game_options', 'game_options', ShowGameOptionsChange);
  CustomNetTables.GetTableValue('game_difficulty', 'all', OnGameDifficultyChoiceChange);
  // 链接按钮
  DispatchLinkPanel();
  DispatchQQ();
  DispatchDiscord();
})();

GameEvents.Subscribe('player_connect_full', InitializeUI);
GameEvents.Subscribe('game_rules_state_change', StateChange);
