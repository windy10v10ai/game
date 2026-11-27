import { calculateDeathPactBonus, canConsumeDeathPactCreep } from './clinkz-death-pact-logic';

describe('calculateDeathPactBonus', () => {
  const injuredCreep = { GetHealth: () => 400, GetMaxHealth: () => 1200 };

  it('uses maximum health even when the target is injured', () => {
    expect(calculateDeathPactBonus(injuredCreep, 100, 25, 0)).toEqual({
      health: 1200,
      damage: 300,
    });
  });

  it('adds the level 15 talent only to health', () => {
    expect(calculateDeathPactBonus(injuredCreep, 100, 25, 300)).toEqual({
      health: 1500,
      damage: 300,
    });
  });

  it('uses the new target on a recast', () => {
    const nextCreep = { GetMaxHealth: () => 1600 };

    expect(calculateDeathPactBonus(nextCreep, 100, 25, 0)).toEqual({
      health: 1600,
      damage: 400,
    });
    expect(calculateDeathPactBonus(nextCreep, 100, 25, 300)).toEqual({
      health: 1900,
      damage: 400,
    });
  });
});

describe('canConsumeDeathPactCreep', () => {
  const ordinary = {
    IsAncient: () => false,
    IsNeutralUnitType: () => true,
    GetLevel: () => 5,
  };
  const ancient = {
    IsAncient: () => true,
    IsNeutralUnitType: () => true,
    GetLevel: () => 7,
  };

  it('keeps the level limit for ordinary creeps after learning the talent', () => {
    expect(canConsumeDeathPactCreep(ordinary, 4, true)).toBe(false);
    expect(canConsumeDeathPactCreep(ordinary, 5, false)).toBe(true);
  });

  it('allows ancient neutral creeps above the ordinary level limit after learning the talent', () => {
    expect(canConsumeDeathPactCreep(ancient, 6, false)).toBe(false);
    expect(canConsumeDeathPactCreep(ancient, 6, true)).toBe(true);
    expect(canConsumeDeathPactCreep({ ...ancient, IsNeutralUnitType: () => false }, 6, true)).toBe(
      false,
    );
  });
});
