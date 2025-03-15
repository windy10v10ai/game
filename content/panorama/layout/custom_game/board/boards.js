//var OnLeaderboard = false;
function AddPlayer(rank, id) {
  //add panel
  const panel = $.CreatePanel('Panel', $('#Players'), '');
  panel.BLoadLayoutSnippet('Player');
  //var playerInfo = Game.GetPlayerInfo(0);
  panel.SetDialogVariable('PlayerRank', rank);
  panel.FindChildTraverse('PlayerImageDisplay').accountid = id;

  panel.FindChildTraverse('PlayerNameDisplay').accountid = id;

  // panel.SetDialogVariable('PlayerPoint', Math.floor(points));
  // panel.SetDialogVariable('PlayerWin', win);
  // panel.SetDialogVariable('PlayerLoss', loss);
}

/**
 * 添加排行榜按钮
 */
function AddLbButton() {
  const container = $.GetContextPanel()
    .GetParent()
    .GetParent()
    .GetParent()
    .FindChildTraverse('ButtonBar');

  if (container) {
    const button = container.FindChild('MainLB') || $.CreatePanel('Button', container, 'MainLB');
    button.style.backgroundImage = `url('file://{images}/trophy.png')`;
    button.style.backgroundSize = '100% 100%';
    button.className = 'MainLB';
    button.SetPanelEvent('onactivate', () => {
      ToggleLB();
    });

    button.SetPanelEvent('onmouseover', () => {
      $.DispatchEvent('DOTAShowTextTooltip', button, $.Localize('#leaderboard_title'));
    });

    button.SetPanelEvent('onmouseout', () => {
      $.DispatchEvent('DOTAHideTextTooltip');
    });
  }
}

function ToggleLB() {
  const state = $('#BoardContainer');
  if (state.style.opacity === '0.0' || state.style.opacity == null) {
    Game.EmitSound('ui.match_open');
    state.style.transitionDuration = '0s';
    state.style.transform = 'translateX(-400px) translateY(-150px)';
    state.style.visibility = 'visible';
    state.style.transitionDuration = '0.4s';
    state.style.opacity = '1.0';
    state.style.transform = 'none';
  } else {
    Game.EmitSound('ui.match_close');
    state.style.transitionDuration = '0.25s';
    state.style.opacity = '0.0';
    state.style.transform = 'translateX(200px) translateY(150px)';
    $.Schedule(0.25, CollapseLB);
  }
}

function CollapseLB() {
  $('#BoardContainer').style.visibility = 'collapse';
}

function AddCurrentPlayerRank(rank, id) {
  $('#CurrentPlayer').RemoveAndDeleteChildren();
  // 在新创建的面板中添加当前玩家信息
  const panel = $.CreatePanel('Panel', $('#CurrentPlayer'), '');
  panel.BLoadLayoutSnippet('Player');
  panel.AddClass('CurrentPlayerPanel');

  if (rank) {
    panel.SetDialogVariable('PlayerRank', rank);
  } else {
    panel.SetDialogVariable('PlayerRank', 'N/A');
  }
  panel.FindChildTraverse('PlayerImageDisplay').accountid = id;
  panel.FindChildTraverse('PlayerNameDisplay').accountid = id;
}

function OnDataLoaded() {
  const topSteamIds = CustomNetTables.GetTableValue('ranking_table', 'topSteamIds');

  if (topSteamIds == null) {
    $.Schedule(0.5, OnDataLoaded);
    return;
  }
  $.Schedule(0.5, AddLbButton);

  let currentPlayerRank = undefined;
  $('#Players').RemoveAndDeleteChildren();
  for (const index in topSteamIds) {
    // 显示前500名玩家
    if (index <= 500) {
      AddPlayer(index, topSteamIds[index]);
    }
    // 获取当前玩家排名
    if (topSteamIds[index] === GetSteamAccountID()) {
      currentPlayerRank = index;
    }
  }
  // 每日排名未更新，但是玩家分数超过1000名时显示500+
  if (!currentPlayerRank) {
    currentPlayerRank = '500+';
  }

  // 如果玩家分数比前1000名玩家低，则显示1000+, 以此类推
  const playerScore = GetPlayer()?.seasonPointTotal || 0;
  const rankScores = CustomNetTables.GetTableValue('ranking_table', 'rankScores');
  if (playerScore < rankScores?.top1000) {
    currentPlayerRank = '1000+';
  }
  if (playerScore < rankScores?.top2000) {
    currentPlayerRank = '2000+';
  }
  if (playerScore < rankScores?.top3000) {
    currentPlayerRank = '3000+';
  }
  if (playerScore < rankScores?.top4000) {
    currentPlayerRank = '4000+';
  }
  if (playerScore < rankScores?.top5000) {
    currentPlayerRank = '5000+';
  }

  AddCurrentPlayerRank(currentPlayerRank, GetSteamAccountID());
}

(function () {
  $.Schedule(0.1, LeaderboardSetup);
})();

function LeaderboardSetup() {
  if (Game.GetState() >= 7) {
    $.Schedule(0.5, OnDataLoaded);
  } else {
    $.Schedule(0.1, LeaderboardSetup);
  }
}
