import { AbilityItemType } from '../../../../common/dto/lottery';
import { NetTableHelper } from '../../../modules/helper/net-table-helper';
import { AbilityItemTypes } from '../../../modules/lottery/ability/ability-item-type';
import { abilityTiersPassive } from '../../../modules/lottery/ability/lottery-abilities';
import { Tier } from '../../../modules/lottery/shared/tier';
import { GameEndDto, GameEndPlayerDto } from '../dto/game-end-dto';
import { GA4 } from './ga4';
import { GA4Event } from './dto/ga4-dto';

interface PickEntry {
  name: string;
  type: AbilityItemType;
  tier: number;
}

export class GA4PickAbilityTracker {
  /** 游戏结束时调用：收集每个玩家选择的技能并按玩家批量发送 GA4 事件 */
  public static SendAtGameEnd(gameEndDto: GameEndDto): void {
    const eventName = 'game_end_pick_ability';

    gameEndDto.players.forEach((player) => {
      const picks = this.CollectPlayerPicks(player);
      if (picks.length === 0) return;

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

  /** 收集单个玩家或电脑的技能选择 */
  private static CollectPlayerPicks(player: GameEndPlayerDto): PickEntry[] {
    const picks: PickEntry[] = [];
    const addPick = (
      name: string | undefined,
      type: PickEntry['type'],
      tier: number | undefined,
    ): void => {
      if (!name) return;
      picks.push({ name, type, tier: tier ?? 0 });
    };

    if (player.steamId > 0) {
      // 真实玩家：从 lottery_status net table 读取
      const steamAccountID = player.steamId.toString();
      const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);

      addPick(
        lotteryStatus.activeAbilityName,
        AbilityItemTypes.Active,
        lotteryStatus.activeAbilityLevel,
      );
      addPick(
        lotteryStatus.passiveAbilityName,
        AbilityItemTypes.Passive,
        lotteryStatus.passiveAbilityLevel,
      );
      addPick(
        lotteryStatus.passiveAbilityName2,
        AbilityItemTypes.Passive,
        lotteryStatus.passiveAbilityLevel2,
      );
    } else {
      // 电脑：从 bot_passive_abilities net table 读取，tier 通过查表反查
      const botAbilities = CustomNetTables.GetTableValue(
        'bot_passive_abilities',
        player.playerId.toString(),
      );
      if (!botAbilities) return picks;

      addPick(
        botAbilities.passiveAbilityName1,
        AbilityItemTypes.Passive,
        this.GetAbilityTier(botAbilities.passiveAbilityName1, abilityTiersPassive),
      );
      addPick(
        botAbilities.passiveAbilityName2,
        AbilityItemTypes.Passive,
        this.GetAbilityTier(botAbilities.passiveAbilityName2, abilityTiersPassive),
      );
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
