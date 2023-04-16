

//var OnLeaderboard = false;
function AddPlayer(rank, id){
	//add panel
	let panel = $.CreatePanel('Panel', $('#Players'),'');
	panel.BLoadLayoutSnippet("Player");
	//var playerInfo = Game.GetPlayerInfo(0);
	panel.SetDialogVariable('PlayerRank', rank);
	panel.FindChildTraverse("PlayerImageDisplay").accountid = id;

	panel.FindChildTraverse("PlayerNameDisplay").accountid = id;

	// panel.SetDialogVariable('PlayerPoint', Math.floor(points));
	// panel.SetDialogVariable('PlayerWin', win);
	// panel.SetDialogVariable('PlayerLoss', loss);

}
//AddLbButton()
function AddLbButton(){
	const container = $.GetContextPanel().GetParent().GetParent().GetParent().FindChildTraverse('ButtonBar')

	if (container){
		let button = container.FindChild('MainLB') || $.CreatePanel('Button',container,'MainLB')
		button.style.backgroundImage = `url('file://{images}/trophy.png')`
		button.style.backgroundSize = "100% 100%";
		button.className = "MainLB";
		button.SetPanelEvent('onactivate',() => {
			ToggleLB();
		})

		button.SetPanelEvent('onmouseover',() => {
			$.DispatchEvent("DOTAShowTextTooltip", button, $.Localize('#leaderboard_title'));
		})

		button.SetPanelEvent('onmouseout',() => {
			$.DispatchEvent("DOTAHideTextTooltip");
		})
	}
}

function ToggleLB(){
	let state = $('#BoardContainer');
	if (state.style.opacity == '0.0' || state.style.opacity == null){
		Game.EmitSound( "ui.match_open" );
		state.style.transitionDuration = '0s';
		state.style.transform = 'translateX(-400px) translateY(-150px)';
		state.style.visibility = "visible";
		state.style.transitionDuration = '0.4s';
		state.style.opacity = '1.0';
		state.style.transform = 'none';
	}
	else{
		Game.EmitSound( "ui.match_close" );
		state.style.transitionDuration = '0.25s';
		state.style.opacity = '0.0';
		state.style.transform = 'translateX(200px) translateY(150px)';
		$.Schedule(0.25, CollapseLB);
	}
}

function CollapseLB() {
	$('#BoardContainer').style.visibility = "collapse";
}

function OnDataLoaded() {
	const data = CustomNetTables.GetTableValue("leader_board", "top100SteamIds");

	if (data == null) {
		$.Schedule(0.5, OnDataLoaded);
		return;
	}
	$.Schedule(0.5, AddLbButton);

	for (const index in data) {
		AddPlayer(index,data[index]);
	}
}



(function() {
	// CustomNetTables.SubscribeNetTableListener("leader_board", OnDataLoaded);
	$.Schedule(0.1, LeaderboardSetup);
})();

function LeaderboardSetup() {
    if (Game.GetState() >= 7) {
        $.Schedule(0.5, OnDataLoaded);
    }
    else {
        $.Schedule(0.1, LeaderboardSetup);
    }
}
