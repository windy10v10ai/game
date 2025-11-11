import { Analytics } from '../../../api/analytics/analytics';
import {
  GameEndDto,
  GameEndGameOptionsDto,
  GameEndPlayerDto,
} from '../../../api/analytics/dto/game-end-dto';
import { ItemBuildDto } from '../../../api/analytics/dto/item-build-dto';
import { PickDto } from '../../../api/analytics/dto/pick-ability-dto';
import { GA4 } from '../../../api/analytics/ga4';
import { ApiClient } from '../../../api/api-client';
import { Game } from '../../../api/game';
import { reloadable } from '../../../utils/tstl-utils';
import { GameConfig } from '../../GameConfig';
import { NetTableHelper } from '../../helper/net-table-helper';
import { PlayerHelper } from '../../helper/player-helper';
import { GameEndPoint } from './game-end-point';

@reloadable
export class GameEnd {
  public static gameEndTriggered: boolean = false;

  public static OnGameEnd(winnerTeamId: DotaTeam): void {
    if (this.gameEndTriggered) {
      return;
    }
    this.gameEndTriggered = true;

    print(`[GameEnd] OnGameEnd ${winnerTeamId}`);
    // build game end dto
    const gameEndDto = this.BuildGameEndDto(winnerTeamId);

    // send game end dto
    Game.PostEndGame(gameEndDto);
    CustomNetTables.SetTableValue('ending_status', 'ending_data', { winner_team_id: winnerTeamId });

    this.SendAnalyticsEvent(gameEndDto);
  }

  private static BuildGameEndDto(winnerTeamId: DotaTeam): GameEndDto {
    const gameOptionsData = CustomNetTables.GetTableValue('game_options', 'game_options');
    const difficulty = CustomNetTables.GetTableValue('game_difficulty', 'all')?.difficulty ?? 0;
    const gameOptions: GameEndGameOptionsDto = {
      multiplierRadiant: gameOptionsData.multiplier_radiant,
      multiplierDire: gameOptionsData.multiplier_dire,
      playerNumberRadiant: gameOptionsData.player_number_radiant,
      playerNumberDire: gameOptionsData.player_number_dire,
      towerPowerPct: gameOptionsData.tower_power_pct,
    };

    const gameTime = GameRules.GetGameTime();
    const difficultyMultiplier = GameEndPoint.GetDifficultyMultiplier(
      difficulty,
      ApiClient.IsLocalhost(),
      GameRules.Option,
    );

    const players: GameEndPlayerDto[] = [];
    PlayerHelper.ForEachPlayer((playerId) => {
      const player = PlayerResource.GetPlayer(playerId);
      if (!player) {
        return;
      }
      const hero = player.GetAssignedHero();
      if (!hero) {
        return;
      }

      let damageTaken = 0;
      for (let victimID = 0; victimID < DOTA_MAX_TEAM_PLAYERS; victimID++) {
        if (
          PlayerResource.IsValidPlayerID(victimID) &&
          PlayerResource.IsValidPlayer(victimID) &&
          PlayerResource.GetSelectedHeroEntity(victimID)
        ) {
          if (PlayerResource.GetTeam(victimID) !== PlayerResource.GetTeam(playerId)) {
            damageTaken += PlayerResource.GetDamageDoneToHero(victimID, playerId);
          }
        }
      }

      const playerDto: GameEndPlayerDto = {
        heroName: PlayerResource.GetSelectedHeroName(playerId),
        steamId: PlayerResource.GetSteamAccountID(playerId),
        playerId: playerId,
        teamId: PlayerResource.GetTeam(playerId),
        isDisconnected: PlayerResource.GetConnectionState(playerId) !== ConnectionState.CONNECTED,
        level: PlayerResource.GetLevel(playerId),
        gold: PlayerResource.GetGold(playerId),
        kills: PlayerResource.GetKills(playerId),
        deaths: PlayerResource.GetDeaths(playerId),
        assists: PlayerResource.GetAssists(playerId),
        damage: PlayerResource.GetRawPlayerDamage(playerId),
        damageTaken,
        healing: PlayerResource.GetHealing(playerId),
        lastHits: PlayerResource.GetLastHits(playerId),
        towerKills: PlayerResource.GetTowerKills(playerId),
        score: 0,
        battlePoints: 0,
        facetId: hero.GetHeroFacetID(),
      };
      playerDto.score = GameEndPoint.CalculatePlayerScore(playerDto);
      playerDto.battlePoints = this.CalculatePlayerBattlePoints(
        playerDto,
        difficultyMultiplier,
        winnerTeamId,
      );
      players.push(playerDto);

      // 结算界面数据
      CustomNetTables.SetTableValue('player_stats', playerId.toString(), {
        steamId: playerDto.steamId.toString(),
        damage: playerDto.damage,
        damagereceived: damageTaken,
        healing: playerDto.healing,
        points: playerDto.battlePoints,
        str: hero.GetStrength(),
        agi: hero.GetAgility(),
        int: hero.GetIntellect(false),
        towerKills: playerDto.towerKills,
      });
    });

    const gameEndDto: GameEndDto = {
      isWin: winnerTeamId === DotaTeam.GOODGUYS,
      matchId: GameRules.Script_GetMatchID().toString(),
      version: GameConfig.GAME_VERSION,
      difficulty,
      steamId: 0, // 非玩家单位的事件，固定0
      gameOptions,
      winnerTeamId,
      gameTimeMsec: Math.round(gameTime * 1000),
      countryCode: GA4.countryCode,
      players,
    };

    return gameEndDto;
  }

  static CalculatePlayerBattlePoints(
    player: GameEndPlayerDto,
    difficultyMultiplier: number,
    winnerTeamId: DotaTeam,
  ): number {
    if (player.steamId === 0) {
      // 电脑不获得积分
      return 0;
    }
    const teamKills = PlayerResource.GetTeamKills(player.teamId);
    const timeMultiplier = GameEndPoint.GetParticipationRateMultiplier(player, teamKills);
    const gameTimePoints = GameEndPoint.GetGameTimePoints(GameRules.GetGameTime()) * timeMultiplier;
    const basePoints = player.score + gameTimePoints;
    const points = basePoints * difficultyMultiplier;
    // 输了积分减半
    const winMultiplier = player.teamId === winnerTeamId ? 1 : 0.5;
    // 积分为整数，且不会为负数
    return Math.max(0, Math.round(points * winMultiplier));
  }

  private static SendAnalyticsEvent(gameEndDto: GameEndDto) {
    const isWin = gameEndDto.winnerTeamId === DotaTeam.GOODGUYS;

    // 收集并发送技能选择统计
    const picks = this.CollectAbilityPicks(gameEndDto.players);
    if (picks.length > 0) {
      Analytics.SendGameEndPickAbilitiesEvent({
        matchId: gameEndDto.matchId,
        version: gameEndDto.version,
        difficulty: gameEndDto.difficulty,
        picks,
        isWin,
      });
    }

    // 收集并发送物品出装统计
    // const items = this.CollectItemBuilds(gameEndDto.players);
    // if (items.length > 0) {
    //   Analytics.SendGameEndItemBuildsEvent({
    //     matchId: gameEndDto.matchId,
    //     version: gameEndDto.version,
    //     difficulty: gameEndDto.difficulty,
    //     items,
    //     isWin,
    //   });
    // }

    // 发送 GA4 游戏结束事件（包括匹配时间和玩家性能）
    GA4.SendGameEndEvents(gameEndDto);
  }

  /**
   * 收集玩家的技能选择数据
   */
  private static CollectAbilityPicks(players: GameEndPlayerDto[]): PickDto[] {
    const picks: PickDto[] = [];

    players.forEach((player) => {
      // 只统计真实玩家 (steamId > 0)
      if (player.steamId <= 0) {
        return;
      }

      const steamAccountID = player.steamId.toString();
      const LotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);

      // 收集主动技能选择
      if (LotteryStatus.activeAbilityName) {
        picks.push({
          steamId: player.steamId,
          name: LotteryStatus.activeAbilityName,
          type: 'abilityActive',
          level: LotteryStatus.activeAbilityLevel ?? 0,
        });
      }

      // 收集第一个被动技能选择
      if (LotteryStatus.passiveAbilityName) {
        picks.push({
          steamId: player.steamId,
          name: LotteryStatus.passiveAbilityName,
          type: 'abilityPassive',
          level: LotteryStatus.passiveAbilityLevel ?? 0,
        });
      }

      // 收集第二个被动技能选择
      if (LotteryStatus.passiveAbilityName2) {
        picks.push({
          steamId: player.steamId,
          name: LotteryStatus.passiveAbilityName2,
          type: 'abilityPassive', // 统计时不区分第一和第二被动
          level: LotteryStatus.passiveAbilityLevel2 ?? 0,
        });
      }
    });

    return picks;
  }

  /**
   * 收集玩家的物品出装数据
   */
  private static CollectItemBuilds(players: GameEndPlayerDto[]): ItemBuildDto[] {
    const items: ItemBuildDto[] = [];

    players.forEach((player) => {
      // 只统计真实玩家 (steamId > 0)
      if (player.steamId <= 0) {
        return;
      }

      const hero = PlayerResource.GetSelectedHeroEntity(player.playerId);
      if (!hero) {
        return;
      }

      const itemBuild: ItemBuildDto = {
        steamId: player.steamId,
      };

      // 收集普通物品槽位 (slot 0-5)
      for (let i = 0; i < 6; i++) {
        const item = hero.GetItemInSlot(i);
        if (item) {
          const itemName = item.GetAbilityName();
          // 根据槽位索引设置对应的 slot 字段
          if (i === 0) itemBuild.slot1 = itemName;
          else if (i === 1) itemBuild.slot2 = itemName;
          else if (i === 2) itemBuild.slot3 = itemName;
          else if (i === 3) itemBuild.slot4 = itemName;
          else if (i === 4) itemBuild.slot5 = itemName;
          else if (i === 5) itemBuild.slot6 = itemName;
        }
      }

      // 收集中立物品槽位
      const neutralActiveItem = hero.GetItemInSlot(InventorySlot.NEUTRAL_ACTIVE_SLOT);
      if (neutralActiveItem) {
        itemBuild.neutralActiveSlot = neutralActiveItem.GetAbilityName();
      }

      const neutralPassiveItem = hero.GetItemInSlot(InventorySlot.NEUTRAL_PASSIVE_SLOT);
      if (neutralPassiveItem) {
        itemBuild.neutralPassiveSlot = neutralPassiveItem.GetAbilityName();
      }

      items.push(itemBuild);
    });

    return items;
  }
}
