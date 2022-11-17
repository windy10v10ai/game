
import { ApiClient, HttpMethod } from "./api_client";

class MemberDto {
	steamId!: number;
	enable!: boolean;
	expireDateString!: string;
}

export class PlayerProperty {
	name!: string;
	level!: number;
}

export class PlayerDto {
	id!: string;
	matchCount!: number;
	winCount!: number;
	disconnectCount!: number;
	seasonPointTotal!: number;
	seasonLevel!: number;
	seasonCurrrentLevelPoint!: number;
	seasonNextLevelPoint!: number;


	memberPointTotal!: number;
	memberLevel!: number;
	memberCurrentLevelPoint!: number;
	memberNextLevelPoint!: number;
	properties?: PlayerProperty[];
	propertyTotalLevels?: number;
}


class GameStart {
	members!: MemberDto[];
	players!: PlayerDto[];
}


declare global {
	interface CustomNetTableDeclarations {
		loading_status: {
			loading_status: any;
		};
		member_table: {
			[steamId: string]: MemberDto;
		};
		player_table: {
			[steamId: string]: PlayerDto;
		};
	}
}

export class Player {
	public static memberList: MemberDto[] = [];
	public static playerList: PlayerDto[] = [];
	private static GAME_START_URL = "/game/start";
	constructor() {
		if (IsInToolsMode()) {
			const developSteamAccountIds = [
				136407523, 1194383041, 143575444, 314757913, 385130282, 967052298, 1159610111, 353885092, 245559423, 916506173];

			for (const steamId of developSteamAccountIds) {
				Player.memberList.push({
					steamId: steamId,
					enable: true,
					expireDateString: "2099-12-31",
				});
			}
		}
	}

	public Init() {
		if (IsInToolsMode()) {
			this.saveMemberToNetTable();
		}

		CustomNetTables.SetTableValue("loading_status", "loading_status", { status: 1 });
		// get IsValidPlayer player's steamIds
		const steamIds = [];
		for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
			if (PlayerResource.IsValidPlayer(i)) {
				steamIds.push(PlayerResource.GetSteamAccountID(i));
			}
		}
		const matchId = GameRules.Script_GetMatchID().toString();
		ApiClient.sendWithRetry(HttpMethod.GET, Player.GAME_START_URL, { steamIds: steamIds.join(","), matchId }, null, (data: string) => {

			print(`[Player] Init callback data ${data}`);
			const gameStart = json.decode(data)[0] as GameStart;
			DeepPrintTable(gameStart);
			Player.memberList = gameStart.members;
			Player.playerList = gameStart.players;

			// set member to member table
			this.saveMemberToNetTable();
			this.savePlayerToNetTable();

			const status = Player.playerList.length > 0 ? 2 : 3;
			CustomNetTables.SetTableValue("loading_status", "loading_status", { status });
		});
	}

	private saveMemberToNetTable() {
		for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
			if (PlayerResource.IsValidPlayer(i)) {
				// 32bit steamId
				const steamId = PlayerResource.GetSteamAccountID(i);
				const member = Player.memberList.find(m => m.steamId == steamId);
				if (member) {
					// set key as short dotaId
					CustomNetTables.SetTableValue("member_table", steamId.toString(), member);
				}
			}
		}
	}

	private savePlayerToNetTable() {
		for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
			if (PlayerResource.IsValidPlayer(i)) {
				// 32bit steamId
				const steamId = PlayerResource.GetSteamAccountID(i);
				const player = Player.playerList.find(p => p.id == steamId.toString());
				if (player) {
					// set key as short dotaId
					CustomNetTables.SetTableValue("player_table", steamId.toString(), player);
				}
			}
		}
	}
	public IsMember(steamId: number) {
		const member = Player.memberList.find(m => m.steamId == steamId);
		if (member) {
			return member.enable;
		}
		return false;
	}

	public GetMember(steamId: number) {
		const member = Player.memberList.find(m => m.steamId == steamId);
		if (member) {
			return member;
		}
		return null;
	}
}
