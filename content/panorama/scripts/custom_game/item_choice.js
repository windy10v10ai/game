(function () {
	$.Msg("item_choice.js loaded");
	GameEvents.Subscribe("item_choice", SetItemChoice);
	const member = GetMember();
	const button = $("#item_choice_shuffle");
	if (member && member.enable) {
		button.SetHasClass("IsEnable", true);
		button.SetPanelEvent('onactivate', OnShuffleButtonPressed);
        button.SetPanelEvent('onmouseover',() => {
            $.DispatchEvent("DOTAShowTextTooltip", button, $.Localize('#item_choice_shuffle'));
        })
	} else {
		button.SetPanelEvent('onactivate',() => {
            $.DispatchEvent('ExternalBrowserGoToURL', GetOpenMemberUrl());
        })
        button.SetPanelEvent('onmouseover',() => {
            $.DispatchEvent("DOTAShowTextTooltip", button, $.Localize('#item_choice_shuffle_not_member'));
        })
	}
	button.SetPanelEvent('onmouseout',() => {
		$.DispatchEvent("DOTAHideTextTooltip");
	})
})();

var loadDelayTime = 1;
function SetItemChoice(keys) {
	$.Schedule(loadDelayTime, () => ShowItemChoice(keys));
	loadDelayTime = 0;
}

function ShowItemChoice(keys) {
    $.Msg("ShowItemChoice");
	for (var i = 1; i <= 4; i++) {
		$('#item_choice_' + i).itemname = keys[i]
	}
	$('#remaining_time').value = 300;
	$('#item_choice_container').style.visibility = 'visible';
	$.Schedule(0.03, TickItemTime);
}

function TickItemTime() {
	if ($('#item_choice_container').style.visibility == 'visible') {

		$('#remaining_time').value = $('#remaining_time').value - 1;

		if ($('#remaining_time').value <= 0) {
			MakeItemChoice( Math.floor(Math.random() * 3) + 1)
		} else {
			$('#remaining_time').style.width = ($('#remaining_time').value / 3) + '%';
			$.Schedule(0.03, TickItemTime);
		}
	}
}

function MakeItemChoice(slot) {
	var item = $('#item_choice_' + slot).itemname
	var owner_index = Players.GetPlayerHeroEntityIndex(Players.GetLocalPlayer())

	GameEvents.SendCustomGameEventToServer("item_choice_made", {owner_entindex: owner_index, item: item});

	$('#remaining_time').value = 300;
	$('#remaining_time').style.width = '100%';
	$('#item_choice_container').style.visibility = 'collapse';
}

function OnShuffleButtonPressed() {
	$.Msg("OnShuffleButtonPressed");
	const button = $("#item_choice_shuffle");
	button.enabled = false;
	button.SetHasClass("IsEnable", false);
	button.SetPanelEvent('onmouseover',() => {
		$.DispatchEvent("DOTAShowTextTooltip", button, $.Localize('#item_choice_shuffle_used'));
	})
	const member = GetMember();
	if (member && member.enable) {
		GameEvents.SendCustomGameEventToServer("item_choice_shuffle", {});
	}
}

// Utility functions
function FindDotaHudElement (id) {
	return GetDotaHud().FindChildTraverse(id);
}

function GetDotaHud () {
	var p = $.GetContextPanel();
	while (p !== null && p.id !== 'Hud') {
		p = p.GetParent();
	}
	if (p === null) {
		throw new HudNotFoundException('Could not find Hud root as parent of panel with id: ' + $.GetContextPanel().id);
	} else {
		return p;
	}
}
