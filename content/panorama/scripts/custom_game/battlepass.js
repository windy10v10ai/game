(function () {
  $.Schedule(0.1, PregameSetup);
})();

function PregameSetup() {
  const player = GetPlayer();
  PlayerDataLoaded(player);
  SubscribePlayer(PlayerDataLoaded);
  if (player && player.useableLevel > 1) {
    SetPropertySelected();
  } else {
    SetDataSelected();
  }
}

function PlayerDataLoaded(player) {
  $.Msg("LocalDataLoaded");
  $.Msg(player);

  if (player == null) {
    $("#LoadingFail").visible = true;
    return;
  }

  $("#SeasonLevelNumber").text = player.seasonLevel;
  $("#SeasonLevelNextRemainingNumber").text =
    `${player.seasonCurrrentLevelPoint} / ${player.seasonNextLevelPoint}`;
  $("#MemberLevelNumber").text = player.memberLevel;
  $("#MemberLevelNextRemainingNumber").text =
    `${player.memberCurrentLevelPoint} / ${player.memberNextLevelPoint}`;

  $("#SeasonLevelNextRemainingBarLeft").style.width = `${
    (player.seasonCurrrentLevelPoint / player.seasonNextLevelPoint) * 100
  }%`;
  $("#MemberLevelNextRemainingBarLeft").style.width = `${
    (player.memberCurrentLevelPoint / player.memberNextLevelPoint) * 100
  }%`;
  // 点数提示
  SetUseableLevelTooltip(player);

  // 顶部积分
  SetTopStatus(player);
  // 英雄属性
  SetPlayerProperty(player);

  if ((player.useableLevel = player.totalLevel)) {
    SetPropertySelected();
  }

  $.Msg("BP Loaded!");
}

// --------------------------------------------------------------------------------
// 选项卡切换

// 数据
function SetDataSelected() {
  $("#BPNavButtonData").checked = true;
  SwitchToData();
}

function SetPropertySelected() {
  $("#BPNavButtonProperty").checked = true;
  SwitchToProperty();
}

function SwitchToData() {
  $("#BpWindowMainLevel").visible = true;
  $("#BpWindowMainProperty").visible = false;
}

// 属性

function SwitchToProperty() {
  $("#BpWindowMainProperty").visible = true;

  $("#BpWindowMainLevel").visible = false;
  SwitchToPropertyList();
}

function SwitchToPropertyList() {
  $("#RBPropertyList").checked = true;
  $("#PropertyListContainer").visible = true;
  $("#PropertyResetContainer").visible = false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SwitchToPropertyReset() {
  $("#RBPropertyReset").checked = true;
  $("#PropertyListContainer").visible = false;
  $("#PropertyResetContainer").visible = true;
}

// --------------------------------------------------------------------------------
// 设置数据页面
function SetUseableLevelTooltip(player) {
  const useableLevel = player.useableLevel;
  SetUseableLevelTooltipSnippet($("#BPButtonTooltip"), useableLevel);
}

function SetUseableLevelTooltipSnippet(panel, useableLevel) {
  if (!useableLevel) {
    panel.style.visibility = "collapse";
    return;
  }
  panel.style.visibility = "visible";
  panel.RemoveAndDeleteChildren();
  panel.BLoadLayoutSnippet("PlayerPropertyUseableLevelTooltip");
  panel.FindChildTraverse("UseableLevel").text = useableLevel;
}

function SetTopStatus(player) {
  // 数据
  $("#MemberPoint").text = player.memberPointTotal;
  $("#SeasonPoint").text = player.seasonPointTotal;
  $("#PropertyPoint").text = `${player.useableLevel} / ${player.totalLevel}`;
}

// 属性
function SetPlayerProperty(player) {
  SetResetPropertyButton(player);
  ClearPlayerProperty();

  const panel = $.CreatePanel("Panel", $("#PropertyListContainer"), "");
  panel.BLoadLayoutSnippet("PlayerPropertyTooltip");
  for (const property of Player_Property_List) {
    AddPlayerProperty(player, property);
  }
}

function ClearPlayerProperty() {
  $("#PropertyListContainer").RemoveAndDeleteChildren();
}

// 设置重置属性按钮
function SetResetPropertyButton(player) {
  // 勇士积分重置
  const resetUseSeasonPointButton = $("#ResetUseSeasonPoint");
  const text = $.Localize(`#reset_property_use_season_point`);
  $("#ResetUseSeasonPointText").text = text.replace("{seasonPoint}", player.seasonNextLevelPoint);
  if (player.seasonPointTotal >= player.seasonNextLevelPoint) {
    resetUseSeasonPointButton.SetHasClass("deactivated", false);
    resetUseSeasonPointButton.SetHasClass("activated", true);
    resetUseSeasonPointButton.SetPanelEvent("onactivate", () => {
      OnPlayerPropertyResetActive(resetUseSeasonPointButton, false);
    });
  } else {
    resetUseSeasonPointButton.SetHasClass("deactivated", true);
    resetUseSeasonPointButton.SetHasClass("activated", false);
    resetUseSeasonPointButton.SetPanelEvent("onactivate", () => {});
  }

  // 会员积分重置
  const resetUseMemberPointButton = $("#ResetUseMemberPoint");
  if (player.memberPointTotal >= 1000) {
    resetUseMemberPointButton.SetHasClass("deactivated", false);
    resetUseMemberPointButton.SetHasClass("activated-gold", true);
    resetUseMemberPointButton.SetPanelEvent("onactivate", () => {
      OnPlayerPropertyResetActive(resetUseMemberPointButton, true);
    });
  } else {
    resetUseMemberPointButton.SetHasClass("deactivated", true);
    resetUseMemberPointButton.SetHasClass("activated", false);
    resetUseMemberPointButton.SetHasClass("activated-gold", false);
    resetUseMemberPointButton.SetPanelEvent("onactivate", () => {});
  }
}

function AddPlayerProperty(player, property) {
  const propertiesValues = player.properties ? Object.values(player.properties) : [];
  const playerProperty = propertiesValues.find((p) => p.name === property.name);
  if (playerProperty) {
    property.level = playerProperty.level;
  } else {
    property.level = 0;
  }

  const maxLevel = 8;

  const panel = $.CreatePanel("Panel", $("#PropertyListContainer"), "");
  panel.BLoadLayoutSnippet("Property");

  // 图标
  let imageSrc = property.imageSrc;
  if (!imageSrc) {
    imageSrc = "s2r://panorama/images/cavern/icon_custom_challenge_png.vtex";
  }
  panel.FindChildTraverse("PropertyImage").SetImage(imageSrc);
  // 标题
  const propertyName = $.Localize(`#data_panel_player_${property.name}`);
  panel.SetDialogVariable("PropertyName", propertyName);
  // 数值
  const propertyLevelString =
    $.Localize(`#data_panel_player_property_level`) + " " + property.level + "/" + maxLevel;
  let propertyValue = property.level * property.valuePerLevel;
  // 如果不为整数，小数点一位以内
  if (propertyValue % 1 !== 0) {
    propertyValue = propertyValue.toFixed(1);
  }
  const propertyValueString = $.Localize(`#data_panel_player_property_value`) + " " + propertyValue;
  panel.SetDialogVariable("PropertyLevel", propertyLevelString);
  panel.SetDialogVariable("PropertyValue", propertyValueString);
  panel.FindChildTraverse("PropertyLevel").style.color = "#2cba75";
  // 升级按钮
  let levelupText =
    $.Localize(`#data_panel_player_property_level_up`) + ` (+${property.valuePerLevel})`;
  let nextLevel = property.level + 1;
  // 特殊属性
  if (
    property.name === "property_skill_points_bonus" ||
    property.name === "property_ignore_movespeed_limit" ||
    property.name === "property_cannot_miss"
  ) {
    levelupText = $.Localize(`#data_panel_player_property_level_up_X`).replace(
      "X",
      property.pointCostPerLevel,
    );
    nextLevel = property.level + property.pointCostPerLevel;
    panel.FindChildTraverse("Levelup").SetHasClass("LevelupButtonLong", true);
  }

  panel.FindChildTraverse("Levelup").name = property.name;
  panel.FindChildTraverse("Levelup").nextLevel = nextLevel;
  panel.FindChildTraverse("LevelupText").text = levelupText;

  if (Player_Propertys_Show_Tooltip_1.includes(property.name)) {
    panel.FindChildTraverse("PropertyTooltip1").SetHasClass("hidden", false);
  } else if (Player_Propertys_Show_Tooltip_2.includes(property.name)) {
    panel.FindChildTraverse("PropertyTooltip2").SetHasClass("hidden", false);
  } else {
    panel.FindChildTraverse("PropertyTooltip").SetHasClass("hidden", false);
  }

  if (property.level < maxLevel && player.useableLevel >= nextLevel - property.level) {
    panel.FindChildTraverse("Levelup").SetHasClass("deactivated", false);
    panel.FindChildTraverse("Levelup").SetHasClass("activated", true);
    panel.FindChildTraverse("Levelup").SetPanelEvent("onactivate", () => {
      OnLevelupActive(panel);
    });
  }
}

function OnLevelupActive(panel) {
  $.Msg("Levelup");
  $.Msg(panel.FindChildTraverse("Levelup").name);
  $.Msg(panel.FindChildTraverse("Levelup").nextLevel);
  // disable button
  panel.FindChildTraverse("Levelup").SetHasClass("deactivated", true);
  panel.FindChildTraverse("Levelup").SetHasClass("activated", false);
  panel.FindChildTraverse("Levelup").SetPanelEvent("onactivate", () => {});
  // send request to server
  GameEvents.SendCustomGameEventToServer("player_property_levelup", {
    name: panel.FindChildTraverse("Levelup").name,
    level: panel.FindChildTraverse("Levelup").nextLevel,
  });
}

function OnPlayerPropertyResetActive(panel, useMemberPoint) {
  $.Msg("OnPlayerPropertyResetActive");
  // disable button
  panel.SetHasClass("deactivated", true);
  panel.SetHasClass("activated", false);
  panel.SetHasClass("activated-gold", false);
  panel.SetPanelEvent("onactivate", () => {});
  // send request to server
  GameEvents.SendCustomGameEventToServer("player_property_reset", {
    useMemberPoint,
  });
}

const Player_Propertys_Show_Tooltip_1 = [
  "property_cooldown_percentage",
  "property_movespeed_bonus_constant",
  "property_health_regen_percentage",
  "property_mana_regen_total_percentage",
  "property_ignore_movespeed_limit",
  "property_cannot_miss",
];

const Player_Propertys_Show_Tooltip_2 = ["property_skill_points_bonus"];

const Player_Property_List = [
  {
    name: "property_cooldown_percentage",
    level: 0,
    imageSrc: "s2r://panorama/images/cavern/icon_shovel_png.vtex",
    valuePerLevel: 4,
  },
  {
    name: "property_movespeed_bonus_constant",
    level: 0,
    imageSrc: "s2r://panorama/images/cavern/icon_cc_steed_png.vtex",
    valuePerLevel: 25,
  },
  {
    name: "property_skill_points_bonus",
    level: 0,
    imageSrc: "s2r://panorama/images/hud/reborn/levelup_plus_fill_psd.vtex",
    valuePerLevel: 0.5,
    pointCostPerLevel: 2,
  },
  {
    name: "property_cast_range_bonus_stacking",
    level: 0,
    imageSrc: "s2r://panorama/images/cavern/icon_cc_aghs_png.vtex",
    valuePerLevel: 25,
  },
  {
    name: "property_spell_amplify_percentage",
    level: 0,
    imageSrc: "s2r://panorama/images/challenges/icon_challenges_magicdamage_png.vtex",
    valuePerLevel: 5,
  },
  {
    name: "property_status_resistance_stacking",
    level: 0,
    imageSrc: "s2r://panorama/images/cavern/icon_cc_fuzzy_png.vtex",
    valuePerLevel: 4,
  },
  {
    name: "property_evasion_constant",
    level: 0,
    imageSrc: "s2r://panorama/images/spellicons/blue_dragonspawn_overseer_evasion_png.vtex",
    valuePerLevel: 4,
  },
  {
    name: "property_magical_resistance_bonus",
    level: 0,
    imageSrc:
      "s2r://panorama/images/events/aghanim/blessing_icons/blessing_magic_resist_icon_png.vtex",
    valuePerLevel: 4,
  },
  {
    name: "property_incoming_damage_percentage",
    level: 0,
    imageSrc: "s2r://panorama/images/cavern/map_unlock_support_psd.vtex",
    valuePerLevel: 4,
  },
  {
    name: "property_attack_range_bonus",
    level: 0,
    imageSrc: "s2r://panorama/images/challenges/icon_challenges_spelldisjointed_png.vtex",
    valuePerLevel: 25,
  },
  {
    name: "property_physical_armor_bonus",
    level: 0,
    imageSrc: "s2r://panorama/images/cavern/icon_cc_ti2021final_png.vtex",
    valuePerLevel: 5,
  },
  {
    name: "property_preattack_bonus_damage",
    level: 0,
    imageSrc: "s2r://panorama/images/challenges/icon_challenges_physicaldamage_png.vtex",
    valuePerLevel: 15,
  },
  {
    name: "property_attackspeed_bonus_constant",
    level: 0,
    imageSrc:
      "s2r://panorama/images/events/aghanim/blessing_icons/blessing_attack_speed_icon_dormant_png.vtex",
    valuePerLevel: 15,
  },
  {
    name: "property_stats_strength_bonus",
    level: 0,
    imageSrc:
      "s2r://panorama/images/primary_attribute_icons/primary_attribute_icon_strength_psd.vtex",
    valuePerLevel: 10,
  },
  {
    name: "property_stats_agility_bonus",
    level: 0,
    imageSrc:
      "s2r://panorama/images/primary_attribute_icons/primary_attribute_icon_agility_psd.vtex",
    valuePerLevel: 10,
  },
  {
    name: "property_stats_intellect_bonus",
    level: 0,
    imageSrc:
      "s2r://panorama/images/primary_attribute_icons/primary_attribute_icon_intelligence_psd.vtex",
    valuePerLevel: 15,
  },
  {
    name: "property_lifesteal",
    level: 0,
    imageSrc: "s2r://panorama/images/challenges/icon_challenges_lifestolen_png.vtex",
    valuePerLevel: 10,
  },
  {
    name: "property_spell_lifesteal",
    level: 0,
    imageSrc: "s2r://panorama/images/challenges/icon_challenges_creepkillswithabilities_png.vtex",
    valuePerLevel: 8,
  },
  {
    name: "property_health_regen_percentage",
    level: 0,
    imageSrc: "s2r://panorama/images/challenges/icon_challenges_totalhealing_png.vtex",
    valuePerLevel: 0.3,
  },
  {
    name: "property_mana_regen_total_percentage",
    level: 0,
    imageSrc: "s2r://panorama/images/challenges/icon_challenges_manareduction_png.vtex",
    valuePerLevel: 0.3,
  },
  {
    name: "property_ignore_movespeed_limit",
    level: 0,
    imageSrc: "s2r://panorama/images/cavern/icon_cc_wings_png.vtex",
    valuePerLevel: 0.125,
    pointCostPerLevel: 8,
  },
  {
    name: "property_cannot_miss",
    level: 0,
    imageSrc: "s2r://panorama/images/cavern/icon_swap_png.vtex",
    valuePerLevel: 0.125,
    pointCostPerLevel: 8,
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ToggleBP() {
  const state = $("#BPWindow");
  // if has classe ToogleBPMinimize
  if (state.style.opacity === "0.0" || state.style.opacity == null) {
    state.style.opacity = "0.98";
    state.style.transform = "none";
    state.style.visibility = "visible";
  } else {
    state.style.opacity = "0.0";
    state.style.transform = "translateX(-400px)";
    $.Schedule(0.3, CollapseBP);
  }
}

function CollapseBP() {
  $("#BPWindow").style.visibility = "collapse";
}

function GetDotaHud() {
  var panel = $.GetContextPanel();
  while (panel && panel.id !== "Hud") {
    panel = panel.GetParent();
  }

  if (!panel) {
    throw new Error("Could not find Hud root from panel with id: " + $.GetContextPanel().id);
  }

  return panel;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FindDotaHudElement(id) {
  return GetDotaHud().FindChildTraverse(id);
}
