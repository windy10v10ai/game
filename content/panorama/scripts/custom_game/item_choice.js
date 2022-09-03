(function () {
	GameEvents.Subscribe("item_choice", SetItemChoice);
})();

function SetItemChoice(keys) {
    $.Msg("ShowItemChoice");
    $.Msg(keys);
	for (var i = 1; i <= 4; i++) {
		$('#item_choice_' + i).itemname = keys[i]
	}

	$.Schedule(1.5, ShowItemChoice);
}

function ShowItemChoice() {
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
