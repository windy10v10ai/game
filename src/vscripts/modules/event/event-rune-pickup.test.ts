// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

// Must be before imports — jest.mock is hoisted so this runs first
jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseModifier: class {},
  BaseAbility: class {},
  BaseItem: class {},
  registerModifier: () => (cls: unknown) => cls,
}));

global.setmetatable = jest.fn();

import { calculateWarChestGold, EventRunePickup } from './event-rune-pickup';
import {
  CRITICAL_STORM_BONUS_DAMAGE_PCT,
  CRITICAL_STORM_DURATION,
} from '../../modifiers/rune/modifier_rune_critical_storm';
import { OVERDRIVE_DURATION, OVERDRIVE_MOVE_SPEED, OVERDRIVE_ATTACK_SPEED } from '../../modifiers/rune/modifier_rune_overdrive';
import {
  SURGE_OF_LIFE_DURATION,
  SURGE_DAMAGE_REDUCTION_PCT,
  SURGE_PERSONAL_REGEN,
  SURGE_ALLY_HEAL_PER_TICK,
} from '../../modifiers/rune/modifier_rune_surge_of_life';
import { SPELL_FRENZY_DURATION, SPELL_FRENZY_CDR_PCT } from '../../modifiers/rune/modifier_rune_spell_frenzy';

// ── Dota global mocks ────────────────────────────────────────────────────────

const mockAddNewModifier = jest.fn();
const mockGetName = jest.fn().mockReturnValue('Dragon Knight');
const mockGetTeamNumber = jest.fn().mockReturnValue(2); // DotaTeam.GOODGUYS
const mockIsRealHero = jest.fn().mockReturnValue(true);

const mockHero = {
  IsRealHero: mockIsRealHero,
  GetName: mockGetName,
  GetTeamNumber: mockGetTeamNumber,
  AddNewModifier: mockAddNewModifier,
  SetHealth: jest.fn(),
  SetMana: jest.fn(),
  GetMaxHealth: jest.fn().mockReturnValue(2000),
  GetMaxMana: jest.fn().mockReturnValue(1000),
} as unknown as CDOTA_BaseNPC_Hero;

const mockModifyGold = jest.fn();
const mockIsValidPlayerID = jest.fn((pid: number) => pid < 3);
const mockGetTeam = jest.fn((pid: number) => (pid < 2 ? 2 : 3)); // players 0,1 on radiant; 2+ on dire
const mockSendCustomMessage = jest.fn();
const mockGetDOTATime = jest.fn().mockReturnValue(300); // 5 minutes

beforeAll(() => {
  global.ListenToGameEvent = jest.fn();
  global.EntIndexToHScript = jest.fn().mockReturnValue(mockHero);
  global.IsServer = jest.fn().mockReturnValue(true);
  global.GameRules = {
    SendCustomMessage: mockSendCustomMessage,
    GetDOTATime: mockGetDOTATime,
  };
  global.PlayerResource = {
    IsValidPlayerID: mockIsValidPlayerID,
    GetTeam: mockGetTeam,
    ModifyGold: mockModifyGold,
  };
  global.ModifyGoldReason = { UNSPECIFIED: 0 };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDOTATime.mockReturnValue(300);
});

// ── calculateWarChestGold ────────────────────────────────────────────────────

describe('calculateWarChestGold', () => {
  it('returns 300 at game start (0s)', () => {
    expect(calculateWarChestGold(0)).toBe(300);
  });

  it('returns 300 before the first full minute', () => {
    expect(calculateWarChestGold(59)).toBe(300);
  });

  it('adds 50 gold per full minute elapsed', () => {
    expect(calculateWarChestGold(60)).toBe(350);
    expect(calculateWarChestGold(120)).toBe(400);
    expect(calculateWarChestGold(300)).toBe(550); // 5 minutes
    expect(calculateWarChestGold(600)).toBe(800); // 10 minutes
  });

  it('clamps negative game time to 0', () => {
    expect(calculateWarChestGold(-100)).toBe(300);
  });

  it('scales properly at late game (30 minutes)', () => {
    expect(calculateWarChestGold(1800)).toBe(1800);
  });
});

// ── modifier constants ───────────────────────────────────────────────────────

describe('Overdrive modifier constants', () => {
  it('has a 20-second duration', () => {
    expect(OVERDRIVE_DURATION).toBe(20);
  });

  it('sets move speed well above the normal 550 cap', () => {
    expect(OVERDRIVE_MOVE_SPEED).toBeGreaterThan(550);
  });

  it('grants significant attack speed bonus', () => {
    expect(OVERDRIVE_ATTACK_SPEED).toBeGreaterThanOrEqual(200);
  });
});

describe('Critical Storm modifier constants', () => {
  it('has a 15-second duration', () => {
    expect(CRITICAL_STORM_DURATION).toBe(15);
  });

  it('bonus damage results in 5x total (400% bonus + 100% base)', () => {
    expect(CRITICAL_STORM_BONUS_DAMAGE_PCT).toBe(400);
  });
});

describe('Surge of Life modifier constants', () => {
  it('has a 12-second duration', () => {
    expect(SURGE_OF_LIFE_DURATION).toBe(12);
  });

  it('applies 50% damage reduction (negative percentage)', () => {
    expect(SURGE_DAMAGE_REDUCTION_PCT).toBe(-50);
  });

  it('provides substantial personal regen', () => {
    expect(SURGE_PERSONAL_REGEN).toBeGreaterThanOrEqual(100);
  });

  it('heals allies for a significant amount per tick', () => {
    expect(SURGE_ALLY_HEAL_PER_TICK).toBeGreaterThanOrEqual(100);
  });
});

describe('Spell Frenzy modifier constants', () => {
  it('has a 15-second duration', () => {
    expect(SPELL_FRENZY_DURATION).toBe(15);
  });

  it('reduces cooldowns by 80%', () => {
    expect(SPELL_FRENZY_CDR_PCT).toBe(80);
  });
});

// ── EventRunePickup event dispatch ───────────────────────────────────────────

describe('EventRunePickup.onRunePickup', () => {
  let handler: EventRunePickup;

  beforeEach(() => {
    handler = new EventRunePickup();
  });

  function makeEvent(type: number): GameEventProvidedProperties & DotaRunePickupEvent {
    return { userid: 1 as EntityIndex, type, rune: 0, bounty_amount: 0 } as any;
  }

  it('applies Overdrive modifier on haste rune (type 1)', () => {
    handler.onRunePickup(makeEvent(1));
    expect(mockAddNewModifier).toHaveBeenCalledWith(
      mockHero,
      undefined,
      expect.stringContaining('overdrive'),
      expect.objectContaining({ duration: OVERDRIVE_DURATION }),
    );
    expect(mockSendCustomMessage).toHaveBeenCalledWith(
      expect.stringContaining('Overdrive'),
      0,
      0,
    );
  });

  it('applies Critical Storm modifier on double damage rune (type 0)', () => {
    handler.onRunePickup(makeEvent(0));
    expect(mockAddNewModifier).toHaveBeenCalledWith(
      mockHero,
      undefined,
      expect.stringContaining('critical_storm'),
      expect.objectContaining({ duration: CRITICAL_STORM_DURATION }),
    );
    expect(mockSendCustomMessage).toHaveBeenCalledWith(
      expect.stringContaining('Critical Storm'),
      0,
      0,
    );
  });

  it('applies Surge of Life modifier on regen rune (type 4)', () => {
    handler.onRunePickup(makeEvent(4));
    expect(mockAddNewModifier).toHaveBeenCalledWith(
      mockHero,
      undefined,
      expect.stringContaining('surge_of_life'),
      expect.objectContaining({ duration: SURGE_OF_LIFE_DURATION }),
    );
    expect(mockSendCustomMessage).toHaveBeenCalledWith(
      expect.stringContaining('Surge of Life'),
      0,
      0,
    );
  });

  it('applies Spell Frenzy modifier on arcane rune (type 6)', () => {
    handler.onRunePickup(makeEvent(6));
    expect(mockAddNewModifier).toHaveBeenCalledWith(
      mockHero,
      undefined,
      expect.stringContaining('spell_frenzy'),
      expect.objectContaining({ duration: SPELL_FRENZY_DURATION }),
    );
    expect(mockSendCustomMessage).toHaveBeenCalledWith(
      expect.stringContaining('Spell Frenzy'),
      0,
      0,
    );
  });

  it('gives War Chest gold to all teammates on bounty rune (type 5)', () => {
    mockGetDOTATime.mockReturnValue(300); // 5 minutes → 550 gold
    handler.onRunePickup(makeEvent(5));

    // players 0 and 1 are on team 2 (radiant, same as hero); player 2 is on team 3
    expect(mockModifyGold).toHaveBeenCalledTimes(2);
    expect(mockModifyGold).toHaveBeenCalledWith(0, 550, false, 0);
    expect(mockModifyGold).toHaveBeenCalledWith(1, 550, false, 0);
    expect(mockSendCustomMessage).toHaveBeenCalledWith(
      expect.stringContaining('550 gold'),
      0,
      0,
    );
  });

  it('broadcasts the correct gold amount in the war chest message', () => {
    mockGetDOTATime.mockReturnValue(0); // game start → 300 gold
    handler.onRunePickup(makeEvent(5));
    expect(mockSendCustomMessage).toHaveBeenCalledWith(
      expect.stringContaining('300 gold'),
      0,
      0,
    );
  });

  it('does nothing for unknown rune types', () => {
    handler.onRunePickup(makeEvent(99));
    expect(mockAddNewModifier).not.toHaveBeenCalled();
    expect(mockSendCustomMessage).not.toHaveBeenCalled();
  });

  it('does nothing if the entity is not a real hero', () => {
    mockIsRealHero.mockReturnValueOnce(false);
    handler.onRunePickup(makeEvent(1));
    expect(mockAddNewModifier).not.toHaveBeenCalled();
  });
});
