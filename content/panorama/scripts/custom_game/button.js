/**
    DISCLAIMER:
    This file is heavily inspired and based on the open sourced code from Angel Arena Black Star, respecting their Apache-2.0 License.
    Thanks to Angel Arena Black Star.
 */

function LoadAfdianButton() {
  $.Msg('button.js LoadAfdianButton');
  const hContainer = FindDotaHudElement('ButtonBar');
  let sString = '通过爱发电支持我们的游戏！';
  sString = sString + '<br/>订阅会员可解锁新英雄，点击查看更多福利！';

  if (hContainer) {
    const hAfdianButton =
      hContainer.FindChild('JoinAfdian') || $.CreatePanel('Button', hContainer, 'JoinAfdian');

    hAfdianButton.style.backgroundImage = `url('file://{images}/custom_game/afdian.png')`;
    hAfdianButton.style.backgroundSize = '100% 100%';

    hAfdianButton.SetPanelEvent('onactivate', () => {
      $.DispatchEvent('ExternalBrowserGoToURL', GetOpenMemberUrl());
    });

    hAfdianButton.SetPanelEvent('onmouseover', () => {
      $.DispatchEvent('DOTAShowTextTooltip', hAfdianButton, sString);
    });

    hAfdianButton.SetPanelEvent('onmouseout', () => {
      $.DispatchEvent('DOTAHideTextTooltip');
    });
  }
}

// function LoadMemberButton(member) {
//   if (!member) {
//     return;
//   }
//   const hContainer = FindDotaHudElement('ButtonBar');

//   if (hContainer) {
//     const hMemberButton =
//       hContainer.FindChild('memberButton') || $.CreatePanel('Button', hContainer, 'memberButton');

//     hMemberButton.SetPanelEvent('onactivate', () => {
//       $.DispatchEvent('ExternalBrowserGoToURL', GetOpenMemberUrl());
//     });

//     let sString = $.Localize('#player_member_button_normal');
//     if (member.enable) {
//       if (member.level === 1) {
//         sString = $.Localize('#player_member_button_normal');
//       } else {
//         sString = $.Localize('#player_member_button_premium');
//       }
//       hMemberButton.style.backgroundImage = `url('file://{images}/custom_game/golden_crown.png')`;
//     } else {
//       sString = $.Localize('#player_member_button_expire');
//       hMemberButton.style.backgroundImage = `url('file://{images}/custom_game/golden_crown_grey.png')`;

//       hMemberButton.style.backgroundSize = '100% 100%';

//       hMemberButton.SetPanelEvent('onmouseout', () => {
//         $.DispatchEvent('DOTAHideTextTooltip');
//       });
//     }
//     sString = sString.replace('{expireDate}', member.expireDateString);

//     hMemberButton.style.backgroundSize = '100% 100%';

//     hMemberButton.SetPanelEvent('onmouseover', () => {
//       $.DispatchEvent('DOTAShowTextTooltip', hMemberButton, sString);
//     });

//     hMemberButton.SetPanelEvent('onmouseout', () => {
//       $.DispatchEvent('DOTAHideTextTooltip');
//     });
//   }
// }

// TODO 迁移到React
function LoadDiscordButton() {
  $.Msg('button.js LoadDiscordButton');
  const hContainer = FindDotaHudElement('ButtonBar');

  if (hContainer) {
    const hDiscordButton =
      hContainer.FindChild('JoinDiscord') || $.CreatePanel('Button', hContainer, 'JoinDiscord');

    hDiscordButton.style.backgroundImage = `url('file://{images}/custom_game/discord.png')`;
    hDiscordButton.style.backgroundSize = '100% 100%';

    hDiscordButton.SetPanelEvent('onactivate', () => {
      $.DispatchEvent('ExternalBrowserGoToURL', 'https://discord.gg/PhXyPfCQg5');
    });

    hDiscordButton.SetPanelEvent('onmouseover', () => {
      $.DispatchEvent(
        'DOTAShowTextTooltip',
        hDiscordButton,
        'Come chat with the community on Discord!',
      );
    });

    hDiscordButton.SetPanelEvent('onmouseout', () => {
      $.DispatchEvent('DOTAHideTextTooltip');
    });
  }
}

(function () {
  $.Msg('button.js loaded');

  // $.Schedule(1, () => {
  //   LoadMemberButton(CustomNetTables.GetTableValue('member_table', GetSteamAccountID()));
  // });
})();
