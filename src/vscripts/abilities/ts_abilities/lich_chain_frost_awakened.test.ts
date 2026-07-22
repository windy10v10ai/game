jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseAbility: class {},
  registerAbility: () => (ability: unknown) => ability,
}));

import {
  advanceLichChainFrostState,
  createLichChainFrostState,
  isLichIceSpire,
  LichChainFrostAwakened,
} from './lich_chain_frost_awakened';

describe('awakened Lich Chain Frost state', () => {
  it('starts with native base damage and configured remaining bounce count', () => {
    expect(createLichChainFrostState(700, 25)).toEqual({ damage: 700, remainingJumps: 25 });
  });

  it('consumes one bounce and increases damage for the next projectile', () => {
    expect(advanceLichChainFrostState({ damage: 700, remainingJumps: 25 }, 100, 0)).toEqual({
      damage: 800,
      remainingJumps: 24,
    });
  });

  it('adds hero or creep kill bonus jumps after consuming the current bounce', () => {
    expect(advanceLichChainFrostState({ damage: 700, remainingJumps: 3 }, 100, 5)).toEqual({
      damage: 800,
      remainingJumps: 7,
    });
  });

  it('recognizes only the native Ice Spire unit name', () => {
    expect(isLichIceSpire('npc_dota_lich_ice_spire')).toBe(true);
    expect(isLichIceSpire('npc_dota_observer_wards')).toBe(false);
  });
});

type FakeUnit = CDOTA_BaseNPC & {
  AddNewModifier: jest.Mock;
  FindModifierByNameAndCaster: jest.Mock;
  RemoveModifierByNameAndCaster: jest.Mock;
};

function fakeUnit(
  id: number,
  unitName: string,
  options: { realHero?: boolean; illusion?: boolean; alive?: boolean } = {},
): FakeUnit {
  let alive = options.alive ?? true;
  const unit = {
    IsNull: jest.fn().mockReturnValue(false),
    IsAlive: jest.fn(() => alive),
    IsRealHero: jest.fn().mockReturnValue(options.realHero ?? false),
    IsIllusion: jest.fn().mockReturnValue(options.illusion ?? false),
    GetUnitName: jest.fn().mockReturnValue(unitName),
    entindex: jest.fn().mockReturnValue(id),
    GetAbsOrigin: jest.fn().mockReturnValue({}),
    GetRangeToUnit: jest.fn((other: CDOTA_BaseNPC) => Math.abs(id - other.entindex()) * 100),
    AddNewModifier: jest.fn(),
    FindModifierByNameAndCaster: jest.fn().mockReturnValue(undefined),
    RemoveModifierByNameAndCaster: jest.fn(),
    TriggerSpellAbsorb: jest.fn().mockReturnValue(false),
    setAlive: (value: boolean) => {
      alive = value;
    },
  };
  return unit as unknown as FakeUnit;
}

describe('LichChainFrostAwakened runtime bounce selection', () => {
  beforeEach(() => {
    const dotaGlobals = globalThis as unknown as Record<string, unknown>;
    dotaGlobals.UnitTargetTeam = { ENEMY: 2, FRIENDLY: 1 };
    dotaGlobals.UnitTargetType = { HERO: 1, BASIC: 18, OTHER: 32, ALL: 55 };
    dotaGlobals.UnitTargetFlags = { NONE: 0, MAGIC_IMMUNE_ENEMIES: 16, INVULNERABLE: 64 };
    dotaGlobals.FindOrder = { CLOSEST: 0 };
    dotaGlobals.DamageTypes = { MAGICAL: 2 };
    dotaGlobals.ProjectileManager = { CreateTrackingProjectile: jest.fn() };
    globalThis.ApplyDamage = jest.fn() as never;
  });

  function createAbility(target: CDOTA_BaseNPC) {
    const caster = {
      GetTeamNumber: jest.fn().mockReturnValue(2),
      EmitSound: jest.fn(),
    } as unknown as CDOTA_BaseNPC;
    const values: Record<string, number> = {
      damage: 700,
      jumps: 25,
      initial_projectile_speed: 1575,
      projectile_speed: 1275,
      jump_range: 1100,
      bonus_jump_damage: 100,
      slow_duration: 4,
      frostbound_duration: 4,
      bonus_jumps_per_hero_killed: 5,
      bonus_jumps_per_creep_killed: 2,
    };
    const ability = new LichChainFrostAwakened();
    ability.GetCaster = jest.fn().mockReturnValue(caster) as never;
    ability.GetCursorTarget = jest.fn().mockReturnValue(target) as never;
    ability.GetSpecialValueFor = jest.fn((name: string) => values[name] ?? 0) as never;
    return { ability, caster };
  }

  it("refreshes this Lich caster's Chain Frost debuffs instead of stacking duplicate instances", () => {
    const target = fakeUnit(1, 'npc_dota_hero_axe', { realHero: true });
    const slow = { IsNull: jest.fn().mockReturnValue(false), SetDuration: jest.fn() };
    const frostbound = { IsNull: jest.fn().mockReturnValue(false), SetDuration: jest.fn() };
    target.FindModifierByNameAndCaster.mockReturnValueOnce(slow).mockReturnValueOnce(frostbound);
    const { ability, caster } = createAbility(target);

    (
      ability as unknown as {
        applyHit: (source: CDOTA_BaseNPC, victim: CDOTA_BaseNPC, damage: number) => void;
      }
    ).applyHit(caster, target, 700);

    expect(target.FindModifierByNameAndCaster).toHaveBeenNthCalledWith(
      1,
      'modifier_lich_chainfrost_slow',
      caster,
    );
    expect(target.FindModifierByNameAndCaster).toHaveBeenNthCalledWith(
      2,
      'modifier_lich_chainfrost_frostbound',
      caster,
    );
    expect(slow.SetDuration).toHaveBeenCalledWith(4, true);
    expect(frostbound.SetDuration).toHaveBeenCalledWith(4, true);
    expect(target.AddNewModifier).not.toHaveBeenCalled();
  });

  it('uses the awakened initial speed and then chooses a real hero over closer ordinary units', () => {
    const current = fakeUnit(1, 'npc_dota_hero_axe', { realHero: true });
    const nextHero = fakeUnit(5, 'npc_dota_hero_sven', { realHero: true });
    const creep = fakeUnit(2, 'npc_dota_creep_badguys_melee');
    const { ability } = createAbility(current);
    globalThis.FindUnitsInRadius = jest
      .fn()
      .mockReturnValueOnce([current, creep, nextHero])
      .mockReturnValueOnce([]) as never;

    ability.OnSpellStart();
    expect(
      (globalThis as unknown as { ProjectileManager: { CreateTrackingProjectile: jest.Mock } })
        .ProjectileManager.CreateTrackingProjectile,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({ Target: current, iMoveSpeed: 1575, ExtraData: { castId: 1 } }),
    );

    ability.OnProjectileHit_ExtraData(current, {} as Vector, { castId: 1 });

    expect(globalThis.ApplyDamage).toHaveBeenCalledWith(
      expect.objectContaining({ victim: current, damage: 700, ability }),
    );
    expect(
      (globalThis as unknown as { ProjectileManager: { CreateTrackingProjectile: jest.Mock } })
        .ProjectileManager.CreateTrackingProjectile,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({ Source: current, Target: nextHero, iMoveSpeed: 1275 }),
    );
  });

  it('uses Ice Spire as a damage-free relay and returns to the single real hero', () => {
    const hero = fakeUnit(1, 'npc_dota_hero_axe', { realHero: true });
    const creep = fakeUnit(2, 'npc_dota_creep_badguys_melee');
    const spire = fakeUnit(7, 'npc_dota_lich_ice_spire');
    const { ability } = createAbility(hero);
    globalThis.FindUnitsInRadius = jest
      .fn()
      .mockReturnValueOnce([hero, creep])
      .mockReturnValueOnce([spire])
      .mockReturnValueOnce([hero, creep])
      .mockReturnValueOnce([spire]) as never;

    ability.OnSpellStart();
    ability.OnProjectileHit_ExtraData(hero, {} as Vector, { castId: 1 });
    expect(
      (globalThis as unknown as { ProjectileManager: { CreateTrackingProjectile: jest.Mock } })
        .ProjectileManager.CreateTrackingProjectile,
    ).toHaveBeenLastCalledWith(expect.objectContaining({ Target: spire }));

    ability.OnProjectileHit_ExtraData(spire, {} as Vector, { castId: 1 });

    expect(globalThis.ApplyDamage).toHaveBeenCalledTimes(1);
    expect(spire.AddNewModifier).not.toHaveBeenCalled();
    expect(
      (globalThis as unknown as { ProjectileManager: { CreateTrackingProjectile: jest.Mock } })
        .ProjectileManager.CreateTrackingProjectile,
    ).toHaveBeenLastCalledWith(expect.objectContaining({ Source: spire, Target: hero }));
  });

  it('removes Frostbound instead of leaving the spent projectile attached to the final target', () => {
    const current = fakeUnit(1, 'npc_dota_hero_axe', { realHero: true });
    const { ability, caster } = createAbility(current);
    (
      ability as unknown as {
        castStates: Record<number, { damage: number; remainingJumps: number }>;
      }
    ).castStates[77] = { damage: 700, remainingJumps: 0 };

    ability.OnProjectileHit_ExtraData(current, {} as Vector, { castId: 77 });

    expect(current.RemoveModifierByNameAndCaster).toHaveBeenCalledWith(
      'modifier_lich_chainfrost_frostbound',
      caster,
    );
    expect(
      (globalThis as unknown as { ProjectileManager: { CreateTrackingProjectile: jest.Mock } })
        .ProjectileManager.CreateTrackingProjectile,
    ).not.toHaveBeenCalled();
  });

  it('continues from the final planned bounce when that hit grants kill bonus jumps', () => {
    const current = fakeUnit(1, 'npc_dota_creep_badguys_melee');
    const next = fakeUnit(2, 'npc_dota_creep_badguys_ranged');
    const { ability } = createAbility(current);
    (
      ability as unknown as {
        castStates: Record<number, { damage: number; remainingJumps: number }>;
      }
    ).castStates[99] = { damage: 700, remainingJumps: 0 };
    (current.IsAlive as jest.Mock).mockReturnValueOnce(true).mockReturnValue(false);
    globalThis.FindUnitsInRadius = jest
      .fn()
      .mockReturnValueOnce([current, next])
      .mockReturnValueOnce([]) as never;

    ability.OnProjectileHit_ExtraData(current, {} as Vector, { castId: 99 });

    expect(
      (globalThis as unknown as { ProjectileManager: { CreateTrackingProjectile: jest.Mock } })
        .ProjectileManager.CreateTrackingProjectile,
    ).toHaveBeenLastCalledWith(expect.objectContaining({ Source: current, Target: next }));
    expect(current.RemoveModifierByNameAndCaster).not.toHaveBeenCalled();
  });
});
