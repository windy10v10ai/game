'use strict';

// custom 图整套 KV 预设回填状态（字段名为后端契约的 camelCase）
var g_customPresetLoaded = false; // 预设是否已加载（只加载一次）
var g_loadedCustomOptions; // 服务端已保存的 custom KV

var CUSTOM_PRESET_DROPDOWNS = [
  ['multiplierRadiant', 'player_gold_xp_multiplier_dropdown'],
  ['multiplierDire', 'bot_gold_xp_multiplier_dropdown'],
  ['playerNumberRadiant', 'radiant_player_number_dropdown'],
  ['playerNumberDire', 'dire_player_number_dropdown'],
  ['towerPowerPct', 'tower_power_dropdown'],
  ['respawnTimePct', 'respawn_time_percentage_dropdown'],
  ['startingGoldPlayer', 'starting_gold_player_dropdown'],
  ['startingGoldBot', 'starting_gold_bot_dropdown'],
  ['maxLevel', 'max_level_dropdown'],
  ['fixedAbility', 'fixed_ability_dropdown'],
];
var CUSTOM_PRESET_TOGGLES = [
  ['forceRandomHero', 'force_random_hero'],
  ['enablePlayerAttribute', 'enable_player_attribute'],
  ['midOnlyMode', 'mid_only_mode'],
];

function CheckForHostPrivileges() {
  var player_info = Game.GetLocalPlayerInfo();
  if (!player_info) {
    return undefined;
  } else {
    return player_info.player_has_host_privileges;
  }
}

function NormalizePresetValue(value) {
  if (typeof value === 'number') {
    var rounded = Math.round((value + Number.EPSILON) * 10) / 10;
    return rounded === Math.floor(rounded) ? String(Math.floor(rounded)) : String(rounded);
  }
  return String(value);
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
  $('#mid_only_mode').checked = false;
  $('#player_gold_xp_multiplier_dropdown').SetSelected('1.5');
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('10');
  $('#radiant_player_number_dropdown').SetSelected('1');
  $('#dire_player_number_dropdown').SetSelected('10');

  $('#respawn_time_percentage_dropdown').SetSelected('50');
  $('#max_level_dropdown').SetSelected('200');
  $('#tower_power_dropdown').SetSelected('300');

  $('#starting_gold_player_dropdown').SetSelected('5000');
  $('#starting_gold_bot_dropdown').SetSelected('3000');
  $('#fixed_ability_dropdown').SetSelected('none');

  // 开发模式
  if (Game.IsInToolsMode()) {
    $('#player_gold_xp_multiplier_dropdown').SetSelected('2');
    $('#bot_gold_xp_multiplier_dropdown').SetSelected('2');
    $('#radiant_player_number_dropdown').SetSelected('5');
    $('#dire_player_number_dropdown').SetSelected('5');
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
  $('#mid_only_mode').enabled = false;
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
  $('#mid_only_mode').enabled = true;
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
  $('#mid_only_mode').checked = false;
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
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('9');

  $('#tower_power_dropdown').SetSelected('350');

  $('#starting_gold_player_dropdown').SetSelected('3000');
  $('#starting_gold_bot_dropdown').SetSelected('5000');
}
function InitN7Setting() {
  $('#player_gold_xp_multiplier_dropdown').SetSelected('1.5');
  $('#bot_gold_xp_multiplier_dropdown').SetSelected('11');

  $('#tower_power_dropdown').SetSelected('400');

  $('#starting_gold_player_dropdown').SetSelected('3000');
  $('#starting_gold_bot_dropdown').SetSelected('5000');
}
// -------- send to server --------
function StateChange() {
  if (Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP)) {
    // 游戏选项显示（全体玩家）
    $('#display_options_container').style.visibility = 'visible';
  } else if (Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_HERO_SELECTION)) {
    // 统计玩家语言
    SendPlayerLanguage();
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
  const midOnlyMode = $('#mid_only_mode').checked;

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
    mid_only_mode: midOnlyMode,
  });
}

// -------- custom 预设 加载/回填（保存由服务端在 PRE_GAME 统一处理） --------

function OnGamePresetChange(_table, key, value) {
  if (key !== String(Game.GetLocalPlayerID())) {
    return;
  }
  LoadCustomPreset(value);
}

function LoadCustomPreset(value) {
  if (g_customPresetLoaded) {
    return;
  }
  if (!value || !value.custom || !value.custom.gameOptions) {
    return;
  }
  // custom 整套 KV 只有房主能改，非房主不回填
  if (!CheckForHostPrivileges()) {
    return;
  }
  if (Game.GetMapInfo().map_display_name !== 'custom') {
    return;
  }
  g_customPresetLoaded = true;
  g_loadedCustomOptions = value.custom.gameOptions;
  // 难度已定为 0（custom 已解锁）则立即应用覆盖默认值；否则等 OnDifficultyDropDownChanged(0)
  if ($('#player_gold_xp_multiplier_dropdown').enabled) {
    ApplyCustomPresetToDropdowns(g_loadedCustomOptions);
  }
}

function ApplyCustomPresetToDropdowns(options) {
  if (!options) {
    return;
  }
  CUSTOM_PRESET_DROPDOWNS.forEach(function (pair) {
    const field = pair[0];
    const value = options[field];
    if (value === undefined || value === null) {
      return; // failover：缺字段跳过
    }
    const dd = $('#' + pair[1]);
    if (!dd) {
      return;
    }
    const optionId = NormalizePresetValue(value);
    if (dd.HasOption && !dd.HasOption(optionId)) {
      return; // failover：选项在画面中不存在跳过
    }
    dd.SetSelected(optionId);
  });
  CUSTOM_PRESET_TOGGLES.forEach(function (pair) {
    const field = pair[0];
    const value = options[field];
    if (value === undefined || value === null) {
      return;
    }
    const tb = $('#' + pair[1]);
    if (tb) {
      tb.checked = !!value;
    }
  });
  // 程序回填不会触发 onactivate/oninputsubmit，必须主动补发一次，
  // 否则只能等到 HERO_SELECTION 兜底发送，那时 force_random_hero 已经来不及生效。
  SendGameOptionsToServer();
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
    // custom 解锁并填完默认值后，用已保存预设覆盖
    if (g_loadedCustomOptions) {
      ApplyCustomPresetToDropdowns(g_loadedCustomOptions);
    }
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
    } else if (optionId === 7) {
      InitN7Setting();
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
  const chanceSurvivor = 0.5;
  const chanceOMGAI = 1;
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
    $.DispatchEvent('ExternalBrowserGoToURL', 'https://qm.qq.com/q/BPUhaLiec2');
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
  // 已保存 custom 预设：开局后由服务端写入 game_preset
  CustomNetTables.SubscribeNetTableListener('game_preset', OnGamePresetChange);
  LoadCustomPreset(CustomNetTables.GetTableValue('game_preset', String(Game.GetLocalPlayerID())));
  // 链接按钮
  DispatchLinkPanel();
  DispatchQQ();
  DispatchDiscord();
})();

GameEvents.Subscribe('player_connect_full', InitializeUI);
GameEvents.Subscribe('game_rules_state_change', StateChange);
