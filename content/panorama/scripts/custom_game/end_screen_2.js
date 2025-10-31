/**
    DISCLAIMER:
    This file is heavily inspired and based on the open sourced code from Angel Arena Black Star, respecting their Apache-2.0 License.
    Thanks to Angel Arena Black Star.
 */

var imagefile = {
  npc_dota_hero_meepo: 'file://{images}/heroes/npc_dota_hero_meepo_custom.png',
  // npc_dota_hero_juggernaut: "file://{images}/heroes/npc_dota_hero_juggernaut_custom.png",
  npc_dota_hero_techies: 'file://{images}/heroes/npc_dota_hero_techies_custom.png',
  npc_dota_hero_broodmother: 'file://{images}/heroes/npc_dota_hero_broodmother_custom.png',
  npc_dota_hero_visage: 'file://{images}/heroes/npc_dota_hero_visage_custom.png',
  npc_dota_hero_chen: 'file://{images}/heroes/npc_dota_hero_chen_custom.png',
  npc_dota_hero_pangolier: 'file://{images}/heroes/npc_dota_hero_pangolier_custom.png',
  npc_dota_hero_phantom_lancer: 'file://{images}/heroes/npc_dota_hero_phantom_lancer_custom.png',
  npc_dota_hero_brewmaster: 'file://{images}/heroes/npc_dota_hero_brewmaster_custom.png',
  npc_dota_hero_dark_seer: 'file://{images}/heroes/npc_dota_hero_dark_seer_custom.png',
};

var _ = GameUI.CustomUIConfig()._;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FinishGame() {
  Game.FinishGame();
  Game.LeaveCurrentGame();
}

/**
 * Creates Panel snippet and sets all player-releated information
 *
 * @param {Number} playerId Player ID
 * @param {Panel} rootPanel Panel that will be parent for that player
 */
function Snippet_Player(playerId, rootPanel, index) {
  var panel = $.CreatePanel('Panel', rootPanel, '');
  panel.BLoadLayoutSnippet('Player');
  panel.SetHasClass('IsLocalPlayer', playerId === Game.GetLocalPlayerID());

  var playerData = CustomNetTables.GetTableValue('player_stats', playerId.toString());
  var playerInfo = Game.GetPlayerInfo(playerId);
  if (playerInfo.player_steamid && playerInfo.player_steamid !== '0') {
    panel.FindChildTraverse('PlayerAvatar').steamid = playerInfo.player_steamid;
    panel.FindChildTraverse('PlayerNameScoreboard').steamid = playerInfo.player_steamid;
  } else {
    panel.FindChildTraverse('PlayerAvatar').steamid = playerInfo.player_steamid;
    panel.FindChildTraverse('PlayerNameScoreboard').visible = false;
    panel.FindChildTraverse('BotNameScoreboard').visible = true;
  }

  if (IsMemberByPlayerId(playerId)) {
    panel.AddClass('IsMemberShip');
    const membershipString = $.Localize('#player_member_ship');
    const membershipUrl = GetOpenMemberUrl();

    const membershipIcon = panel.FindChildTraverse('PlayerMemberShip');

    membershipIcon.SetPanelEvent('onmouseover', () => {
      $.DispatchEvent('DOTAShowTextTooltip', membershipIcon, membershipString);
    });
    membershipIcon.SetPanelEvent('onmouseout', () => {
      $.DispatchEvent('DOTAHideTextTooltip');
    });

    membershipIcon.SetPanelEvent('onactivate', () => {
      $.DispatchEvent('ExternalBrowserGoToURL', membershipUrl);
    });
  }

  panel.index = index; // For backwards compatibility
  panel.style.animationDelay = index * 0.3 + 's';
  $.Schedule(index * 0.3, function () {
    try {
      panel.AddClass('AnimationEnd');
    } catch {}
  });

  const heroName = Players.GetPlayerSelectedHero(playerId);

  if (imagefile[heroName]) {
    panel.FindChildTraverse('HeroIcon').SetImage(imagefile[heroName]);
  } else {
    panel.FindChildTraverse('HeroIcon').SetImage('file://{images}/heroes/' + heroName + '.png');
  }
  panel.SetDialogVariableInt('hero_level', Players.GetLevel(playerId));
  panel.SetDialogVariable('hero_name', $.Localize('#' + heroName));

  panel.SetDialogVariableInt('kills', Players.GetKills(playerId));
  panel.SetDialogVariableInt('deaths', Players.GetDeaths(playerId));
  panel.SetDialogVariableInt('assists', Players.GetAssists(playerId));
  panel.SetDialogVariableInt('lasthits', Players.GetLastHits(playerId));
  panel.SetDialogVariableInt('money', Players.GetTotalEarnedGold(playerId));
  panel.SetDialogVariableInt('damage', playerData?.damage ?? 0);
  panel.SetDialogVariableInt('damagereceived', playerData?.damagereceived ?? 0);
  panel.SetDialogVariableInt('heroHealing', playerData?.healing ?? 0);
  panel.SetDialogVariableInt('towerKills', playerData?.towerKills ?? 0);
  panel.SetDialogVariableInt('points', playerData?.points ?? 0);

  panel.SetDialogVariableInt('strength', playerData?.str ?? 0);
  panel.SetDialogVariableInt('agility', playerData?.agi ?? 0);
  panel.SetDialogVariableInt('intellect', playerData?.int ?? 0);

  // 绘制物品栏
  const items = Game.GetPlayerItems(playerId);
  for (var i = 0; i < 6; i++) {
    var itemPanel = $.CreatePanel(
      'DOTAItemImage',
      panel.FindChildTraverse(i >= 6 ? 'BackpackItemsContainer' : 'ItemsContainer'),
      '',
    );
    var item = items?.inventory[i];
    if (item) {
      itemPanel.itemname = item.item_name;
    }
  }

  // 绘制中立物品
  const neutralItemPanel = $.CreatePanel(
    'DOTAItemImage',
    panel.FindChildTraverse('NeutralItemContainer'),
    '',
  );
  const neutralItem = items?.neutral_item;
  if (neutralItem) {
    neutralItemPanel.itemname = neutralItem.item_name;
  }
  // 绘制中立被动
  const neutralItemPassivePanel = $.CreatePanel(
    'DOTAItemImage',
    panel.FindChildTraverse('NeutralItemPassiveContainer'),
    '',
  );
  const heroIndex = Players.GetPlayerHeroEntityIndex(playerId);
  const neutralItemPassiveIndex = Entities.GetItemInSlot(heroIndex, 17);

  if (neutralItemPassiveIndex > 0) {
    neutralItemPassivePanel.itemname = Abilities.GetAbilityName(neutralItemPassiveIndex);
    neutralItemPassivePanel.contextEntityIndex = neutralItemPassiveIndex;
  }

  // 绘制选择的技能
  const steamAccountID = playerData?.steamId;
  if (steamAccountID) {
    const lotteryStatus = CustomNetTables.GetTableValue('lottery_status', steamAccountID);
    if (lotteryStatus) {
      const abilitiesContainer = panel.FindChildTraverse('AbilitiesContainer');

      // 显示主动技能
      CreateAbilityImage(abilitiesContainer, lotteryStatus.activeAbilityName);

      // 显示第一个被动技能
      CreateAbilityImage(abilitiesContainer, lotteryStatus.passiveAbilityName);

      // 显示第二个被动技能
      CreateAbilityImage(abilitiesContainer, lotteryStatus.passiveAbilityName2);
    }
  }
}

function CreateAbilityImage(abilitiesContainer, abilityName) {
  const abilityPanel = $.CreatePanel('DOTAAbilityImage', abilitiesContainer, '', {
    abilityname: abilityName,
    showtooltip: true,
  });
  abilityPanel.AddClass('AbilityImage');
}

/**
 * Creates Team snippet and all in-team information
 *
 * @param {Number} team Team Index
 */
function Snippet_Team(team) {
  var panel = $.CreatePanel('Panel', $('#TeamsContainer'), '');
  panel.BLoadLayoutSnippet('Team');
  panel.SetHasClass('IsRight', true);
  panel.SetHasClass('IsWinner', Game.GetGameWinner() === 2);

  const gameOptions = CustomNetTables.GetTableValue('game_options', 'game_options');
  const gameDifficulty = CustomNetTables.GetTableValue('game_difficulty', 'all').difficulty;
  if (team === 2) {
    const goldXpMultiplierPanel = panel.FindChildTraverse('GoldXpMultiplier');
    if (gameDifficulty > 0) {
      goldXpMultiplierPanel.text = $.Localize('#game_difficulty_title') + ` N${gameDifficulty}`;
      goldXpMultiplierPanel.style.marginTop = '8px';
      goldXpMultiplierPanel.style.fontSize = '26px';
    } else {
      panel.FindChildTraverse('GoldXpMultiplier').text =
        $.Localize('#player_multiplier') +
        `: x${gameOptions.multiplier_radiant.toFixed(1).replace(/\.0+$/, '')}`;
      panel.FindChildTraverse('TowerPower').text =
        $.Localize('#tower_power') + `: ${gameOptions.tower_power_pct}%`;
    }
  } else {
    if (gameDifficulty > 0) {
      //
    } else {
      panel.FindChildTraverse('GoldXpMultiplier').text =
        $.Localize('#player_multiplier') +
        `: x${gameOptions.multiplier_dire.toFixed(1).replace(/\.0+$/, '')}`;
      panel.FindChildTraverse('TowerPower').text =
        $.Localize('#tower_power') + `: ${gameOptions.tower_power_pct}%`;
    }
  }
  const teamDetails = Game.GetTeamDetails(team);
  panel.FindChildTraverse('TeamScore').text = teamDetails.team_score;

  var ids = Game.GetPlayerIDsOnTeam(team);

  for (var i = 0; i < ids.length; i++) {
    if (Players.IsValidPlayerID(i)) {
      Snippet_Player(ids[i], panel, i + 1);
    }
  }
}

function OnGameResult(_table, key, value) {
  if (!value?.status || value.status < 1) {
    return;
  }

  $('#EndScreenWindow').visible = true;
  $('#TeamsContainer').RemoveAndDeleteChildren();

  Snippet_Team(2);
  Snippet_Team(3);

  var result_label = $('#EndScreenVictory');

  $.Msg(`[EndScreen2] winner is ${Game.GetGameWinner()}`);
  if (Game.GetGameWinner() === 2) {
    result_label.text = $.Localize('#custom_end_screen_victory_message');
    result_label.style.color = '#5ebd51';
  } else {
    result_label.text = $.Localize('#custom_end_screen_lose_message');
    result_label.style.color = '#d14343';
  }
  var game_time = $('#GameTime');
  var timerValue = Game.GetDOTATime(false, true);

  if (timerValue > 0) {
    var min = Math.floor(timerValue / 60);
    var sec = Math.floor(timerValue % 60);

    var timerText = '';

    timerText += min < 10 ? 0 : '';
    timerText += min;
    timerText += ':';
    timerText += sec < 10 ? 0 : '';
    timerText += sec;
    game_time.text = $.Localize('#DOTA_Lobby_Settings_Scenario_GameTime') + ' ' + timerText;
  }
}

// function OnGameEndingStatusChange(table, key, value) {
// 	$.Msg("OnGameEndingStatusChange", table, key, value);
// 	if (value) {
// 		const status = value.status;
// 		$("#GameEndingStatusText").text = $.Localize("#ending_status_" + status);
// 		if (status == 1) {
// 			$("#CloseButton").enabled = false;
// 		}
// 		if (status == 2) {
// 			$("#CloseButton").enabled = true;
// 			$("#GameEndingStatusText").style.color = "#6bc1ff";
// 		}
// 		if (status == 3) {
// 			$("#CloseButton").enabled = true;
// 			$("#GameEndingStatusText").style.color = "#ff8367";
// 		}
// 	}
// }

(function () {
  $.Msg('CustomGameEndScreen2.js loaded');
  GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ENDGAME, false);
  find_hud_element('GameEndContainer').visible = false;

  $.GetContextPanel().RemoveClass('FadeOut');
  // disable the close button
  // $("#CloseButton").enabled = false;
  // $("#GameEndingStatusText").style.color = "#ffffff";

  $('#EndScreenWindow').visible = false;
  CustomNetTables.SubscribeNetTableListener('ending_status', OnGameResult);
  // CustomNetTables.SubscribeNetTableListener("ending_status", OnGameEndingStatusChange);
  OnGameResult(null, null, CustomNetTables.GetTableValue('ending_status', 'ending_status'));
})();
