import {
  GameEndDto,
  GameEndGameOptionsDto,
  GameEndPlayerDto,
} from '../../../api/analytics/dto/game-end-dto';
import { Game } from '../../../api/game';
import { reloadable } from '../../../utils/tstl-utils';
import { GameConfig } from '../../GameConfig';
import { PlayerHelper } from '../../helper/player-helper';
import { GameEndHelper } from './game-end-helper';

@reloadable
export class GameEnd {
  public static OnGameEnd(winnerTeamId: DotaTeam): void {
    // build game end dto
    const gameEndDto = this.buildGameEndDto(winnerTeamId);
    // send game end dto
    Game.PostEndGame(gameEndDto);
  }

  private static buildGameEndDto(winnerTeamId: DotaTeam): GameEndDto {
    const gameOptionsData = CustomNetTables.GetTableValue('game_options', 'game_options');
    const difficulty = CustomNetTables.GetTableValue('game_difficulty', 'all').difficulty;
    const gameOptions: GameEndGameOptionsDto = {
      multiplierRadiant: gameOptionsData.multiplier_radiant,
      multiplierDire: gameOptionsData.multiplier_dire,
      playerNumberRadiant: gameOptionsData.player_number_radiant,
      playerNumberDire: gameOptionsData.player_number_dire,
      towerPowerPct: gameOptionsData.tower_power_pct,
    };

    const gameTime = GameRules.GetGameTime();

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
      };
      playerDto.score = GameEndHelper.CalculatePlayerScore(playerDto);
      playerDto.battlePoints = this.CalculatePlayerBattlePoints(
        playerDto,
        difficulty,
        winnerTeamId,
      );
      players.push(playerDto);

      // 结算界面数据
      CustomNetTables.SetTableValue('ending_stats', playerId.toString(), {
        damage: playerDto.damage,
        damagereceived: damageTaken,
        healing: playerDto.healing,
        points: playerDto.battlePoints,
        str: hero.GetStrength(),
        agi: hero.GetAgility(),
        int: hero.GetIntellect(false),
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
    difficulty: number,
    winnerTeamId: DotaTeam,
  ): number {
    if (player.steamId === 0) {
      // 电脑不获得积分
      return 0;
    }
    const gameTimePoints = GameEndHelper.GetGameTimePoints(GameRules.GetGameTime());
    const basePoints = player.score + gameTimePoints;
    const multiplier = this.getBattlePointsMultiplier(difficulty);
    const points = basePoints * multiplier;
    if (player.teamId !== winnerTeamId) {
      // 输了积分减半
      return Math.round(points * 0.5);
    }
    return Math.round(points);
  }

  // 根据难度获得倍率
  private static getBattlePointsMultiplier(difficulty: number): number {
    // 如果是作弊模式，不计算倍率。开发模式无视这条
    if (GameRules.IsCheatMode() && !IsInToolsMode()) {
      return 0;
    }

    switch (difficulty) {
      case 1:
        return 1.2;
      case 2:
        return 1.4;
      case 3:
        return 1.6;
      case 4:
        return 1.8;
      case 5:
        return 2;
      case 6:
        return 2.2;
      default:
        return 1;
    }
  }
}