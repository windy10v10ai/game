"use strict";

/** 下拉框事件 */
function OnDifficultyDropDownChanged() {
	$.Msg("====OnDifficultyDropDownChanged====");
	let optionValue = $("#game_difficulty_dropdown").GetSelected().text;
	let optionId = $("#game_difficulty_dropdown").GetSelected().id;
	if (optionId == 0) {
		UnLockOption();
		InitSetting();
	} else {
		InitDifficultyCommonSetting();
		if (optionId == 1) {
			InitN1Setting();
		} else if (optionId == 2) {
			InitN2Setting();
		} else if (optionId == 3) {
			InitN3Setting();
		} else if (optionId == 4) {
			InitN4Setting();
		} else if (optionId == 5) {
			InitN5Setting();
		}
		LockOption();
	}
	GameEvents.SendCustomGameEventToServer('game_options_change', { optionName: "game_difficulty_dropdown", optionValue, optionId })
}
function OnDropDownChanged(option) {
	let optionValue = $("#"+option).GetSelected().text;
	let optionId = $("#"+option).GetSelected().id;
	GameEvents.SendCustomGameEventToServer('game_options_change', { optionName: option, optionValue, optionId })
}

/** 事件初期化 */
function GameEventsIniti(){
	OnDropDownChanged("player_gold_xp_multiplier_dropdown");
	OnDropDownChanged("bot_gold_xp_multiplier_dropdown");
	OnDropDownChanged("tower_power_dropdown");
	OnDropDownChanged("tower_endure_dropdown");
}

function CheckForHostPrivileges() {
	var player_info = Game.GetLocalPlayerInfo();
	if ( !player_info ) {
		return undefined;
	} else {
		return player_info.player_has_host_privileges;
	}
}

function InitializeUI(keys) {
	if (keys.PlayerID != Game.GetLocalPlayerID()) {return}
	var is_host = CheckForHostPrivileges();
	if (is_host === undefined) {
		$.Schedule(1, InitializeUI);
		return;
	} else if (is_host) {
		$("#game_options_container").style.visibility='visible';
		$("#ChatHideButtonHide").visible=true;
		GameEventsIniti();
	} else {
		$("#ChatHideButtonHide").visible=true;
	}
	// Hides battlecuck crap
	var hit_test_blocker = $.GetContextPanel().GetParent().FindChild("SidebarAndBattleCupLayoutContainer");
	if (hit_test_blocker) {
		hit_test_blocker.hittest = false;
		hit_test_blocker.hittestchildren = false;
	}
	var iScreenWidth = 	Game.GetScreenWidth()
	var iScreenHeight = Game.GetScreenHeight()
	if (iScreenWidth/iScreenHeight < (16/10+4/3)/2){
		$("#ChatHideButtonContainer").SetHasClass("ChatHideButtonContainerPos4_3", true);
	}
	else if ((iScreenWidth/iScreenHeight < (16/10+16/9)/2)){
		$("#ChatHideButtonContainer").SetHasClass("ChatHideButtonContainerPos16_10", true);
	}
	else {
		$("#ChatHideButtonContainer").SetHasClass("ChatHideButtonContainerPos16_9", true);
	}
}

function HideChatTeamActivate() {
	$.GetContextPanel().GetParent().GetParent().FindChildTraverse("LoadingScreenChat").visible=false;

	$("#ChatHideButtonHide").visible=false;
	$("#ChatHideButtonShow").visible=true;
	GameEvents.SendCustomGameEventToAllClients("LoadingScreenTeamHide", {iPlayerID:Players.GetLocalPlayer()});
}

function ShowChatTeamActivate() {
	$.GetContextPanel().GetParent().GetParent().FindChildTraverse("LoadingScreenChat").visible=true;
	$("#ChatHideButtonHide").visible=true;
	$("#ChatHideButtonShow").visible=false;
	GameEvents.SendCustomGameEventToAllClients("LoadingScreenTeamShow", {iPlayerID:Players.GetLocalPlayer()});
}

function InitSetting() {
	$("#player_gold_xp_multiplier_dropdown").SetSelected("1");
	$("#bot_gold_xp_multiplier_dropdown").SetSelected("5");
	$("#radiant_player_number_dropdown").SetSelected("10");
	$("#dire_player_number_dropdown").SetSelected("10");

	$("#respawn_time_percentage_dropdown").SetSelected("80");
	$("#max_level_dropdown").SetSelected("50");
	$("#tower_power_dropdown").SetSelected("9");
	$("#tower_endure_dropdown").SetSelected("9");
	$("#tower_heal_dropdown").SetSelected("10");

	$("#starting_gold_player_dropdown").SetSelected("3000");
	$("#starting_gold_bot_dropdown").SetSelected("1000");
	$("#same_hero_selection").checked=true;
	$("#fast_courier").checked=true;
	$("#radiant_bot_same_multi").checked=true;

	// 开发模式
	if (Game.IsInToolsMode()) {
		$("#player_gold_xp_multiplier_dropdown").SetSelected("2");
		$("#bot_gold_xp_multiplier_dropdown").SetSelected("2");
		$("#radiant_player_number_dropdown").SetSelected("1");
		$("#dire_player_number_dropdown").SetSelected("1");
		$("#starting_gold_bot_dropdown").SetSelected("3000");
		$("#tower_power_dropdown").SetSelected("5");
		$("#tower_endure_dropdown").SetSelected("5");
	}
}

// -------- Difficulty Setting --------

function LockOption() {
	$("#player_gold_xp_multiplier_dropdown").enabled=false;
	$("#bot_gold_xp_multiplier_dropdown").enabled=false;
	$("#radiant_player_number_dropdown").enabled=false;
	$("#dire_player_number_dropdown").enabled=false;

	$("#respawn_time_percentage_dropdown").enabled=false;
	$("#max_level_dropdown").enabled=false;
	$("#tower_power_dropdown").enabled=false;
	$("#tower_endure_dropdown").enabled=false;
	$("#tower_heal_dropdown").enabled=false;

	$("#starting_gold_player_dropdown").enabled=false;
	$("#starting_gold_bot_dropdown").enabled=false;
	$("#same_hero_selection").enabled=false;
	$("#fast_courier").enabled=false;
	$("#radiant_bot_same_multi").enabled=false;
}

function UnLockOption() {
	$("#player_gold_xp_multiplier_dropdown").enabled=true;
	$("#bot_gold_xp_multiplier_dropdown").enabled=true;
	$("#radiant_player_number_dropdown").enabled=true;
	$("#dire_player_number_dropdown").enabled=true;

	$("#respawn_time_percentage_dropdown").enabled=true;
	$("#max_level_dropdown").enabled=true;
	$("#tower_power_dropdown").enabled=true;
	$("#tower_endure_dropdown").enabled=true;
	$("#tower_heal_dropdown").enabled=true;

	$("#starting_gold_player_dropdown").enabled=true;
	$("#starting_gold_bot_dropdown").enabled=true;
	$("#same_hero_selection").enabled=true;
	$("#fast_courier").enabled=true;
	$("#radiant_bot_same_multi").enabled=true;
}

function InitDifficultyCommonSetting() {
	$("#radiant_player_number_dropdown").SetSelected("10");
	$("#dire_player_number_dropdown").SetSelected("10");

	$("#respawn_time_percentage_dropdown").SetSelected("80");
	$("#max_level_dropdown").SetSelected("50");
	$("#tower_heal_dropdown").SetSelected("10");

	$("#same_hero_selection").checked=false;
	$("#fast_courier").checked=true;
	$("#radiant_bot_same_multi").checked=true;
}

function InitN1Setting() {
	$("#player_gold_xp_multiplier_dropdown").SetSelected("1.5");
	$("#bot_gold_xp_multiplier_dropdown").SetSelected("5");

	$("#tower_power_dropdown").SetSelected("5");
	$("#tower_endure_dropdown").SetSelected("5");

	$("#starting_gold_player_dropdown").SetSelected("3000");
	$("#starting_gold_bot_dropdown").SetSelected("1000");
}
function InitN2Setting() {
	$("#player_gold_xp_multiplier_dropdown").SetSelected("1.5");
	$("#bot_gold_xp_multiplier_dropdown").SetSelected("8");

	$("#tower_power_dropdown").SetSelected("5");
	$("#tower_endure_dropdown").SetSelected("7");

	$("#starting_gold_player_dropdown").SetSelected("3000");
	$("#starting_gold_bot_dropdown").SetSelected("2000");
}
function InitN3Setting() {
	$("#player_gold_xp_multiplier_dropdown").SetSelected("1.5");
	$("#bot_gold_xp_multiplier_dropdown").SetSelected("10");

	$("#tower_power_dropdown").SetSelected("7");
	$("#tower_endure_dropdown").SetSelected("7");

	$("#starting_gold_player_dropdown").SetSelected("3000");
	$("#starting_gold_bot_dropdown").SetSelected("3000");
}
function InitN4Setting() {
	$("#player_gold_xp_multiplier_dropdown").SetSelected("1.5");
	$("#bot_gold_xp_multiplier_dropdown").SetSelected("15");

	$("#tower_power_dropdown").SetSelected("8");
	$("#tower_endure_dropdown").SetSelected("8");

	$("#starting_gold_player_dropdown").SetSelected("2000");
	$("#starting_gold_bot_dropdown").SetSelected("3000");
}
function InitN5Setting() {
	$("#player_gold_xp_multiplier_dropdown").SetSelected("1.5");
	$("#bot_gold_xp_multiplier_dropdown").SetSelected("20");

	$("#tower_power_dropdown").SetSelected("9");
	$("#tower_endure_dropdown").SetSelected("9");

	$("#starting_gold_player_dropdown").SetSelected("1000");
	$("#starting_gold_bot_dropdown").SetSelected("5000");
}
// -------- send to server --------
function StateChange() {
	if ( Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP) ) {
		$("#display_options_container").style.visibility='visible';
	} else if ( Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_HERO_SELECTION) ) {
		GameEvents.SendCustomGameEventToServer("loading_set_options",{
			"host_privilege": CheckForHostPrivileges(),
			"game_options":{
				"game_difficulty": $("#game_difficulty_dropdown").GetSelected().id,
				"player_gold_xp_multiplier": $("#player_gold_xp_multiplier_dropdown").GetSelected().id,
				"bot_gold_xp_multiplier": $("#bot_gold_xp_multiplier_dropdown").GetSelected().id,
				"radiant_player_number": $("#radiant_player_number_dropdown").GetSelected().id,
				"dire_player_number": $("#dire_player_number_dropdown").GetSelected().id,
				"respawn_time_percentage": $("#respawn_time_percentage_dropdown").GetSelected().id,
				"tower_power": $("#tower_power_dropdown").GetSelected().id,
				"tower_endure": $("#tower_endure_dropdown").GetSelected().id,
				"tower_heal": $("#tower_heal_dropdown").GetSelected().id,
				"starting_gold_player": $("#starting_gold_player_dropdown").GetSelected().id,
				"starting_gold_bot": $("#starting_gold_bot_dropdown").GetSelected().id,
				"max_level": $("#max_level_dropdown").GetSelected().id,
				"same_hero_selection": $("#same_hero_selection").checked,
				"fast_courier": $("#fast_courier").checked,
				"radiant_bot_same_multi": $("#radiant_bot_same_multi").checked
			}
		});
	}
}


/**
 * 非主机玩家显示游戏选项内容设定
 */
function OnGameOptionsChange() {
	var gameOptions = CustomNetTables.GetTableValue('game_options_table', 'game_option');

	$("#DisplayOptionsPlayerGoldXp").text = gameOptions.player_gold_xp_multiplier_dropdown.optionValue;
	$("#DisplayOptionsBotGoldXp").text = gameOptions.bot_gold_xp_multiplier_dropdown.optionValue;
	$("#DisplayOptionsTowerPower").text = gameOptions.tower_power_dropdown.optionValue;
	$("#DisplayOptionsTowerEndure").text = gameOptions.tower_endure_dropdown.optionValue;

	let iDifficulty = 0;
	if(gameOptions.game_difficulty_dropdown) {
		iDifficulty = gameOptions.game_difficulty_dropdown.optionId;
	}
	$("#DisplayGameDifficulty").text = $.Localize('#game_difficulty_n' + iDifficulty);

	$.Msg("====OnGameOptionsChange====");
	$.Msg("iDifficulty: " + iDifficulty);
	let seasonPointMulti = "1.0";
	switch (+iDifficulty) {
		case 1:
			seasonPointMulti = "1.5";
			break;
		case 2:
			seasonPointMulti = "2.0";
			break;
		case 3:
			seasonPointMulti = "2.5";
			break;
		case 4:
			seasonPointMulti = "3.0";
			break;
		case 5:
			seasonPointMulti = "4.0";
			break;
		default:
			seasonPointMulti = "1.0";
			break;
	}
	$("#DisplaySeasonPointMulti").text = "x"+ seasonPointMulti;
}


(function() {
	// 游戏选择项目table监听
	CustomNetTables.SubscribeNetTableListener("game_options_table", OnGameOptionsChange)
	InitSetting();
	$.Msg("====function====");
	OnDifficultyDropDownChanged();
})();

GameEvents.Subscribe( "player_connect_full", InitializeUI);
GameEvents.Subscribe( "game_rules_state_change", StateChange);
