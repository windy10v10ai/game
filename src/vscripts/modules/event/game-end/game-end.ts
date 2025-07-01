import { Analytics } from '../../../api/analytics/analytics';
import {
  GameEndDto,
  GameEndGameOptionsDto,
  GameEndPlayerDto,
} from '../../../api/analytics/dto/game-end-dto';
import { ApiClient } from '../../../api/api-client';
import { Game } from '../../../api/game';
import { reloadable } from '../../../utils/tstl-utils';
import { GameConfig } from '../../GameConfig';
import { NetTableHelper } from '../../helper/net-table-helper';
import { PlayerHelper } from '../../helper/player-helper';
import { GameEndPoint } from './game-end-point';

@reloadable
export class GameEnd {
  private static gameEndTriggered: boolean = false;

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
      const player = PlayerResource.GetPlaye(playerId);
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
      matchId: GameRules.Script_GetMatchID().toString(),
      version: GameConfig.GAME_VERSION,
      difficulty,
      steamId: 0, // 非玩家单位的事件，固定0
      gameOptions,
      winnerTeamId,
      gameTimeMsec: Math.round(gameTime * 1000),
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
    gameEndDto.players.forEach((player) => {
      if (player.steamId > 0) {
        const steamAccountID = player.steamId.toString();
        const LotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
        const activeAbilityName = LotteryStatus.activeAbilityName;
        const passiveAbilityName = LotteryStatus.passiveAbilityName;

        // SendGameEndPickAbilityEvent
        if (activeAbilityName) {
          Analytics.SendGameEndPickAbilityEvent({
            steamId: player.steamId,
            matchId: gameEndDto.matchId,
            name: activeAbilityName,
            type: 'abilityActive',
            level: LotteryStatus.activeAbilityLevel ?? 0,
            difficulty: gameEndDto.difficulty,
            version: gameEndDto.version,
            isWin: gameEndDto.winnerTeamId === player.teamId,
          });
        }

        if (passiveAbilityName) {
          Analytics.SendGameEndPickAbilityEvent({
            steamId: player.steamId,
            matchId: gameEndDto.matchId,
            name: passiveAbilityName,
            type: 'abilityPassive',
            level: LotteryStatus.passiveAbilityLevel ?? 0,
            difficulty: gameEndDto.difficulty,
            version: gameEndDto.version,
            isWin: gameEndDto.winnerTeamId === player.teamId,
          });
        }
      }
    });
  }
}
