/**
    DISCLAIMER:
    This file is heavily inspired and based on the open sourced code from Angel Arena Black Star, respecting their Apache-2.0 License.
    Thanks to Angel Arena Black Star.
 */


function LoadPatreonButton() {
	$.Msg("button.js LoadPatreonButton");
    const hContainer = FindDotaHudElement('ButtonBar');
    let sString = 'Support the game on Patreon!';
    sString = sString + "<br/>Unlock new heroes, and more benefit!";
    // let sString = bSupporter ? 'Support the game and enjoy Patreon\'s perks!' : '<font color="#ffa1f4">Thank you for your support ♥!</font><br><br>&#9;&#160;&#160;&#160;&#160;&#160;Status: <font color="'+tiers[hStats.donator][1]+'">'+hStats.donator+'</font>';

    if (hContainer){
        let hPatreonButton = hContainer.FindChild('JoinPatreon') || $.CreatePanel('Button', hContainer, 'JoinPatreon')

        hPatreonButton.style.backgroundImage = `url('file://{images}/custom_game/patreon_small.png')`
        hPatreonButton.style.backgroundSize = "100% 100%";

        hPatreonButton.SetPanelEvent('onactivate',() => {
            $.DispatchEvent('ExternalBrowserGoToURL', 'https://www.patreon.com/windy10v10')
        })

        hPatreonButton.SetPanelEvent('onmouseover',() => {
            $.DispatchEvent("DOTAShowTextTooltip", hPatreonButton, sString);
        })

        hPatreonButton.SetPanelEvent('onmouseout',() => {
            $.DispatchEvent("DOTAHideTextTooltip");
        })
    }
}

function LoadAfdianButton() {
	$.Msg("button.js LoadAfdianButton");
    const hContainer = FindDotaHudElement('ButtonBar');
    let sString = '通过爱发电支持我们的游戏！';
    sString = sString + "<br/>订阅会员可解锁新英雄，点击查看更多福利！";

    if (hContainer){
        let hAfdianButton = hContainer.FindChild('JoinAfdian') || $.CreatePanel('Button', hContainer, 'JoinAfdian')

        hAfdianButton.style.backgroundImage = `url('file://{images}/custom_game/afdian.png')`
        hAfdianButton.style.backgroundSize = "100% 100%";

        hAfdianButton.SetPanelEvent('onactivate',() => {
            $.DispatchEvent('ExternalBrowserGoToURL', 'https://afdian.net/@windy10v10')
        })

        hAfdianButton.SetPanelEvent('onmouseover',() => {
            $.DispatchEvent("DOTAShowTextTooltip", hAfdianButton, sString);
        })

        hAfdianButton.SetPanelEvent('onmouseout',() => {
            $.DispatchEvent("DOTAHideTextTooltip");
        })
    }
}

function LoadMemberButton(table, key, gameResult) {
    if (!gameResult || key !== "player_data") {
		return;
	}
    const player = gameResult.players[Game.GetLocalPlayerID()];
    // $.Msg(player);
    if (!player.memberInfo) {
        return;
    }
    $.Msg("button.js LoadMemberButton");


    const hContainer = FindDotaHudElement('ButtonBar');

    if (hContainer){
        let hAfdianButton = hContainer.FindChild('JoinAfdian')
        let hPatreonButton = hContainer.FindChild('JoinPatreon')
        // remove hAfidianButton if hPatreonButton is found
        if (hPatreonButton) {
            hAfdianButton.DeleteAsync(0)
        }
        if (hPatreonButton) {
            hPatreonButton.DeleteAsync(0)
        }

        let hMemberButton = hContainer.FindChild('memberButton') || $.CreatePanel('Button', hContainer, 'memberButton')

        let sString = $.Localize('#player_member_button');
        if (player.memberInfo.enable) {
            hMemberButton.style.backgroundImage = `url('file://{images}/custom_game/golden_crown.png')`
        } else {
            sString = $.Localize('#player_member_button_expire');
            hMemberButton.style.backgroundImage = `url('file://{images}/custom_game/golden_crown_grey.png')`
        }
    	sString = sString.replace("{expireDate}", player.memberInfo.expireDateString);

        hMemberButton.style.backgroundSize = "100% 100%";

        hMemberButton.SetPanelEvent('onactivate',() => {
            $.DispatchEvent('ExternalBrowserGoToURL', 'https://afdian.net/@windy10v10')
        })

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
        LoadPatreonButton();
		LoadAfdianButton();
        CustomNetTables.SubscribeNetTableListener("ending_stats", LoadMemberButton);
        LoadMemberButton(null, "player_data", CustomNetTables.GetTableValue("ending_stats", "player_data"));
    });

})();
