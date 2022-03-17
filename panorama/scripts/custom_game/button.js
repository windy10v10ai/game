/**
    DISCLAIMER:
    This file is heavily inspired and based on the open sourced code from Angel Arena Black Star, respecting their Apache-2.0 License.
    Thanks to Angel Arena Black Star.
 */


function LoadPatreonButton() {
	$.Msg("button.js LoadPatreonButton");
    const hContainer = FindDotaHudElement('ButtonBar');
    let sString = 'Support the game on Patreon!';
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
        // LoadDiscordButton();
    });

})();
