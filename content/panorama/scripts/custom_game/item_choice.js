(function () {
  $.Msg('item_choice.js loaded');
  // GameEvents.Subscribe('item_choice', SetItemChoice);
  // 监听nettable数据变化
  CustomNetTables.SubscribeNetTableListener('lottery', LotteryDataChanged);

  const steamAccountID = GetSteamAccountID();
  const lotteryData = CustomNetTables.GetTableValue('lottery', steamAccountID);
  $.Msg('lotteryData:', lotteryData);
  drawItemChoice(lotteryData);

  const member = GetMember();
  const button = $('#item_choice_shuffle');
  if (member && member.enable) {
    button.SetHasClass('IsEnable', true);
    button.SetPanelEvent('onactivate', OnShuffleButtonPressed);
    button.SetPanelEvent('onmouseover', () => {
      $.DispatchEvent('DOTAShowTextTooltip', button, $.Localize('#item_choice_shuffle'));
    });
  } else {
    button.SetPanelEvent('onactivate', () => {
      $.DispatchEvent('ExternalBrowserGoToURL', GetOpenMemberUrl());
    });
    button.SetPanelEvent('onmouseover', () => {
      $.DispatchEvent('DOTAShowTextTooltip', button, $.Localize('#item_choice_shuffle_not_member'));
    });
  }
  button.SetPanelEvent('onmouseout', () => {
    $.DispatchEvent('DOTAHideTextTooltip');
  });
})();

function LotteryDataChanged(_tableName, key, value) {
  $.Msg('SetItemChoice');
  // if key equal steamId, then show item choice
  const steamAccountID = GetSteamAccountID();
  $.Msg('SteamId:', steamAccountID, ' Key:', key, ' Value:', value);
  if (key !== steamAccountID) {
    return;
  }
  drawItemChoice(value);
}

function drawItemChoice(value) {
  if (!value) {
    return;
  }
  if (value.pickItemName) {
    return;
  }

  const names = Object.values(value.itemNamesNormal);
  $.Msg('Names:', names);
  let i = 1;
  for (const name of names) {
    $('#item_choice_' + i).itemname = name;
    i++;
  }
  $('#remaining_time').value = 400;
  $('#item_choice_container').style.visibility = 'visible';
  $.Schedule(0.03, TickItemTime);
}

function TickItemTime() {
  if ($('#item_choice_container').style.visibility == 'visible') {
    $('#remaining_time').value = $('#remaining_time').value - 1;

    if ($('#remaining_time').value <= 0) {
      MakeItemChoice(Math.floor(Math.random() * 3) + 1);
    } else {
      $('#remaining_time').style.width = $('#remaining_time').value / 4 + '%';
      $.Schedule(0.03, TickItemTime);
    }
  }
}

function MakeItemChoice(slot) {
  var item = $('#item_choice_' + slot).itemname;

  GameEvents.SendCustomGameEventToServer('lottery_pick_item', {
    item,
  });

  $('#remaining_time').value = 400;
  $('#remaining_time').style.width = '100%';
  $('#item_choice_container').style.visibility = 'collapse';
}

function OnShuffleButtonPressed() {
  $.Msg('OnShuffleButtonPressed');
  const button = $('#item_choice_shuffle');
  button.enabled = false;
  button.SetHasClass('IsEnable', false);
  button.SetPanelEvent('onmouseover', () => {
    $.DispatchEvent('DOTAShowTextTooltip', button, $.Localize('#item_choice_shuffle_used'));
  });
  const member = GetMember();
  if (member && member.enable) {
    GameEvents.SendCustomGameEventToServer('lottery_refresh_item', {});
  }
}

// Utility functions
function FindDotaHudElement(id) {
  return GetDotaHud().FindChildTraverse(id);
}

function GetDotaHud() {
  var p = $.GetContextPanel();
  while (p !== null && p.id !== 'Hud') {
    p = p.GetParent();
  }
  if (p === null) {
    throw new HudNotFoundException(
      'Could not find Hud root as parent of panel with id: ' + $.GetContextPanel().id,
    );
  } else {
    return p;
  }
}
