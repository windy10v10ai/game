/**
    DISCLAIMER:
    This file is heavily inspired and based on the open sourced code from Angel Arena Black Star, respecting their Apache-2.0 License.
    Thanks to Angel Arena Black Star.
 */


var imagefile = {
	'npc_dota_hero_meepo': 'file://{images}/heroes/npc_dota_hero_meepo_custom.png',
	'npc_dota_hero_juggernaut': 'file://{images}/heroes/npc_dota_hero_juggernaut_custom.png',
	'npc_dota_hero_techies': 'file://{images}/heroes/npc_dota_hero_techies_custom.png',
	'npc_dota_hero_broodmother': 'file://{images}/heroes/npc_dota_hero_broodmother_custom.png',
	'npc_dota_hero_visage': 'file://{images}/heroes/npc_dota_hero_visage_custom.png',
	'npc_dota_hero_chen': 'file://{images}/heroes/npc_dota_hero_chen_custom.png',
	'npc_dota_hero_pangolier': 'file://{images}/heroes/npc_dota_hero_pangolier_custom.png',
}

var GAME_RESULT = {};
var _ = GameUI.CustomUIConfig()._;


function FinishGame() {
	Game.FinishGame();
}

/**
 * Creates Panel snippet and sets all player-releated information
 *
 * @param {Number} playerId Player ID
 * @param {Panel} rootPanel Panel that will be parent for that player
 */
function Snippet_Player(playerId, rootPanel, index) {
	var panel = $.CreatePanel("Panel", rootPanel, "");
	panel.BLoadLayoutSnippet("Player");
    panel.SetHasClass("IsLocalPlayer", playerId === Game.GetLocalPlayerID());

	var playerData = GAME_RESULT.players[playerId];
	var playerInfo = Game.GetPlayerInfo(playerId);
	if (playerInfo.player_steamid && playerInfo.player_steamid !== "0") {
		panel.FindChildTraverse("PlayerAvatar").steamid = playerInfo.player_steamid;
		panel.FindChildTraverse("PlayerNameScoreboard").steamid = playerInfo.player_steamid;
	} else {
		panel.FindChildTraverse("PlayerAvatar").steamid = playerInfo.player_steamid;
		panel.FindChildTraverse("PlayerNameScoreboard").visible = false;
		panel.FindChildTraverse("BotNameScoreboard").visible = true;
	}

	if (playerData.membership) {
		panel.AddClass("IsMemberShip");
		let membershipString = $.Localize('#player_member_ship');
		let membershipUrl = $.Localize('#player_member_ship_url');

		let membershipIcon = panel.FindChildTraverse("PlayerMemberShip");

        membershipIcon.SetPanelEvent('onmouseover',() => {
            $.DispatchEvent("DOTAShowTextTooltip", membershipIcon, membershipString);
        })
        membershipIcon.SetPanelEvent('onmouseout',() => {
            $.DispatchEvent("DOTAHideTextTooltip");
        })

        membershipIcon.SetPanelEvent('onactivate',() => {
            $.DispatchEvent('ExternalBrowserGoToURL', membershipUrl)
        })
	}

	panel.index = index; // For backwards compatibility
	panel.style.animationDelay = index * 0.3 + "s";
	$.Schedule(index * 0.3, function() {
		try {
			panel.AddClass("AnimationEnd");
		} catch(e) {};
	});

	if (imagefile[playerData.heroName]) {
		panel.FindChildTraverse("HeroIcon").SetImage(imagefile[playerData.heroName]);
	} else {
		panel.FindChildTraverse("HeroIcon").SetImage('file://{images}/heroes/' + playerData.heroName + '.png');
	}
	panel.SetDialogVariableInt("hero_level", Players.GetLevel(playerId));
	panel.SetDialogVariable("hero_name", $.Localize('#' + playerData.heroName));

	panel.SetDialogVariableInt("kills", Players.GetKills(playerId));
	panel.SetDialogVariableInt("deaths", Players.GetDeaths(playerId));
	panel.SetDialogVariableInt("assists", Players.GetAssists(playerId));
	panel.SetDialogVariableInt("lasthits", Players.GetLastHits(playerId));
	panel.SetDialogVariableInt("money", Players.GetTotalEarnedGold(playerId));
	panel.SetDialogVariableInt("damage", playerData.damage);
	panel.SetDialogVariableInt("damagereceived", playerData.damagereceived);
	panel.SetDialogVariable("heroHealing", playerData.heroHealing);

	panel.SetDialogVariableInt("strength", playerData.str);
	panel.SetDialogVariableInt("agility", playerData.agi);
	panel.SetDialogVariableInt("intellect", playerData.int);

	for (var i = 0; i < 6; i++) {
		var item = playerData.items[i];
		var itemPanel = $.CreatePanel("DOTAItemImage", panel.FindChildTraverse(i >= 6 ? "BackpackItemsContainer" : "ItemsContainer"), "");
		if (item) {
			itemPanel.itemname = item;
		}
	}

	var neutral = playerData.items[16];
	var itemPanel = $.CreatePanel("DOTAItemImage", panel.FindChildTraverse("NeutralItemContainer"), "");
	if (neutral) {
		itemPanel.itemname = neutral;
	}
}



/**
 * Creates Team snippet and all in-team information
 *
 * @param {Number} team Team Index
 */
function Snippet_Team(team) {
	var panel = $.CreatePanel("Panel", $("#TeamsContainer"), "");
	panel.BLoadLayoutSnippet("Team");
	panel.SetHasClass("IsRight", true);
	panel.SetHasClass("IsWinner", GAME_RESULT.isWinner);

	if (team === 2) {
		panel.FindChildTraverse("GoldXpMultiplier").text = $.Localize("#player_multiplier") + ": x" + GAME_RESULT.options.playerGoldXpMultiplier;
		panel.FindChildTraverse("TowerPower").text = $.Localize("#tower_power") + ": " + GAME_RESULT.options.towerPower;
	} else {
		panel.FindChildTraverse("GoldXpMultiplier").text = $.Localize("#bot_multiplier") + ": x" + GAME_RESULT.options.botGoldXpMultiplier;
		panel.FindChildTraverse("TowerPower").text = $.Localize("#tower_endure") + ": " + GAME_RESULT.options.towerEndure;
	}
	const teamDetails = Game.GetTeamDetails( team );
	panel.FindChildTraverse("TeamScore").text = teamDetails.team_score;

	var ids = Game.GetPlayerIDsOnTeam(team)

	for(var i = 0; i < ids.length; i++) {
		if (Players.IsValidPlayerID(i) && GAME_RESULT.players[i] != null) {
			Snippet_Player(ids[i], panel, i + 1);
		}
	}
}


function OnGameResult(table, key, gameResult) {
	if (!gameResult || key !== "player_data") {
		$.Msg("[EndScreen2] Invalid game result");
		FinishGame();
		return;
	}

	if (Game.GetGameWinner() == "2") {
		gameResult.isWinner = true;
	} else {
		gameResult.isWinner = false;
	}

	$("#LoadingPanel").visible = false;
	$("#EndScreenWindow").visible = true;
	$("#TeamsContainer").RemoveAndDeleteChildren();

	GAME_RESULT = gameResult;

	Snippet_Team(2);
	Snippet_Team(3);

	var result_label = $("#EndScreenVictory")

	if (GAME_RESULT.isWinner) {
		$.Msg("[EndScreen2] Victory");
		result_label.text = $.Localize("#custom_end_screen_victory_message");
		result_label.style.color = "#5ebd51";
	} else {
		result_label.text = $.Localize("#custom_end_screen_lose_message");
		result_label.style.color = "#d14343";
	}
	var game_time = $("#GameTime")
    var timerValue = Game.GetDOTATime(false,true);

    if( timerValue > 0 )
    {
        var min = Math.floor( timerValue / 60 );
        var sec = Math.floor( timerValue % 60 );

        var timerText = "";

        timerText += min < 10 ? 0 : "";
        timerText += min;
        timerText += ":";
        timerText += sec < 10 ? 0 : "";
        timerText += sec;
		game_time.text = $.Localize("#DOTA_Lobby_Settings_Scenario_GameTime") + " " + timerText;
    }
}



(function() {
	$.Msg("CustomGameEndScreen2.js loaded");
	GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ENDGAME, false);
	find_hud_element("GameEndContainer").visible = false;

	$.GetContextPanel().RemoveClass("FadeOut");
	$("#LoadingPanel").visible = false;
	$("#EndScreenWindow").visible = false;

	CustomNetTables.SubscribeNetTableListener("ending_stats", OnGameResult);
	OnGameResult(null, "player_data", CustomNetTables.GetTableValue("ending_stats", "player_data"));
})();
