
import { ApiClient, HttpMethod } from "./api_client";

class Player {
	teamId!: number;
	steamId!: number;
	heroName!: string;
}

class GameInfo {
	players!: Player[];
	lostTeamId!: number;
	matchId!: string;
	gameOption!: Object;
	constructor() {
		print("[Game] constructor in TS");
		this.players = [];
	}
}

export class Game {
	constructor() {
	}

	public SendEndGameInfo(lostTeamId: number) {
		const gameInfo = new GameInfo();
		gameInfo.lostTeamId = lostTeamId;
		gameInfo.matchId = GameRules.Script_GetMatchID().toString();
		// @ts-ignore
		const gameOption = CustomNetTables.GetTableValue("game_options_table", "game_option");
		if (gameOption) {
			gameInfo.gameOption = gameOption;
		}

		for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
			if (PlayerResource.IsValidPlayerID(i)) {
				const player = new Player();
				player.teamId = PlayerResource.GetTeam(i);
				player.steamId = PlayerResource.GetSteamAccountID(i);
				player.heroName = PlayerResource.GetSelectedHeroName(i);
				gameInfo.players.push(player);
			}
		}


		ApiClient.sendWithRetry(HttpMethod.POST, "/game/end", null, gameInfo, (data: string) => {
			print(`[Game] end game callback data ${data}`);
		});
	}

}
