import { reloadable } from '../../utils/tstl-utils';
import {
  modifier_rune_critical_storm,
  CRITICAL_STORM_DURATION,
} from '../../modifiers/rune/modifier_rune_critical_storm';
import {
  modifier_rune_overdrive,
  OVERDRIVE_DURATION,
} from '../../modifiers/rune/modifier_rune_overdrive';
import {
  modifier_rune_surge_of_life,
  SURGE_OF_LIFE_DURATION,
} from '../../modifiers/rune/modifier_rune_surge_of_life';
import {
  modifier_rune_spell_frenzy,
  SPELL_FRENZY_DURATION,
} from '../../modifiers/rune/modifier_rune_spell_frenzy';

const MAX_PLAYER_ID = 24;

// Numeric values of DOTA_RUNES const enum (cannot be used as runtime values)
const RUNE_DOUBLEDAMAGE = 0;
const RUNE_HASTE = 1;
const RUNE_REGENERATION = 4;
const RUNE_BOUNTY = 5;
const RUNE_ARCANE = 6;

// Vanilla rune modifier names to purge so only custom effects apply
const VANILLA_RUNE_MODIFIERS: Record<number, string> = {
  [RUNE_HASTE]: 'modifier_haste_rune',
  [RUNE_DOUBLEDAMAGE]: 'modifier_double_damage_rune',
  [RUNE_REGENERATION]: 'modifier_regeneration_rune',
  [RUNE_ARCANE]: 'modifier_arcane_rune',
};

export function calculateWarChestGold(gameTimeSeconds: number): number {
  return 300 + 50 * Math.floor(Math.max(0, gameTimeSeconds) / 60);
}

@reloadable
export class EventRunePickup {
  constructor() {
    ListenToGameEvent('dota_rune_pickup', (keys) => this.onRunePickup(keys), this);
  }

  onRunePickup(keys: GameEventProvidedProperties & DotaRunePickupEvent): void {
    const playerId = keys.userid as unknown as PlayerID;
    const hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero | undefined;
    print(`[RunePickup] userid=${keys.userid} type=${keys.type} hero=${hero ? hero.GetUnitName() : 'nil'}`);
    if (!hero || !hero.IsRealHero()) return;

    const runeType = keys.type as DOTA_RUNES;

    // Purge vanilla rune effect so only our custom modifier applies
    const vanillaModifier = VANILLA_RUNE_MODIFIERS[runeType as number];
    if (vanillaModifier !== undefined) {
      hero.RemoveModifierByName(vanillaModifier);
    }

    switch (runeType) {
      case RUNE_HASTE:
        this.applyOverdrive(hero);
        break;
      case RUNE_DOUBLEDAMAGE:
        this.applyCriticalStorm(hero);
        break;
      case RUNE_REGENERATION:
        this.applySurgeOfLife(hero);
        break;
      case RUNE_ARCANE:
        this.applySpellFrenzy(hero);
        break;
      case RUNE_BOUNTY:
        this.applyWarChest(hero);
        break;
    }
  }

  private applyOverdrive(hero: CDOTA_BaseNPC_Hero): void {
    hero.AddNewModifier(hero, undefined, modifier_rune_overdrive.name, {
      duration: OVERDRIVE_DURATION,
    });
    GameRules.SendCustomMessage(
      `[Overdrive] ${hero.GetName()} picked up the Haste Rune! 900 speed & +300 attack speed for ${OVERDRIVE_DURATION}s!`,
      0,
      0,
    );
  }

  private applyCriticalStorm(hero: CDOTA_BaseNPC_Hero): void {
    hero.AddNewModifier(hero, undefined, modifier_rune_critical_storm.name, {
      duration: CRITICAL_STORM_DURATION,
    });
    GameRules.SendCustomMessage(
      `[Critical Storm] ${hero.GetName()} picked up the Double Damage Rune! Every attack hits for 5x damage for ${CRITICAL_STORM_DURATION}s!`,
      0,
      0,
    );
  }

  private applySurgeOfLife(hero: CDOTA_BaseNPC_Hero): void {
    hero.AddNewModifier(hero, undefined, modifier_rune_surge_of_life.name, {
      duration: SURGE_OF_LIFE_DURATION,
    });
    GameRules.SendCustomMessage(
      `[Surge of Life] ${hero.GetName()} picked up the Regen Rune! Full HP/mana, 50% damage reduction & 150 HP/s aura for ${SURGE_OF_LIFE_DURATION}s!`,
      0,
      0,
    );
  }

  private applySpellFrenzy(hero: CDOTA_BaseNPC_Hero): void {
    hero.AddNewModifier(hero, undefined, modifier_rune_spell_frenzy.name, {
      duration: SPELL_FRENZY_DURATION,
    });
    GameRules.SendCustomMessage(
      `[Spell Frenzy] ${hero.GetName()} picked up the Arcane Rune! 80% cooldown reduction on all abilities for ${SPELL_FRENZY_DURATION}s!`,
      0,
      0,
    );
  }

  private applyWarChest(hero: CDOTA_BaseNPC_Hero): void {
    const gameTime = GameRules.GetDOTATime(false, false);
    const gold = calculateWarChestGold(gameTime);
    const team = hero.GetTeamNumber();

    for (let i = 0; i < MAX_PLAYER_ID; i++) {
      const pid = i as PlayerID;
      if (!PlayerResource.IsValidPlayerID(pid)) continue;
      if (PlayerResource.GetTeam(pid) !== team) continue;
      PlayerResource.ModifyGold(pid, gold, false, ModifyGoldReason.UNSPECIFIED);
    }

    GameRules.SendCustomMessage(
      `[War Chest] ${hero.GetName()} picked up a Bounty Rune! Every teammate receives ${gold} gold!`,
      0,
      0,
    );
  }
}
