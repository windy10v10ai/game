'use strict';

function GetLocalPlayerID() {
  return Game.GetLocalPlayerID();
}

function GetSelectedEntities() {
  return Players.GetSelectedEntities(GetLocalPlayerID());
}

// 对所有选中单位逐个派发同名按钮事件，payload 为 entindex。
function DispatchForSelectedEntities(eventName) {
  var entities = GetSelectedEntities();
  var numEntities = Object.keys(entities).length;
  var dispatched = false;

  for (var i = 0; i < numEntities; i++) {
    var entindex = entities[i];
    if (entindex === -1) {
      continue;
    }
    dispatched = true;
    $.DispatchEvent('FireCustomGameEvent_Str', eventName, String(entindex));
  }

  Game.EmitSound(dispatched ? 'UI.Button.Pressed' : 'General.Cancel');
}

function Init() {
  $.RegisterEventHandler(
    'DOTAUIHeroPickerHeroSelected',
    $('#SelectHeroContainer'),
    SwitchToNewHero,
  );
  $.DispatchEvent('FireCustomGameEvent_Str', 'RequestInitialSpawnHeroID', null);
}

var bHeroPickerVisible = false;

function ToggleHeroPicker(bMainHero) {
  Game.EmitSound('UI.Button.Pressed');
  $('#SelectHeroContainer').SetHasClass('PickMainHero', bMainHero);
  SetHeroPickerVisible(!bHeroPickerVisible);
}

function EscapeHeroPickerSearch() {
  SetHeroPickerVisible(false);
}

function CloseHeroPicker() {
  SetHeroPickerVisible(false);
}

function SetHeroPickerVisible(bVisible) {
  if (bHeroPickerVisible && !bVisible) {
    $('#SelectHeroContainer').RemoveClass('HeroPickerVisible');
    $('#SelectHeroContainer').FindChildTraverse('HeroSearchTextEntry').text = '';
  } else if (!bHeroPickerVisible && bVisible) {
    $('#SelectHeroContainer').AddClass('HeroPickerVisible');
    $('#SelectHeroContainer').FindChildTraverse('HeroSearchTextEntry').SetFocus();
  }
  bHeroPickerVisible = bVisible;
}

function SwitchToNewHero(nHeroID) {
  Game.EmitSound('UI.Button.Pressed');

  if ($('#SelectHeroContainer').BHasClass('PickMainHero')) {
    $.DispatchEvent('FireCustomGameEvent_Str', 'SelectMainHeroButtonPressed', String(nHeroID));
  } else {
    $.DispatchEvent('FireCustomGameEvent_Str', 'SelectSpawnHeroButtonPressed', String(nHeroID));
  }

  $('#SelectHeroContainer').RemoveClass('PickMainHero');
  SetHeroPickerVisible(false);
}

function OnSetSpawnHeroID(event_data) {
  var heroPickerImage = $('#HeroPickerImage');
  if (heroPickerImage != null) {
    heroPickerImage.heroid = event_data.hero_id;
  }

  var spawnHeroButton = $('#SpawnHeroButton');
  if (spawnHeroButton != null) {
    spawnHeroButton.SetDialogVariable('hero_name', $.Localize('#' + event_data.hero_name));
  }
}
GameEvents.Subscribe('set_spawn_hero_id', OnSetSpawnHeroID);

function RemoveSelectedHeroes() {
  // 是否为调试英雄、是否误删玩家主英雄，由服务端用 modifier 标记判断。
  DispatchForSelectedEntities('RemoveHeroButtonPressed');
}

function ToggleInvulnerability() {
  DispatchForSelectedEntities('ToggleInvulnerabilityHero');
}

function InvulnerableOn() {
  DispatchForSelectedEntities('InvulnOnHero');
}

function InvulnerableOff() {
  DispatchForSelectedEntities('InvulnOffHero');
}

function LevelUpSelectedHeroes() {
  DispatchForSelectedEntities('LevelUpHero');
}

function MaxLevelUpSelectedHeroes() {
  DispatchForSelectedEntities('MaxLevelUpHero');
}

function ResetSelectedHeroes() {
  DispatchForSelectedEntities('ResetHero');
}

function ShardSelectedHeroes() {
  DispatchForSelectedEntities('ShardHero');
}

function ScepterSelectedHeroes() {
  DispatchForSelectedEntities('ScepterHero');
}

// 对所有选中单位添加物品/技能。kind: 'item' | 'ability'
function DispatchAddToSelectedEntities(kind) {
  var name = $('#AddToUnitInput').text;
  if (!name) {
    Game.EmitSound('General.Cancel');
    return;
  }

  var entities = GetSelectedEntities();
  var numEntities = Object.keys(entities).length;
  var dispatched = false;

  for (var i = 0; i < numEntities; i++) {
    var entindex = entities[i];
    if (entindex === -1) {
      continue;
    }
    dispatched = true;
    GameEvents.SendCustomGameEventToServer('debug_panel_add_to_unit', {
      entindex: entindex,
      kind: kind,
      name: name,
    });
  }

  Game.EmitSound(dispatched ? 'UI.Button.Pressed' : 'General.Cancel');
}

function AddItemToSelected() {
  DispatchAddToSelectedEntities('item');
}

function AddAbilityToSelected() {
  DispatchAddToSelectedEntities('ability');
}

function MouseOverRune(strRuneID, strRuneTooltip) {
  var runePanel = $('#' + strRuneID);
  runePanel.StartAnimating();
  $.DispatchEvent('UIShowTextTooltip', runePanel, strRuneTooltip);
}

function MouseOutRune(strRuneID) {
  var runePanel = $('#' + strRuneID);
  runePanel.StopAnimating();
  $.DispatchEvent('UIHideTextTooltip', runePanel);
}

function SlideThumbActivate() {
  var slideThumb = $.GetContextPanel();
  Game.EmitSound(
    slideThumb.BHasClass('Minimized') ? 'ui_settings_slide_out' : 'ui_settings_slide_in',
  );
  slideThumb.ToggleClass('Minimized');
}

function SpawnToTeam(iTeamNumber) {
  $.DispatchEvent('FireCustomGameEvent_Str', 'SpawnToTeamButtonPressed', String(iTeamNumber));
}

Init();
