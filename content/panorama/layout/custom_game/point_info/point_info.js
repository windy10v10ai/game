(function () {
	$.Msg("point_info.js loaded");
	$.Schedule(0.1, OnDataLoaded);
})();

function OnDataLoaded() {

	$('#point_info_container').RemoveAndDeleteChildren();
	const data = CustomNetTables.GetTableValue("point_info", GetSteamAccountID());


	$.Msg("point_info.js OnDataLoaded", data);

	if (data == null) {
		$.Schedule(0.5, OnDataLoaded);
		return;
	}

	for (const index in data) {
		AddPointInfo(data[index]);
	}

	// panel is displayed
	$('#panel_id').style.opacity = '1.0';
	$('#panel_id').style.visibility = 'visible';
}

function AddPointInfo(data) {
	//add panel
	let panel = $.CreatePanel('Panel', $('#point_info_container'), '');
	panel.BLoadLayoutSnippet("PointInfoSnippet");

	// if chains, set panel title to chains
	if ($.Language() == 'schinese') {
		// if data.title.cn contains '<br>' ,split it into two lines
		if (data.title.cn.indexOf('<br>') != -1) {
			let title = data.title.cn.split('<br>');
			panel.SetDialogVariable('point_info_title_text1', title[0]);
			panel.SetDialogVariable('point_info_title_text2', title[1]);
		}else{
			panel.SetDialogVariable('point_info_title_text1', data.title.cn);
			// hide point_info_title_text2
			panel.FindChildTraverse('pointInfoTitle2').style.visibility = 'collapse';
		}
	}else{
		if (data.title.en.indexOf('<br>') != -1) {
			let title = data.title.en.split('<br>');
			panel.SetDialogVariable('point_info_title_text1', title[0]);
			panel.SetDialogVariable('point_info_title_text2', title[1]);
		}else{
			panel.SetDialogVariable('point_info_title_text1', data.title.en);
			// hide point_info_title_text2
			panel.FindChildTraverse('pointInfoTitle2').style.visibility = 'collapse';
		}
	}

	// hide panelPoint if no seasonPoint
	if (data.seasonPoint == null || data.seasonPoint == 0) {
		panel.FindChildTraverse('panelSeasonPoint').style.visibility = 'collapse';
	}else{
		panel.SetDialogVariable('point_info_seasonPoint', data.seasonPoint);
	}
	// hide panelPoint if no memberPoint
	if (data.memberPoint == null || data.memberPoint == 0) {
		panel.FindChildTraverse('panelMemberPointt').style.visibility = 'collapse';
	}else{
		panel.SetDialogVariable('point_info_memberPoint', data.memberPoint);
	}
}

const _ui_RootPanel = $("#panel_id");

function OnClick_CloseView() {
    $.Msg('==>  Popup Pay close: ', _ui_RootPanel.id);

	 // panel is hidden
	_ui_RootPanel.style.opacity = '0.0';
	_ui_RootPanel.style.visibility = 'collapse';
}
