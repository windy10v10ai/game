import {
  GameEndDto,
  GameEndGameOptionsDto,
  GameEndPlayerDto,
} from '../../../api/analytics/dto/game-end-dto';
import { GA4 } from '../../../api/analytics/ga4/ga4';
import { GA4ItemTracker } from '../../../api/analytics/ga4/ga4-item-tracker';
import { GA4PickAbilityTracker } from '../../../api/analytics/ga4/ga4-pick-ability-tracker';
import { ApiClient } from '../../../api/api-client';
import { Game } from '../../../api/game';
import { reloadable } from '../../../utils/tstl-utils';
import { GameConfig } from '../../GameConfig';
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
    Game.EndGame(gameEndDto);
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
    // Pre-collect steamIds to determine real player count for team game check
    const allSteamIds: number[] = [];
    PlayerHelper.ForEachPlayer((playerId) => {
      allSteamIds.push(PlayerResource.GetSteamAccountID(playerId));
    });
    const realPlayerCount = allSteamIds.filter((id) => id > 0).length;
    const isTeamGame = realPlayerCount >= 2;
    print(
      `[GameEnd] realPlayerCount=${realPlayerCount} isTeamGame=${isTeamGame} steamIds=${json.encode(allSteamIds)}`,
    );

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
      const rawBattlePoints = this.CalculatePlayerBattlePoints(
        playerDto,
        difficultyMultiplier,
        winnerTeamId,
      );

      const playerInfo = CustomNetTables.GetTableValue(
        'player_table',
        playerDto.steamId.toString(),
      );
      const conductPoint = playerInfo?.conductPoint ?? 100;
      const conductMultiplier = this.GetConductMultiplier(conductPoint, isTeamGame);
      // 最终积分 = 原始积分 × 行为分倍率（向上取整 0）
      const finalBattlePoints = Math.max(0, Math.round(rawBattlePoints * conductMultiplier));
      // 修正量（用于结算界面括号展示，正=加成 负=惩罚 0=无变化）
      const pointModifier = finalBattlePoints - rawBattlePoints;
      playerDto.battlePoints = finalBattlePoints;
      players.push(playerDto);

      print(
        `[GameEnd] player ${playerId} steamId=${playerDto.steamId} ` +
          `raw=${rawBattlePoints} conductPoint=${conductPoint} ` +
          `multiplier=${conductMultiplier} final=${finalBattlePoints} modifier=${pointModifier}`,
      );

      // 结算界面数据：points 是最终积分，pointModifier 仅用于括号展示
      CustomNetTables.SetTableValue('player_stats', playerId.toString(), {
        steamId: playerDto.steamId.toString(),
        damage: playerDto.damage,
        damagereceived: damageTaken,
        healing: playerDto.healing,
        points: playerDto.battlePoints,
        pointModifier,
        conductPoint,
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

  /**
   * 根据行为分返回积分倍率。非组队局或 80-109 分时返回 1.0（无影响）。
   * ≥110 → 1.1 加成 / 60-79 → 0.8 惩罚 / <60 → 0.5 重惩罚
   */
  static GetConductMultiplier(conductPoint: number, isTeamGame: boolean): number {
    if (!isTeamGame) return 1;
    if (conductPoint >= 110) return 1.1;
    if (conductPoint >= 80) return 1;
    if (conductPoint >= 60) return 0.8;
    return 0.5;
  }

  private static SendAnalyticsEvent(gameEndDto: GameEndDto) {
    // 发送 GA4 游戏结束技能选择事件
    GA4PickAbilityTracker.SendAtGameEnd(gameEndDto);
    // 发送 GA4 物品持有时长事件
    GA4ItemTracker.SendAtGameEnd(gameEndDto);
    // 发送 GA4 匹配时间事件
    GA4.SendGameEndMatchTimeEvents();
  }
}
