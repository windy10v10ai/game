const mockCastImmediatelyOnTarget = jest.fn();
const mockFindEnemiesInRange = jest.fn();
const mockGetFullCastRange = jest.fn().mockReturnValue(600);

jest.mock('../../utils/dota_ts_adapter', () => ({
  registerAbility: () => (ability: unknown) => ability,
  registerModifier: () => (modifier: unknown) => modifier,
}));

jest.mock('./shared/auto-cast-ability', () => ({
  AutoCastAbility: class {},
  modifier_autocast_think: class {},
  castImmediatelyOnTarget: (...args: unknown[]) => mockCastImmediatelyOnTarget(...args),
  findEnemiesInRange: (...args: unknown[]) => mockFindEnemiesInRange(...args),
  getFullCastRange: (...args: unknown[]) => mockGetFullCastRange(...args),
}));

import { LegionCommanderAutoDuel } from './legion_commander_auto_duel';

describe('LegionCommanderAutoDuel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFullCastRange.mockReturnValue(600);
  });

  it('does not search or cast while Duel is not fully castable', () => {
    const duel = {
      IsFullyCastable: jest.fn().mockReturnValue(false),
    };
    const caster = {
      FindAbilityByName: jest.fn().mockReturnValue(duel),
    };
    const ability = new LegionCommanderAutoDuel();

    ability.OnAutoCastThink(caster as never);

    expect(mockFindEnemiesInRange).not.toHaveBeenCalled();
    expect(mockCastImmediatelyOnTarget).not.toHaveBeenCalled();
  });

  it('adds 200 range, drains every spell absorb layer, then duels the nearest hero', () => {
    const duel = {
      IsFullyCastable: jest.fn().mockReturnValue(true),
    };
    const caster = {
      FindAbilityByName: jest.fn().mockReturnValue(duel),
    };
    const nearest = {
      TriggerSpellAbsorb: jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValue(false),
    };
    const farther = {
      TriggerSpellAbsorb: jest.fn(),
    };
    mockFindEnemiesInRange.mockReturnValue([nearest, farther]);

    const ability = new LegionCommanderAutoDuel();
    ability.GetSpecialValueFor = jest.fn().mockReturnValue(200) as never;

    ability.OnAutoCastThink(caster as never);

    expect(mockFindEnemiesInRange).toHaveBeenCalledWith(caster, 800, UnitTargetType.HERO);
    expect(nearest.TriggerSpellAbsorb).toHaveBeenCalledTimes(3);
    expect(nearest.TriggerSpellAbsorb).toHaveBeenNthCalledWith(1, duel);
    expect(farther.TriggerSpellAbsorb).not.toHaveBeenCalled();
    expect(mockCastImmediatelyOnTarget).toHaveBeenCalledTimes(1);
    expect(mockCastImmediatelyOnTarget).toHaveBeenCalledWith(caster, duel, nearest);
  });

  it('does not spend Duel when no enemy hero is in range', () => {
    const duel = {
      IsFullyCastable: jest.fn().mockReturnValue(true),
    };
    const caster = {
      FindAbilityByName: jest.fn().mockReturnValue(duel),
    };
    mockFindEnemiesInRange.mockReturnValue([]);

    const ability = new LegionCommanderAutoDuel();
    ability.GetSpecialValueFor = jest.fn().mockReturnValue(200) as never;

    ability.OnAutoCastThink(caster as never);

    expect(mockCastImmediatelyOnTarget).not.toHaveBeenCalled();
  });

  it('refreshes Duel after the tracked auto-duel target dies with the level 25 talent', () => {
    const duel = {
      IsFullyCastable: jest.fn().mockReturnValue(true),
      GetSpecialValueFor: jest.fn((name: string) => (name === 'duel_refresh_on_victory' ? 1 : 0)),
      EndCooldown: jest.fn(),
    };
    const caster = {
      FindAbilityByName: jest.fn().mockReturnValue(duel),
      IsNull: jest.fn().mockReturnValue(false),
      IsAlive: jest.fn().mockReturnValue(true),
      HasModifier: jest.fn().mockReturnValue(true),
    };
    const target = {
      HasModifier: jest.fn().mockReturnValue(true),
      TriggerSpellAbsorb: jest.fn().mockReturnValue(false),
    };
    mockFindEnemiesInRange.mockReturnValue([target]);

    const ability = new LegionCommanderAutoDuel();
    ability.GetCaster = jest.fn().mockReturnValue(caster) as never;
    ability.GetSpecialValueFor = jest.fn().mockReturnValue(200) as never;

    ability.OnAutoCastThink(caster as never);
    ability.OnTrackedUnitDeath(target as never);

    expect(duel.GetSpecialValueFor).toHaveBeenCalledWith('duel_refresh_on_victory');
    expect(duel.EndCooldown).toHaveBeenCalledTimes(1);
  });

  it('does not refresh cooldown when the tracked target dies after Duel has already ended', () => {
    const duel = {
      IsFullyCastable: jest.fn().mockReturnValue(true),
      GetSpecialValueFor: jest.fn().mockReturnValue(1),
      EndCooldown: jest.fn(),
    };
    const caster = {
      FindAbilityByName: jest.fn().mockReturnValue(duel),
      IsNull: jest.fn().mockReturnValue(false),
      IsAlive: jest.fn().mockReturnValue(true),
      HasModifier: jest.fn().mockReturnValue(false),
    };
    const target = {
      HasModifier: jest.fn().mockReturnValue(false),
      TriggerSpellAbsorb: jest.fn().mockReturnValue(false),
    };
    mockFindEnemiesInRange.mockReturnValue([target]);

    const ability = new LegionCommanderAutoDuel();
    ability.GetCaster = jest.fn().mockReturnValue(caster) as never;
    ability.GetSpecialValueFor = jest.fn().mockReturnValue(200) as never;

    ability.OnAutoCastThink(caster as never);
    ability.OnTrackedUnitDeath(target as never);

    expect(duel.EndCooldown).not.toHaveBeenCalled();
  });
});
