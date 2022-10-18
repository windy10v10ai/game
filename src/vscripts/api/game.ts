
import { ApiClient, HttpMethod } from "./api_client";

class Player {
	teamId!: number;
	steamId!: number;
	heroName!: string;
	points!: number;
}

class GameInfo {
	players!: Player[];
	winnerTeamId!: number;
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

	public SendEndGameInfo(endData: any) {
		const gameInfo = new GameInfo();
		gameInfo.winnerTeamId = endData.winnerTeamId;
		gameInfo.matchId = GameRules.Script_GetMatchID().toString();

		gameInfo.gameOption = endData.gameOption;

		for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
			if (PlayerResource.IsValidPlayerID(i)) {
				const player = new Player();
				player.teamId = PlayerResource.GetTeam(i);
				player.steamId = PlayerResource.GetSteamAccountID(i);
				player.heroName = PlayerResource.GetSelectedHeroName(i);
				player.points = endData.players[i]?.points;
				gameInfo.players.push(player);
			}
		}


		ApiClient.sendWithRetry(HttpMethod.POST, "/game/end", null, gameInfo, (data: string) => {
			print(`[Game] end game callback data ${data}`);
		});
	}

}
