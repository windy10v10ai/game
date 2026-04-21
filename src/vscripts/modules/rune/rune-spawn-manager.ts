import { GameConfig } from '../GameConfig';

// Numeric values of DOTA_RUNES const enum (cannot be used as runtime values)
const RUNE_DOUBLEDAMAGE = 0 as DOTA_RUNES;
const RUNE_HASTE = 1 as DOTA_RUNES;
const RUNE_REGENERATION = 4 as DOTA_RUNES;
const RUNE_BOUNTY = 5 as DOTA_RUNES;
const RUNE_ARCANE = 6 as DOTA_RUNES;

// Custom power rune pool — all handled by EventRunePickup
const POWER_RUNE_POOL: DOTA_RUNES[] = [
  RUNE_HASTE,       // → Overdrive
  RUNE_DOUBLEDAMAGE, // → Critical Storm
  RUNE_REGENERATION, // → Surge of Life
  RUNE_ARCANE,      // → Spell Frenzy
];

// Standard Dota 2 map river power rune spots
const POWER_RUNE_SPOTS: Vector[] = [
  Vector(-1728, 1856, 128),
  Vector(1728, -1856, 128),
];

// Standard Dota 2 map bounty rune spots (4 corners)
const BOUNTY_RUNE_SPOTS: Vector[] = [
  Vector(-5184, 2880, 384),
  Vector(-4288, -3808, 256),
  Vector(4288, 2880, 256),
  Vector(5184, -3808, 384),
];

const POWER_RUNE_INTERVAL = 120; // every 2 minutes
const BOUNTY_RUNE_INTERVAL = 180; // every 3 minutes

export class RuneSpawnManager {
  constructor() {
    const preGameTime = GameConfig.PRE_GAME_TIME;

    // Bounty runes: first at t=0:00
    Timers.CreateTimer(preGameTime, () => {
      this.spawnBountyRunes();
      return BOUNTY_RUNE_INTERVAL;
    });

    // Power runes: first at t=2:00
    Timers.CreateTimer(preGameTime + POWER_RUNE_INTERVAL, () => {
      this.spawnPowerRunes();
      return POWER_RUNE_INTERVAL;
    });
  }

  private spawnBountyRunes(): void {
    for (const spot of BOUNTY_RUNE_SPOTS) {
      CreateRune(spot, RUNE_BOUNTY);
    }
  }

  private spawnPowerRunes(): void {
    for (const spot of POWER_RUNE_SPOTS) {
      const runeType = POWER_RUNE_POOL[RandomInt(0, POWER_RUNE_POOL.length - 1)];
      CreateRune(spot, runeType);
    }
  }
}
