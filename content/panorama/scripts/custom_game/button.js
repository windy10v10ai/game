/**
    DISCLAIMER:
    This file is heavily inspired and based on the open sourced code from Angel Arena Black Star, respecting their Apache-2.0 License.
    Thanks to Angel Arena Black Star.
 */

function LoadMemberButton(member) {
    if (!member) {
		return;
	}
    const hContainer = FindDotaHudElement('ButtonBar');

    if (hContainer){
        // let hAfdianButton = hContainer.FindChild('JoinAfdian')
        // let hPatreonButton = hContainer.FindChild('JoinPatreon')
        // remove hAfidianButton if hPatreonButton is found
        // if (hAfdianButton) {
        //     hAfdianButton.DeleteAsync(0)
        // }
        // if (hPatreonButton) {
        //     hPatreonButton.DeleteAsync(0)
        // }

        let hMemberButton = hContainer.FindChild('memberButton') || $.CreatePanel('Button', hContainer, 'memberButton')

        let sString = $.Localize('#player_member_button');
        if (member.enable) {
            hMemberButton.style.backgroundImage = `url('file://{images}/custom_game/golden_crown.png')`
        } else {
            sString = $.Localize('#player_member_button_expire');
            hMemberButton.style.backgroundImage = `url('file://{images}/custom_game/golden_crown_grey.png')`
        }
    	sString = sString.replace("{expireDate}", member.expireDateString);

        hMemberButton.style.backgroundSize = "100% 100%";

        hMemberButton.SetPanelEvent('onmouseover',() => {
            $.DispatchEvent("DOTAShowTextTooltip", hMemberButton, sString);
        })

        hMemberButton.SetPanelEvent('onmouseout',() => {
            $.DispatchEvent("DOTAHideTextTooltip");
        })
    }
}

function LoadDiscordButton() {
	$.Msg("button.js LoadDiscordButton");
    const hContainer = FindDotaHudElement('ButtonBar');

    if (hContainer){
        let hDiscordButton = hContainer.FindChild('JoinDiscord') || $.CreatePanel('Button', hContainer, 'JoinDiscord')

        hDiscordButton.style.backgroundImage = `url('file://{images}/custom_game/discord.png')`
        hDiscordButton.style.backgroundSize = "100% 100%";

        hDiscordButton.SetPanelEvent('onactivate',() => {
            $.DispatchEvent('ExternalBrowserGoToURL', 'https://discord.gg/PhXyPfCQg5')
        })

        hDiscordButton.SetPanelEvent('onmouseover',() => {
            $.DispatchEvent("DOTAShowTextTooltip", hDiscordButton, 'Come chat with the community on Discord!');
        })

        hDiscordButton.SetPanelEvent('onmouseout',() => {
            $.DispatchEvent("DOTAHideTextTooltip");
        })
    }
}


(function() {
	$.Msg("button.js loaded");

    $.Schedule(1, () => {
        LoadMemberButton(CustomNetTables.GetTableValue("member_table", GetSteamAccountID()));
    });
})();
