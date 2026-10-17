import { PlayerHelper } from '../../modules/helper/player-helper';
import { HeroItemUsageApi } from '../hero-item-usage';
import { GameEndDto } from './dto/game-end-dto';
import { ItemUsageCounter } from './item-usage-counter';

const SAMPLE_INTERVAL_SECONDS = 30;
const SAMPLING_CONVAR = 'hero_item_usage_sampling';
// Lag rises sharply from 30 minutes after the horn, so late holdings are tracked separately.
export const LATE_GAME_START_SEC = 1800;

/** Samples selected heroes without issuing requests during the match. */
export class HeroItemUsage {
  private static counters = new Map<PlayerID, ItemUsageCounter>();
  private static tracking = false;
  private static lastDotaTime = 0;

  public static Initialize(): void {
    Convars.RegisterConvar(SAMPLING_CONVAR, '1', 'Enable hero item usage sampling', 0);
  }

  public static Start(): void {
    if (this.tracking) return;
    this.tracking = true;
    this.lastDotaTime = Math.max(0, GameRules.GetDOTATime(false, false));
    Timers.CreateTimer(SAMPLE_INTERVAL_SECONDS, () => {
      if (!this.tracking) return undefined;
      this.Sample();
      return SAMPLE_INTERVAL_SECONDS;
    });
  }

  public static Finish(gameEnd: GameEndDto): void {
    if (!this.tracking) return;
    this.Sample();
    this.tracking = false;
    if (Convars.GetInt(SAMPLING_CONVAR) === 0) return;

    PlayerHelper.ForEachPlayer((playerId) => {
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero) return;
      const teamId = PlayerResource.GetTeam(playerId);
      HeroItemUsageApi.Send({
        customMatchId: gameEnd.customMatchId,
        version: gameEnd.version,
        difficulty: gameEnd.difficulty,
        dotaTimeMsec: gameEnd.dotaTimeMsec,
        playerCount: gameEnd.playerCount,
        playerId,
        steamId: PlayerResource.GetSteamAccountID(playerId),
        heroName: PlayerResource.GetSelectedHeroName(playerId),
        teamId,
        isWin: teamId === gameEnd.winnerTeamId,
        items: this.counters.get(playerId)?.GetItems() ?? [],
      });
    });
    this.counters.clear();
  }

  private static Sample(): void {
    const dotaTime = Math.max(0, GameRules.GetDOTATime(false, false));
    const elapsedSec = Math.max(0, dotaTime - this.lastDotaTime);
    const lateSec = Math.max(0, dotaTime - Math.max(this.lastDotaTime, LATE_GAME_START_SEC));
    this.lastDotaTime = dotaTime;
    if (Convars.GetInt(SAMPLING_CONVAR) === 0) return;

    PlayerHelper.ForEachPlayer((playerId) => {
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero) return;
      let counter = this.counters.get(playerId);
      if (!counter) {
        counter = new ItemUsageCounter();
        this.counters.set(playerId, counter);
      }
      const items: string[] = [];
      for (let slot = 0; slot < 6; slot++) {
        const item = hero.GetItemInSlot(slot);
        if (item) items.push(item.GetAbilityName());
      }
      for (const slot of [InventorySlot.NEUTRAL_ACTIVE_SLOT, InventorySlot.NEUTRAL_PASSIVE_SLOT]) {
        const item = hero.GetItemInSlot(slot);
        if (item) items.push(item.GetAbilityName());
      }
      counter.Add(items, elapsedSec, lateSec);
    });
  }
}
