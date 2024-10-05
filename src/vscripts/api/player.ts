import { PlayerHelper } from "../helper/player-helper";
import { PropertyController } from "../modules/property/property_controller";
import { ApiClient, HttpMethod } from "./api-client";

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

  totalLevel: number;
  useableLevel: number;
  properties: PlayerProperty[];
}
export class PointInfoDto {
  steamId!: number;
  title!: {
    cn: string;
    en: string;
  };

  seasonPoint?: number;
  memberPoint?: number;
}

class GameStart {
  members!: MemberDto[];
  players!: PlayerDto[];
  top100SteamIds!: string[];
  pointInfo!: PointInfoDto[];
}

export class Player {
  public static memberList: MemberDto[] = [];
  public static playerList: PlayerDto[] = [];
  // PointInfoDto
  public static pointInfoList: PointInfoDto[] = [];
  private static playerCount = 0;
  constructor() {
    this.RegisterListener();
  }

  public static GetPlayerCount(): number {
    return Player.playerCount;
  }

  public static LoadPlayerInfo() {
    CustomNetTables.SetTableValue("loading_status", "loading_status", {
      status: 1,
    });
    // get IsValidPlayer player's steamIds
    const steamIds: number[] = [];
    let playerCount = 0;
    PlayerHelper.ForEachPlayer((playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      steamIds.push(steamId);
      playerCount++;
    });
    Player.playerCount = playerCount;

    const matchId = GameRules.Script_GetMatchID().toString();
    const apiParameter = {
      method: HttpMethod.GET,
      path: ApiClient.GAME_START_URL,
      querys: { steamIds: steamIds.join(","), matchId },
      successFunc: this.InitSuccess,
      failureFunc: this.InitFailure,
      retryTimes: 6,
    };

    ApiClient.sendWithRetry(apiParameter);
  }

  private static InitSuccess(data: string) {
    print(`[Player] Init callback data ${data}`);
    const gameStart = json.decode(data)[0] as GameStart;
    DeepPrintTable(gameStart);
    Player.memberList = gameStart.members;
    Player.playerList = gameStart.players;
    Player.pointInfoList = gameStart.pointInfo;
    const top100SteamIds = gameStart.top100SteamIds;

    CustomNetTables.SetTableValue("leader_board", "top100SteamIds", top100SteamIds);

    // set member to member table
    Player.savePlayerToNetTable();
    Player.saveMemberToNetTable();
    // set point info to point info table
    Player.savePointInfoToNetTable();

    const status = Player.playerList.length > 0 ? 2 : 3;
    CustomNetTables.SetTableValue("loading_status", "loading_status", {
      status,
    });
  }

  private static InitFailure(_: string) {
    if (IsInToolsMode()) {
      Player.saveMemberToNetTable();
    }
    CustomNetTables.SetTableValue("loading_status", "loading_status", {
      status: 3,
    });
  }

  public static SetPlayerProperty(hero: CDOTA_BaseNPC_Hero) {
    print(`[Player] SetPlayerProperty ${hero.GetUnitName()}`);
    if (!hero) {
      return;
    }

    const steamId = PlayerResource.GetSteamAccountID(hero.GetPlayerOwnerID());
    const playerInfo = Player.playerList.find((player) => player.id === steamId.toString());

    if (playerInfo?.properties) {
      for (const property of playerInfo.properties) {
        PropertyController.setModifier(hero, property);
      }
    }
  }

  public static saveMemberToNetTable() {
    PlayerHelper.ForEachPlayer((playerId) => {
      // 32bit steamId
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      const member = Player.memberList.find((m) => m.steamId === steamId);
      if (member) {
        // set key as short dotaId
        CustomNetTables.SetTableValue("member_table", steamId.toString(), member);
      }
    });
  }

  public static savePointInfoToNetTable() {
    PlayerHelper.ForEachPlayer((playerId) => {
      // 32bit steamId
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      const steamIdPointInfoList = Player.pointInfoList.filter((p) => p.steamId === steamId);
      if (steamIdPointInfoList.length > 0) {
        // set key as short dotaId
        CustomNetTables.SetTableValue("point_info", steamId.toString(), steamIdPointInfoList);
      }
    });
  }

  public static savePlayerToNetTable() {
    PlayerHelper.ForEachPlayer((playerId) => {
      // 32bit steamId
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      const player = Player.playerList.find((p) => p.id === steamId.toString());
      if (player) {
        // set key as short dotaId
        CustomNetTables.SetTableValue("player_table", steamId.toString(), player);
      }
    });
  }

  // FIXME 移除lua中的调用
  public IsMember(steamId: number) {
    const member = Player.memberList.find((m) => m.steamId === steamId);
    if (member) {
      return member.enable;
    }
    return false;
  }

  public static IsMemberStatic(steamId: number) {
    const member = Player.memberList.find((m) => m.steamId === steamId);
    if (member) {
      return member.enable;
    }
    return false;
  }

  public GetMember(steamId: number) {
    const member = Player.memberList.find((m) => m.steamId === steamId);
    if (member) {
      return member;
    }
    return null;
  }

  // 监听JS事件
  public RegisterListener() {
    // 玩家属性升级
    CustomGameEventManager.RegisterListener<{ name: string; level: string }>(
      "player_property_levelup",
      (_, event) => this.onPlayerPropertyLevelup(event),
    );
    // 玩家属性重置
    CustomGameEventManager.RegisterListener<{ useMemberPoint: number }>(
      "player_property_reset",
      (_, event) => this.onPlayerPropertyReset(event),
    );
  }

  public onPlayerPropertyLevelup(event: { PlayerID: PlayerID; name: string; level: string }) {
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
    const player = json.decode(data)[0] as PlayerDto;
    DeepPrintTable(player);

    Player.UpsertPlayerData(player);
  }

  private PropertyLevelupFailure(data: string) {
    print(`[Player] Property Levelup Failure data ${data}`);
    Player.savePlayerToNetTable();
  }

  // 初始化属性，洗点
  public onPlayerPropertyReset(event: { PlayerID: PlayerID; useMemberPoint: number }) {
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);

    const apiParameter = {
      method: HttpMethod.POST,
      path: ApiClient.RESET_PLAYER_PROPERTY_URL,
      body: {
        steamId,
        useMemberPoint: event.useMemberPoint,
      },
      successFunc: this.PropertyResetSuccess,
      failureFunc: this.PropertyResetFailure,
    };

    ApiClient.sendWithRetry(apiParameter);
  }

  private PropertyResetSuccess(data: string) {
    print(`[Player] Property Reset Success data ${data}`);
    const player = json.decode(data)[0] as PlayerDto;
    DeepPrintTable(player);

    Player.UpsertPlayerData(player);
  }

  private PropertyResetFailure(data: string) {
    print(`[Player] Property Reset Failure data ${data}`);
    Player.savePlayerToNetTable();
  }

  /**
   * 更新玩家数据，属性，nettable
   */
  private static UpsertPlayerData(player: PlayerDto) {
    PropertyController.ResetPlayerProperty(Number(player.id));
    for (const property of player.properties) {
      PropertyController.RefreshPlayerProperty(property);
    }

    const index = Player.playerList.findIndex((p) => p.id === player.id);
    if (index > -1) {
      Player.playerList[index] = player;
    } else {
      Player.playerList.push(player);
    }
    CustomNetTables.SetTableValue("player_table", player.id, player);
  }
}
