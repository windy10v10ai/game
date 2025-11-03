import { PlayerHelper } from '../modules/helper/player-helper';
import { PropertyController } from '../modules/property/property_controller';
import { ApiClient, HttpMethod } from './api-client';

export enum MemberLevel {
  NORMAL = 1,
  PREMIUM = 2,
}
export class MemberDto {
  steamId!: number;
  enable!: boolean;
  expireDateString!: string;
  level!: MemberLevel;
}

export class PlayerProperty {
  steamId!: number;
  name!: string;
  level!: number;
}
export class PlayerSetting {
  isRememberAbilityKey: boolean;
  activeAbilityKey: string;
  passiveAbilityKey: string;
  passiveAbilityKey2?: string;
  activeAbilityQuickCast: boolean;
  passiveAbilityQuickCast: boolean;
  passiveAbilityQuickCast2?: boolean;
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
  playerSetting: PlayerSetting;
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
  pointInfo!: PointInfoDto[];
}

export class Player {
  // 白名单 SteamID 列表
  private static readonly WHITELIST_STEAM_IDS: Set<number> = new Set([
    116431158, // 替换为实际的 SteamID
    436804590,
    295351477,
    180074451,
    92159660,
    370099556,
    // 添加更多白名单 SteamID
  ]);

  //高玩自然要经历更多的考验，游戏里面每隔15s会发一个暗影裁决+暗影咒灭                     的debuf
  private static readonly GAO_WAN_STEAM_IDS: Set<number> = new Set([
    171404072, 335880293, 121373743, 256116833,
    // 添加更多的 SteamID
  ]);

  public static memberList: MemberDto[] = [];
  public static playerList: PlayerDto[] = [];
  // PointInfoDto
  public static pointInfoList: PointInfoDto[] = [];
  private static playerCount = 0;
  constructor() {
    // 监听JS事件
    // 玩家属性升级
    CustomGameEventManager.RegisterListener<{ name: string; level: string }>(
      'player_property_levelup',
      (_, event) => this.onPlayerPropertyLevelup(event),
    );
    // 玩家属性重置
    CustomGameEventManager.RegisterListener<{ useMemberPoint: number }>(
      'player_property_reset',
      (_, event) => this.onPlayerPropertyReset(event),
    );
    // 发送快捷键设置
    CustomGameEventManager.RegisterListener<SaveBindAbilityKeyEventData>(
      'save_bind_ability_key',
      (_, event) => this.SendBindAbilityKey(event),
    );
  }

  public static GetPlayerCount(): number {
    return Player.playerCount;
  }

  public static LoadPlayerInfo() {
    CustomNetTables.SetTableValue('loading_status', 'loading_status', {
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
      querys: { steamIds: steamIds.join(','), matchId },
      successFunc: this.InitSuccess,
      failureFunc: this.InitFailure,
      retryTimes: 6,
    };

    ApiClient.sendWithRetry(apiParameter);
  }

  private static InitSuccess(data: string) {
    const gameStart = json.decode(data)[0] as GameStart;
    Player.memberList = gameStart.members;
    Player.playerList = gameStart.players;
    Player.pointInfoList = gameStart.pointInfo;

    // set member to member table
    Player.savePlayerToNetTable();
    Player.saveMemberToNetTable();
    Player.savePointInfoToNetTable();

    const status = Player.playerList.length > 0 ? 2 : 3;
    CustomNetTables.SetTableValue('loading_status', 'loading_status', {
      status,
    });
  }

  private static InitFailure(_: string) {
    if (IsInToolsMode()) {
      Player.saveMemberToNetTable();
    }
    CustomNetTables.SetTableValue('loading_status', 'loading_status', {
      status: 3,
    });
  }

  // 英雄出生/升级时，设置玩家属性
  public static SetPlayerProperty(hero: CDOTA_BaseNPC_Hero) {
    if (!hero) {
      return;
    }

    const steamId = PlayerResource.GetSteamAccountID(hero.GetPlayerOwnerID());
    const playerInfo = Player.playerList.find((player) => player.id === steamId.toString());
    // ✅ 为白名单玩家添加克敌机先属性
    if (Player.WHITELIST_STEAM_IDS.has(steamId)) {
      const cannotMissProperty: PlayerProperty = {
        steamId: steamId,
        name: 'property_cannot_miss',
        level: 8,
      };
      PropertyController.LevelupPlayerProperty(cannotMissProperty);
      //print(`[Whitelist] Applied property_cannot_miss level 8 to player ${steamId}`);
    }
    if (playerInfo?.properties) {
      for (const property of playerInfo.properties) {
        PropertyController.LevelupHeroProperty(hero, property);
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
        CustomNetTables.SetTableValue('member_table', steamId.toString(), member);
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
        CustomNetTables.SetTableValue('point_info', steamId.toString(), steamIdPointInfoList);
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
        CustomNetTables.SetTableValue('player_table', steamId.toString(), player);
      }
    });
  }

  public static IsMemberStatic(steamId: number) {
    const member = Player.memberList.find((m) => m.steamId === steamId);
    if (member) {
      return member.enable;
    }
    return false;
  }

  public static GetMemberLevel(steamId: number) {
    const member = Player.memberList.find((m) => m.steamId === steamId);
    // 如果会员不存在，则返回0
    if (!member) {
      return 0;
    }
    // 如果会员失效，则返回0
    if (!member.enable) {
      return 0;
    }
    // 如果会员有效，则返回会员等级
    return member.level;
  }

  public static GetSeasonLevel(steamId: number) {
    const player = Player.playerList.find((p) => p.id === steamId.toString());
    if (player) {
      return player.seasonLevel;
    }
    return 0;
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
    const player = json.decode(data)[0] as PlayerDto;
    DeepPrintTable(player);

    Player.UpsertPlayerData(player);
  }

  private PropertyLevelupFailure(_data: string) {
    // 刷新状态
    // FIXME 有不必要的更新
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

  // 洗点成功
  private PropertyResetSuccess(data: string) {
    print(`[Player] Property Reset Success data ${data}`);
    const player = json.decode(data)[0] as PlayerDto;

    PropertyController.RemoveAllPlayerProperty(Number(player.id));
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
    for (const property of player.properties) {
      PropertyController.LevelupPlayerProperty(property);
    }

    const index = Player.playerList.findIndex((p) => p.id === player.id);
    if (index > -1) {
      Player.playerList[index] = player;
    } else {
      Player.playerList.push(player);
    }
    CustomNetTables.SetTableValue('player_table', player.id, player);
  }

  // 发送快捷键设置
  private SendBindAbilityKey(
    event: NetworkedData<SaveBindAbilityKeyEventData & { PlayerID: PlayerID }>,
  ) {
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);
    const playerSetting: PlayerSetting = {
      isRememberAbilityKey: event.isRememberAbilityKey === 1,
      activeAbilityKey: event.activeAbilityKey,
      passiveAbilityKey: event.passiveAbilityKey,
      activeAbilityQuickCast: event.activeAbilityQuickCast === 1,
      passiveAbilityQuickCast: event.passiveAbilityQuickCast === 1,
    };

    // 只在启用额外被动技能时才包含第二个被动技能快捷键
    if (GameRules.Option.extraPassiveAbilities) {
      playerSetting.passiveAbilityKey2 = event.passiveAbilityKey2;
      playerSetting.passiveAbilityQuickCast2 = event.passiveAbilityQuickCast2 === 1;
    }

    ApiClient.sendWithRetry({
      method: HttpMethod.PUT,
      path: `/player/${steamId}/setting`,
      body: playerSetting,
      successFunc: (data: string) => {
        const playerSetting = json.decode(data)[0] as PlayerSetting;
        // update Player
        const player = Player.playerList.find((p) => p.id === steamId.toString());
        if (player) {
          player.playerSetting = playerSetting;
        }
        Player.savePlayerToNetTable();
      },
    });
  }
}
