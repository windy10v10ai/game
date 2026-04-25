import {
  GameEndDto,
  GameEndGameOptionsDto,
  GameEndPlayerDto,
} from '../../../api/analytics/dto/game-end-dto';
import { GA4 } from '../../../api/analytics/ga4/ga4';
import { GA4Event } from '../../../api/analytics/ga4/dto/ga4-dto';
import { GA4ItemTracker } from '../../../api/analytics/ga4/ga4-item-tracker';
import { ApiClient } from '../../../api/api-client';
import { Game } from '../../../api/game';
import { reloadable } from '../../../utils/tstl-utils';
import { GameConfig } from '../../GameConfig';
import { NetTableHelper } from '../../helper/net-table-helper';
import { PlayerHelper } from '../../helper/player-helper';
import { abilityTiersPassive } from '../../lottery/lottery-abilities';
import { Tier } from '../../lottery/tier';
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
    // 发送 GA4 游戏结束技能选择事件
    this.SendGameEndPickAbilityEvents(gameEndDto);
    // 发送 GA4 物品持有时长事件
    GA4ItemTracker.SendAtGameEnd(gameEndDto);
    // 发送 GA4 匹配时间事件
    GA4.SendGameEndMatchTimeEvents();
  }

  /**
   * 收集每个玩家选择的技能并按玩家批量发送 GA4 事件
   */
  private static SendGameEndPickAbilityEvents(gameEndDto: GameEndDto) {
    const eventName = 'game_end_pick_ability';

    gameEndDto.players.forEach((player) => {
      const picks = GameEnd.CollectPlayerPicks(player);
      if (picks.length === 0) {
        return;
      }

      const isBot = player.steamId <= 0;
      const winMetrics = player.teamId === gameEndDto.winnerTeamId;

      const events: GA4Event[] = picks.map((pick) =>
        GA4.BuildEvent(eventName, player.steamId, {
          steam_id: player.steamId,
          ability_name: pick.name,
          type: pick.type,
          tier: pick.tier,
          difficulty: gameEndDto.difficulty,
          win_metrics: winMetrics,
          hero_name: player.heroName,
          team_id: player.teamId,
          is_bot: isBot,
        }),
      );

      GA4.SendEvents(player.steamId, events);
    });
  }

  /**
   * 收集单个玩家或电脑的技能选择
   */
  private static CollectPlayerPicks(
    player: GameEndPlayerDto,
  ): { name: string; type: string; tier: number }[] {
    const picks: { name: string; type: string; tier: number }[] = [];

    if (player.steamId > 0) {
      // 真实玩家：从 lottery_status net table 读取
      const steamAccountID = player.steamId.toString();
      const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);

      if (lotteryStatus.activeAbilityName) {
        picks.push({
          name: lotteryStatus.activeAbilityName,
          type: 'abilityActive',
          tier: lotteryStatus.activeAbilityLevel ?? 0,
        });
      }
      if (lotteryStatus.passiveAbilityName) {
        picks.push({
          name: lotteryStatus.passiveAbilityName,
          type: 'abilityPassive',
          tier: lotteryStatus.passiveAbilityLevel ?? 0,
        });
      }
      if (lotteryStatus.passiveAbilityName2) {
        picks.push({
          name: lotteryStatus.passiveAbilityName2,
          type: 'abilityPassive',
          tier: lotteryStatus.passiveAbilityLevel2 ?? 0,
        });
      }
    } else {
      // 电脑：从 bot_passive_abilities net table 读取
      const botAbilities = CustomNetTables.GetTableValue(
        'bot_passive_abilities',
        player.playerId.toString(),
      );
      if (!botAbilities) {
        return picks;
      }
      if (botAbilities.passiveAbilityName1) {
        picks.push({
          name: botAbilities.passiveAbilityName1,
          type: 'abilityPassive',
          tier: GameEnd.GetAbilityTier(botAbilities.passiveAbilityName1, abilityTiersPassive),
        });
      }
      if (botAbilities.passiveAbilityName2) {
        picks.push({
          name: botAbilities.passiveAbilityName2,
          type: 'abilityPassive',
          tier: GameEnd.GetAbilityTier(botAbilities.passiveAbilityName2, abilityTiersPassive),
        });
      }
    }

    return picks;
  }

  private static GetAbilityTier(abilityName: string, tiers: Tier[]): number {
    for (const tier of tiers) {
      if (tier.names.includes(abilityName)) {
        return tier.level;
      }
    }
    return 0;
  }
}
