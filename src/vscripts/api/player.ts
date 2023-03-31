
import { PropertyController } from "../modifiers/property/property_controller";
import { ApiClient, HttpMethod } from "./api_client";

export class MemberDto {
	steamId!: number;
	enable!: boolean;
	expireDateString!: string;
}

export class PlayerProperty {
	steamId!: number;
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
}


class GameStart {
	members!: MemberDto[];
	players!: PlayerDto[];
}


export class Player {
	public static memberList: MemberDto[] = [];
	public static playerList: PlayerDto[] = [];
	constructor() {
		this.RegisterListener();
		// if (IsInToolsMode()) {
		// 	const developSteamAccountIds = [
		// 		136407523, 1194383041, 143575444, 314757913, 385130282, 967052298, 1159610111, 353885092, 245559423, 916506173];

		// 	for (const steamId of developSteamAccountIds) {
		// 		Player.memberList.push({
		// 			steamId: steamId,
		// 			enable: true,
		// 			expireDateString: "2099-12-31",
		// 		});
		// 	}
		// }
	}

	public Init() {
		CustomNetTables.SetTableValue("loading_status", "loading_status", { status: 1 });
		// get IsValidPlayer player's steamIds
		const steamIds = [];
		for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
			if (PlayerResource.IsValidPlayer(i)) {
				steamIds.push(PlayerResource.GetSteamAccountID(i));
			}
		}
		const matchId = GameRules.Script_GetMatchID().toString();
		const apiParameter = {
			method: HttpMethod.GET,
			path: ApiClient.GAME_START_URL,
			querys: { steamIds: steamIds.join(","), matchId },
			successFunc: this.InitSuccess,
			failureFunc: this.InitFailure,
			retryTimes: 6,
		};

		// Controller初期化
		new PropertyController();

		ApiClient.sendWithRetry(apiParameter);
	}

	private InitSuccess(data: string) {
		print(`[Player] Init callback data ${data}`);
		const gameStart = json.decode(data)[0] as GameStart;
		DeepPrintTable(gameStart);
		Player.memberList = gameStart.members;
		Player.playerList = gameStart.players;

		// set member to member table
		Player.savePlayerToNetTable();
		Player.saveMemberToNetTable();

		const status = Player.playerList.length > 0 ? 2 : 3;
		CustomNetTables.SetTableValue("loading_status", "loading_status", { status });
	}

	private InitFailure(data: string) {
		if (IsInToolsMode()) {
			Player.saveMemberToNetTable();
		}
		CustomNetTables.SetTableValue("loading_status", "loading_status", { status: 3 });
	}


	public InitPlayerProperty(hero: CDOTA_BaseNPC_Hero) {
		print(`[Player] InitPlayerProperty ${hero.GetUnitName()}`);
		if (!hero) {
			return;
		}

		const steamId = PlayerResource.GetSteamAccountID(hero.GetPlayerOwnerID());
		const playerInfo = Player.playerList.find((player) => player.id == steamId.toString());

		if (playerInfo?.properties) {
			for (const property of playerInfo.properties) {
				PropertyController.addModifier(hero, property);
			}
		}
	}

	public static saveMemberToNetTable() {
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

	public static savePlayerToNetTable() {
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

	public RegisterListener() {
		CustomGameEventManager.RegisterListener<{ name: string, level: string }>("player_property_levelup", (_, event) =>
			this.onPlayerPropertyLevelup(event));
	}

	public onPlayerPropertyLevelup(event: { PlayerID: PlayerID, name: string, level: string }) {
		print(`[Player] onPlayerPropertyLevelup ${event.PlayerID} ${event.name} ${event.level}`);
		const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);

		const apiParameter = {
			method: HttpMethod.PUT,
			path: ApiClient.ADD_PLAYER_PROPERTY_URL,
			body: {
				steamId,
				name: event.name,
				level: +event.level,
			},
			successFunc: this.PropertyLevelupSuccess,
			failureFunc: this.PropertyLevelupFailure,
		};

		ApiClient.sendWithRetry(apiParameter);
	}

	private PropertyLevelupSuccess(data: string) {
		print(`[Player] Property Levelup Success data ${data}`);
		const playerProperty = json.decode(data)[0] as PlayerProperty;
		DeepPrintTable(playerProperty);

		PropertyController.RefreshPlayerProperty(playerProperty);

		// 更新 nettable
		const player = Player.playerList.find(p => p.id == playerProperty.steamId.toString());
		if (player) {
			if (!player.properties) {
				player.properties = [];
			}
			const property = player.properties.find(p => p.name == playerProperty.name);
			if (property) {
				property.level = playerProperty.level;
			} else {
				player.properties.push(playerProperty);
			}

			CustomNetTables.SetTableValue("player_table", player.id, player);
		}
	}

	private PropertyLevelupFailure(data: string) {
		print(`[Player] Property Levelup Failure data ${data}`);
		Player.savePlayerToNetTable();
	}
}
