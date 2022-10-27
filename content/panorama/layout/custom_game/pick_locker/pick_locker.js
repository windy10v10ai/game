const memberHeroNames = [
	"brewmaster",
	"chen",
	"phantom_lancer",
]

const localized_text = [
	$.Localize("#DOTA_Hero_Selection_LOCKIN"),
	$.Localize("#pick_button_member_text"),
];

const interval = 0.1;

const custom_random_button = $.GetContextPanel().FindChildTraverse("CustomRandomButton")
const random_button = FindDotaHudElement("RandomButton");
let random_pressed = false;
// const member = GetMember();
const member = undefined;

(() => {
	// random_button.visible = false;
	custom_random_button.visible = true;
	// custom_random_button.SetParent(random_button.GetParent());
	PickLockerLoop();
})();


function PickLockerLoop() {
	if (Game.GameStateIsBefore( DOTA_GameState.DOTA_GAMERULES_STATE_PRE_GAME )) {
		$.Schedule( interval, PickLocker );
	}
}

function PickRandomHero() {
	$.Msg("Random hero pressed");
	// discard random requests if we've already pressed that or have hero selected
	if (random_pressed || Players.GetSelectedHeroID(Players.GetLocalPlayer()) != -1) return;
	random_pressed = true;
	// GameEvents.SendCustomGameEventToServer("pick_random_hero", {});
}

function PickLocker() {
	if (member && member.enable) {
		$.Msg("Is Member");
		return;
	} else {
		$.Msg("Not Member");

		const possible_hero_selection =  Game.GetLocalPlayerInfo().possible_hero_selection;
		const pick_button = FindDotaHudElement("LockInButton");
		// if memberHeroNames contains possible_hero_selection
		if (memberHeroNames.includes(possible_hero_selection)) {
			$.Msg("Lock Member hero Pick");
			$.Msg(localized_text[0]);

			pick_button.enabled = false;
			pick_button.SetAcceptsFocus(false);
			pick_button.BAcceptsInput(false);
			pick_button.style.saturation = 0.0;
			pick_button.style.brightness = 0.2;

			let label = pick_button.GetChild(0);
			// label.style.width = "95%";
			// label.style.height = "25px";
			// label.style.horizontalAlign = "left";
			// label.style.textOverflow = "shrink";
			label.text = localized_text[1];
		} else {
			$.Msg("Unlocak hero Pick");
			pick_button.enabled = true;
			pick_button.SetAcceptsFocus(true);
			pick_button.BAcceptsInput(true);
			pick_button.style.saturation = null;
			pick_button.style.brightness = null;

			let label = pick_button.GetChild(0);
			label.text = localized_text[0];
		}


	}
	PickLockerLoop();
}
