"use strict";

/** 下拉框事件 */
function OnDropDownChanged(option) {
	let optionValue = $("#"+option).GetSelected().text;
	let optionId = $("#"+option).GetSelected().id;
	GameEvents.SendCustomGameEventToServer('game_options_change', { optionName: option, optionValue: optionValue, optionId: optionId })
}

/** 事件初期化 */
function GameEventsIniti(){
	OnDropDownChanged("player_gold_xp_multiplier_dropdown");
	OnDropDownChanged("bot_gold_xp_multiplier_dropdown");
	OnDropDownChanged("respawn_time_percentage_dropdown");
	OnDropDownChanged("max_level_dropdown");
	OnDropDownChanged("radiant_tower_power_dropdown");
	OnDropDownChanged("dire_tower_power_dropdown");
}

function CheckForHostPrivileges() {
	var player_info = Game.GetLocalPlayerInfo();
	if ( !player_info ) {
		return undefined;
	} else {
		return player_info.player_has_host_privileges;
	}
}

function JoinRadiant() {
	Game.PlayerJoinTeam(2);
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

$("#player_gold_xp_multiplier_dropdown").SetSelected("1");
$("#bot_gold_xp_multiplier_dropdown").SetSelected("5");
$("#radiant_player_number_dropdown").SetSelected("10");
$("#dire_player_number_dropdown").SetSelected("10");

$("#respawn_time_percentage_dropdown").SetSelected("100");
$("#max_level_dropdown").SetSelected("50");
$("#radiant_tower_power_dropdown").SetSelected("5");
$("#dire_tower_power_dropdown").SetSelected("5");
$("#radiant_tower_heal_dropdown").SetSelected("5");
$("#dire_tower_heal_dropdown").SetSelected("5");
$("#starting_gold_player_dropdown").SetSelected("2000");
$("#starting_gold_bot_dropdown").SetSelected("1000");
$("#same_hero_selection").checked=true;
$("#fast_courier").checked=true;
$("#radiant_bot_same_multi").checked=true;

// Test Code for Development
var isDevelopMode = false;
function RunDevelopSetting() {
	if ( !isDevelopMode ) {
		return;
	}
	$.Msg("====DEBUG====Test GameOptions");
	$("#radiant_player_number_dropdown").SetSelected("3");
	$("#dire_player_number_dropdown").SetSelected("3");
	$("#radiant_bot_same_multi").checked=false;
	$("#player_gold_xp_multiplier_dropdown").SetSelected("1");
	$("#bot_gold_xp_multiplier_dropdown").SetSelected("10");
}
RunDevelopSetting();
// Test Code for Development

function StateChange() {
	if ( Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP) ) {
		$("#display_options_container").style.visibility='visible';
		// join radiant team
		$.Schedule(1, JoinRadiant);
	} else if ( Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_HERO_SELECTION) ) {
		GameEvents.SendCustomGameEventToServer("loading_set_options",{
			"host_privilege": CheckForHostPrivileges(),
			"game_options":{
				"player_gold_xp_multiplier": $("#player_gold_xp_multiplier_dropdown").GetSelected().id,
				"bot_gold_xp_multiplier": $("#bot_gold_xp_multiplier_dropdown").GetSelected().id,
				"radiant_player_number": $("#radiant_player_number_dropdown").GetSelected().id,
				"dire_player_number": $("#dire_player_number_dropdown").GetSelected().id,
				"respawn_time_percentage": $("#respawn_time_percentage_dropdown").GetSelected().id,
				"radiant_tower_power": $("#radiant_tower_power_dropdown").GetSelected().id,
				"dire_tower_power": $("#dire_tower_power_dropdown").GetSelected().id,
				"radiant_tower_heal": $("#radiant_tower_heal_dropdown").GetSelected().id,
				"dire_tower_heal": $("#dire_tower_heal_dropdown").GetSelected().id,
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
	// $.Msg("++++++++++++++OnGameOptionsChange");
	$("#DisplayOptionsPlayerGoldXp").text = gameOptions.player_gold_xp_multiplier_dropdown;
	$("#DisplayOptionsBotGoldXp").text = gameOptions.bot_gold_xp_multiplier_dropdown;
	$("#DisplayOptionsRadiantTower").text = gameOptions.radiant_tower_power_dropdown;
	$("#DisplayOptionsDireTower").text = gameOptions.dire_tower_power_dropdown;
	$("#DisplayOptionsRespawnTime").text = gameOptions.respawn_time_percentage_dropdown;
	$("#DisplayOptionsMaxLevel").text = gameOptions.max_level_dropdown;

}

(function() {
	// 游戏选择项目table监听
	CustomNetTables.SubscribeNetTableListener("game_options_table", OnGameOptionsChange)
})();

GameEvents.Subscribe( "player_connect_full", InitializeUI);
GameEvents.Subscribe( "game_rules_state_change", StateChange);
