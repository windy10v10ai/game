var imagefile = {
	'npc_dota_hero_meepo': 'file://{images}/heroes/npc_dota_hero_meepo_custom.png',
	'npc_dota_hero_juggernaut': 'file://{images}/heroes/npc_dota_hero_juggernaut_custom.png',
	'npc_dota_hero_techies': 'file://{images}/heroes/npc_dota_hero_techies_custom.png',
	'npc_dota_hero_broodmother': 'file://{images}/heroes/npc_dota_hero_broodmother_custom.png',
	'npc_dota_hero_visage': 'file://{images}/heroes/npc_dota_hero_visage_custom.png',
	'npc_dota_hero_chen': 'file://{images}/heroes/npc_dota_hero_chen_custom.png',
	'npc_dota_hero_pangolier': 'file://{images}/heroes/npc_dota_hero_pangolier_custom.png',
}

function LoopSwapInGameIcons() {
	if (!Game.GameStateIsBefore( DOTA_GameState.DOTA_GAMERULES_STATE_PRE_GAME )) {
		SwapInGameIcons();
	}
	$.Schedule( 0.1, LoopSwapInGameIcons );
}
function LoopSwapPreGameIcons() {
	if (Game.GameStateIsBefore( DOTA_GameState.DOTA_GAMERULES_STATE_TEAM_SHOWCASE )) {
		SwapPreGameIcons();
		$.Schedule( 0.1, LoopSwapPreGameIcons );
	}
}
function LoopSwapSpectatorIcons() {
	if (!Game.GameStateIsBefore( DOTA_GameState.DOTA_GAMERULES_STATE_PRE_GAME )) {
		SwapSpectatorIcons();
	}
	$.Schedule( 0.1, LoopSwapSpectatorIcons );
}

var topmostpanel;

function SwapInGameIcons() {
	SwapTopBarIcons();
	SwapScoreboardIcons();
}

var radianttopbar;
var diretopbar;
function SwapTopBarIcons() {
	if (!topmostpanel) {
		topmostpanel = $.GetContextPanel();
		while( topmostpanel.GetParent()!=null ) {
			topmostpanel = topmostpanel.GetParent();
		}
	}

	if (!radianttopbar) radianttopbar = topmostpanel.FindChildTraverse( 'TopBarRadiantPlayersContainer' );
	if (!diretopbar) diretopbar = topmostpanel.FindChildTraverse( 'TopBarDirePlayersContainer' );

	var heroimages = [];
	heroimages = FindPanels( radianttopbar, 'DOTAHeroImage', heroimages, 0 );
	heroimages = FindPanels( diretopbar, 'DOTAHeroImage', heroimages, 0 );

	for (var i=0; i<heroimages.length; i++) {
		ReplaceIcon( heroimages[i] );
	}
}

var radiantscoreboard;
var direscoreboard;
function SwapScoreboardIcons() {
	if (!topmostpanel) {
		topmostpanel = $.GetContextPanel();
		while( topmostpanel.GetParent()!=null ) {
			topmostpanel = topmostpanel.GetParent();
		}
	}

	if (!radiantscoreboard) radiantscoreboard = topmostpanel.FindChildTraverse( 'RadiantTeamContainer' );
	if (!direscoreboard) direscoreboard = topmostpanel.FindChildTraverse( 'DireTeamContainer' );

	var heroimages = [];
	heroimages = FindPanels( radiantscoreboard, 'DOTAHeroImage', heroimages, 0 );
	heroimages = FindPanels( direscoreboard, 'DOTAHeroImage', heroimages, 0 );
	for (var i=0; i<heroimages.length; i++) {
		ReplaceIcon( heroimages[i] );
	}
}

var radiantpregame;
var direpregame;
function SwapPreGameIcons() {
	if (!topmostpanel) {
		topmostpanel = $.GetContextPanel();
		while( topmostpanel.GetParent()!=null ) {
			topmostpanel = topmostpanel.GetParent();
		}
	}

	if (!radiantpregame) radiantpregame = topmostpanel.FindChildTraverse( 'RadiantTeamPlayers' );
	if (!direpregame) direpregame = topmostpanel.FindChildTraverse( 'DireTeamPlayers' );

	var heroimages = [];
	heroimages = FindPanels( radiantpregame, 'DOTAHeroImage', heroimages, 0 );
	heroimages = FindPanels( direpregame, 'DOTAHeroImage', heroimages, 0 );

	for (var i=0; i<heroimages.length; i++) {
		ReplaceIcon( heroimages[i] );
	}
}

var playerrows;
function SwapSpectatorIcons() {
	if (!topmostpanel) {
		topmostpanel = $.GetContextPanel();
		while( topmostpanel.GetParent()!=null ) {
			topmostpanel = topmostpanel.GetParent();
		}
	}

	if (!playerrows) {
		playerrows = topmostpanel.FindChildTraverse( 'spectator_game_stats' );
		if (!playerrows) return;
		playerrows = playerrows.FindChildTraverse( 'PlayerRows' );
		if (!playerrows) return;
	}

	var heroimages = [];
	heroimages = FindPanels( playerrows, 'DOTAHeroImage', heroimages, 0 );

	for (var i=0; i<heroimages.length; i++) {
		ReplaceIcon( heroimages[i] );
	}
}

function FindPanels( parent, name, ret, level ) {

	if (!parent.Children) return ret;
	var children = parent.Children();
	if (children.length<1) return ret;

	for( var i=0; i<children.length; i++ ) {

		if (children[i].paneltype==name) {
			ret.push( children[i] );
		}

		ret = FindPanels( children[i], name, ret, level + 1 );
	}

	return ret;
}

function ReplaceIcon( heroimage ) {
	var heroname = 'npc_dota_hero_' + heroimage.heroname;

	if (imagefile[heroname]) {
		heroimage.SetImage(imagefile[heroname])
	}



	// var style = heroimage.heroimagestyle;
	//
	// var overlay = heroimage.FindChild( 'HeroImageOverlay' );
	// if ( overlay==null ) {
	// 	overlay = $.CreatePanel('Panel', heroimage, 'HeroImageOverlay');
	// 	overlay.style.width = '100%';
	// 	overlay.style.height = '100%';
	// 	overlay.style.backgroundSize = '100% 100%';
	// 	overlay.heroname = "";
	// }
	//
	// if (heroname!=overlay.heroname && style=='landscape') {
	// 	overlay.heroname = heroname;
	//
	// 	if ( imagefile[heroname] ) {
	// 		overlay.style.backgroundImage = 'url("s2r://panorama/images/heroes/imca_' + 'npc_dota_hero_bane' + '.png")';
	// 		//overlay.style.backgroundImage = 'url("s2r://' + imagefile[heroname] + '")';
	// 		overlay.style.visibility = 'visible';
	// 	} else {
	// 		// hide to default if not available
	// 		overlay.style.visibility = 'collapse';
	// 	}
	// }
}

/////////////////////////////////////
// Replace Hero Icons in chat
var chat;
var playernames;
var chatinit = false;
function InitSwapChatIcons() {
	var players = Game.GetAllPlayerIDs();
	playernames = {};
	for( var i in players ) {
		var p = players[i];
		var name = Players.GetPlayerName( p );
		var hero = Players.GetPlayerSelectedHero( p );
		playernames[name] = hero;
	}
}

// Loops during game to replace chat hero icons
function LoopSwapChatIcons() {
	if (!Game.GameStateIsBefore( DOTA_GameState.DOTA_GAMERULES_STATE_PRE_GAME )) {
		InitSwapChatIcons();
		SwapChatIcons();
	}
	$.Schedule( 0.1, LoopSwapChatIcons );
}

function SwapChatIcons() {
	if (!topmostpanel) {
		topmostpanel = $.GetContextPanel();
		while( topmostpanel.GetParent()!=null ) {
			topmostpanel = topmostpanel.GetParent();
		}
	}

	if (!chat) chat = topmostpanel.FindChildTraverse( 'ChatLinesPanel' );

	var images = [];
	images = FindPanels( chat, 'Image', images, 0 );

	for( var i in images ) {
		var image = images[i];

		if (!image.BHasClass( 'HeroIcon' )) continue;

		if (image.FindChild( 'HeroImageOverlay' )) continue;

		var text = image.GetParent().text.split(':')[0];
		var player;
		for( var j in playernames ) {
			if ( text.indexOf( j ) != -1 ) {
				player = j;
				break;
			}
		}

		if (!player) return;
		var heroname = playernames[player];
		if (imagefile[heroname]) {
			image.SetImage(imagefile[heroname])
		}
		// var overlay = image.FindChild( 'HeroImageOverlay' );
		//
		// if (!overlay) {
		// 	overlay = $.CreatePanel('Panel', image, 'HeroImageOverlay');
		// 	overlay.style.width = '100%';
		// 	overlay.style.height = '100%';
		// 	overlay.style.backgroundSize = '100% 100%';
		// }
		//
		// if ( imagefile[heroname] ) {
		// 	overlay.style.backgroundImage = 'url("s2r://panorama/images/heroes/imca_' + heroname + '.png")'
		// 	overlay.style.visibility = 'visible';
		// } else {
		// 	overlay.style.visibility = 'collapse';
		// }
	}
}

(function() {

	GameEvents.Subscribe( 'game_rules_state_change', function() {
		if (Game.GameStateIsBefore( DOTA_GameState.DOTA_GAMERULES_STATE_PRE_GAME )) return;
		SwapInGameIcons();
		SwapSpectatorIcons();
		SwapChatIcons();
	});

	LoopSwapPreGameIcons();
	LoopSwapInGameIcons();
	LoopSwapSpectatorIcons();
	LoopSwapChatIcons();
})()
