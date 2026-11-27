import { ModifierHelper } from '../helper/modifier-helper';

const BOTTLE = 'item_treasure_bottle';
const BOTTLE_REGEN = 'modifier_bottle_regeneration';
const SUPPLEMENTAL_REGEN = 'modifier_item_treasure_bottle_regen';
const REGEN_CHECK_INTERVAL = 1 / 30;

export class EventTreasureBottle {
  constructor() {
    ListenToGameEvent(
      'dota_item_used',
      (event) => {
        if (event.itemname !== BOTTLE) return;

        // The event precedes modifier creation and scripted casts may omit the player ID.
        Timers.CreateTimer(FrameTime(), () => this.ApplyMissingRegeneration());
      },
      this,
    );
  }

  private ApplyMissingRegeneration(): void {
    for (const hero of HeroList.GetAllHeroes()) {
      const nativeRegen = this.FindBottleRegeneration(hero);
      const duration = nativeRegen?.GetRemainingTime() ?? 0;
      if (duration <= 0) continue;

      const existing = hero.FindModifierByName(SUPPLEMENTAL_REGEN);
      if (existing) {
        existing.SetDuration(duration, false);
        continue;
      }

      ModifierHelper.applyItemDataDrivenModifier(hero, hero, SUPPLEMENTAL_REGEN, { duration });
      const applied = hero.FindModifierByName(SUPPLEMENTAL_REGEN);
      if (!applied) continue;

      Timers.CreateTimer(REGEN_CHECK_INTERVAL, () => {
        if (applied.IsNull()) return undefined;
        if (this.FindBottleRegeneration(hero)) return REGEN_CHECK_INTERVAL;
        applied.Destroy();
        return undefined;
      });
    }
  }

  private FindBottleRegeneration(hero: CDOTA_BaseNPC_Hero): CDOTA_Buff | undefined {
    if (hero.IsNull()) return undefined;
    return hero.FindAllModifiersByName(BOTTLE_REGEN).find((modifier) => {
      const item = modifier.GetAbility();
      return item !== undefined && !item.IsNull() && item.GetAbilityName() === BOTTLE;
    });
  }
}
