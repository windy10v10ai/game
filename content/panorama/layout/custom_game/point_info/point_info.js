(function () {
  $.Msg("point_info.js loaded");
  $.Schedule(1, OnDataLoaded);
})();

function OnDataLoaded() {
  $("#point_info_container").RemoveAndDeleteChildren();
  const data = CustomNetTables.GetTableValue("point_info", GetSteamAccountID());

  $.Msg("point_info.js OnDataLoaded", data);

  if (data == null) {
    // $.Schedule(0.5, OnDataLoaded);
    return;
  }

  for (const index in data) {
    AddPointInfo(data[index]);
  }

  // panel is displayed
  $("#panel_id").style.opacity = "1.0";
  $("#panel_id").style.visibility = "visible";
}

function FormatDailyChallengeRewardValue(value, unit) {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  if (unit == "millisecond") {
    const seconds = safeValue / 1000;
    const formatted = Number.isInteger(seconds)
      ? String(seconds)
      : seconds.toFixed(1).replace(/\.0$/, "");
    return $.Language() == "schinese" ? formatted + "\u79d2" : formatted + "s";
  }
  if ($.Language() == "schinese" && safeValue >= 10000) {
    const wan = safeValue / 10000;
    return (Number.isInteger(wan) ? String(wan) : wan.toFixed(1).replace(/\.0$/, "")) + "\u4e07";
  }
  return String(safeValue);
}

function GetDailyChallengeRewardTaskTitle(reward) {
  if (reward == null || reward.taskSnapshot == null) return "";
  const task = reward.taskSnapshot;
  const language = $.Language();
  let title = task.title.en;
  if (language == "schinese") title = task.title.cn;
  if (language == "russian") title = task.title.ru || task.title.en;
  return title.replace(
    /\{target\}/g,
    FormatDailyChallengeRewardValue(task.target, task.unit),
  );
}

function BuildDailyChallengeRewardDisplay(reward) {
  const sourceKeys = {
    personal: "#daily_challenge_reward_source_personal",
    global: "#daily_challenge_reward_source_global",
    streak: "#daily_challenge_reward_source_streak",
  };
  const tierKeys = {
    top: "#daily_challenge_reward_tier_top",
    middle: "#daily_challenge_reward_tier_middle",
    base: "#daily_challenge_reward_tier_base",
  };
  const meta = [
    $.Localize("#daily_challenge_reward_history_day").replace("{day}", reward.dayId),
  ];
  if (reward.contributionTier != null && tierKeys[reward.contributionTier] != null) {
    meta.push($.Localize(tierKeys[reward.contributionTier]));
  }
  if (reward.streakDays != null) {
    meta.push(
      $.Localize("#daily_challenge_reward_streak_days").replace(
        "{days}",
        String(reward.streakDays),
      ),
    );
  }
  return {
    source: $.Localize(sourceKeys[reward.source] || sourceKeys.personal),
    task: GetDailyChallengeRewardTaskTitle(reward),
    meta: meta.join(" \u00b7 "),
  };
}

function SetDailyChallengeRewardDetails(panel, reward) {
  const detailsPanel = panel.FindChildTraverse("dailyChallengeRewardDetails");
  if (reward == null) {
    detailsPanel.style.visibility = "collapse";
    return;
  }
  const display = BuildDailyChallengeRewardDisplay(reward);
  detailsPanel.style.visibility = "visible";
  panel.SetDialogVariable("daily_challenge_reward_source", display.source);
  panel.SetDialogVariable("daily_challenge_reward_meta", display.meta);
  const taskPanel = panel.FindChildTraverse("dailyChallengeRewardTask");
  if (display.task == "") {
    taskPanel.style.visibility = "collapse";
  } else {
    taskPanel.style.visibility = "visible";
    panel.SetDialogVariable("daily_challenge_reward_task", display.task);
  }
}

function AddPointInfo(data) {
  //add panel
  const panel = $.CreatePanel("Panel", $("#point_info_container"), "");
  panel.BLoadLayoutSnippet("PointInfoSnippet");

  // if chains, set panel title to chains
  if ($.Language() == "schinese") {
    // if data.title.cn contains '<br>' ,split it into two lines
    if (data.title.cn.indexOf("<br>") != -1) {
      const title = data.title.cn.split("<br>");
      panel.SetDialogVariable("point_info_title_text1", title[0]);
      panel.SetDialogVariable("point_info_title_text2", title[1]);
    } else {
      panel.SetDialogVariable("point_info_title_text1", data.title.cn);
      // hide point_info_title_text2
      panel.FindChildTraverse("pointInfoTitle2").style.visibility = "collapse";
    }
  } else {
    if (data.title.en.indexOf("<br>") != -1) {
      const title = data.title.en.split("<br>");
      panel.SetDialogVariable("point_info_title_text1", title[0]);
      panel.SetDialogVariable("point_info_title_text2", title[1]);
    } else {
      panel.SetDialogVariable("point_info_title_text1", data.title.en);
      // hide point_info_title_text2
      panel.FindChildTraverse("pointInfoTitle2").style.visibility = "collapse";
    }
  }

  // hide panelPoint if no seasonPoint
  if (data.seasonPoint == null || data.seasonPoint == 0) {
    panel.FindChildTraverse("panelSeasonPoint").style.visibility = "collapse";
  } else {
    panel.SetDialogVariable("point_info_seasonPoint", data.seasonPoint);
  }
  // hide panelPoint if no memberPoint
  if (data.memberPoint == null || data.memberPoint == 0) {
    panel.FindChildTraverse("panelMemberPointt").style.visibility = "collapse";
  } else {
    panel.SetDialogVariable("point_info_memberPoint", data.memberPoint);
  }

  SetDailyChallengeRewardDetails(panel, data.dailyChallengeReward);
}

const _ui_RootPanel = $("#panel_id");

function OnClick_CloseView() {
  $.Msg("==>  Popup Pay close: ", _ui_RootPanel.id);

  // panel is hidden
  _ui_RootPanel.style.opacity = "0.0";
  _ui_RootPanel.style.visibility = "collapse";
}
