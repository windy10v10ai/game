import {
  calculateActualDamage,
  calculateAttackDPS,
  calculateExpectedHitDamage,
} from './damage-calculation';

function createTarget(overrides: Partial<CDOTA_BaseNPC> = {}): CDOTA_BaseNPC {
  return {
    GetPhysicalArmorValue: jest.fn().mockReturnValue(0),
    GetEvasion: jest.fn().mockReturnValue(0),
    ...overrides,
  } as never;
}

describe('calculateActualDamage', () => {
  it('reduces damage against positive armor', () => {
    const target = createTarget({ GetPhysicalArmorValue: jest.fn().mockReturnValue(10) as never });
    expect(calculateActualDamage(100, target)).toBeCloseTo(62.5);
  });

  it('leaves damage unchanged against zero armor', () => {
    const target = createTarget();
    expect(calculateActualDamage(100, target)).toBeCloseTo(100);
  });

  it('amplifies damage against negative armor', () => {
    const target = createTarget({ GetPhysicalArmorValue: jest.fn().mockReturnValue(-5) as never });
    expect(calculateActualDamage(100, target)).toBeCloseTo(123.08, 1);
  });
});

describe('calculateExpectedHitDamage', () => {
  it('discounts damage by evasion chance', () => {
    const target = createTarget({
      GetPhysicalArmorValue: jest.fn().mockReturnValue(10) as never,
      GetEvasion: jest.fn().mockReturnValue(0.25) as never,
    });
    expect(calculateExpectedHitDamage(100, target)).toBeCloseTo(62.5 * 0.75);
  });
});

describe('calculateAttackDPS', () => {
  it('combines raw damage, mitigation and attack speed', () => {
    const target = createTarget({
      GetPhysicalArmorValue: jest.fn().mockReturnValue(10) as never,
      GetEvasion: jest.fn().mockReturnValue(0.2) as never,
    });
    const attacker = {
      GetAverageTrueAttackDamage: jest.fn().mockReturnValue(100),
      GetAttacksPerSecond: jest.fn().mockReturnValue(1.5),
    };

    expect(calculateAttackDPS(attacker as never, target)).toBeCloseTo(62.5 * 0.8 * 1.5);
  });

  it('returns zero DPS when the attacker cannot hit', () => {
    const target = createTarget();
    const attacker = {
      GetAverageTrueAttackDamage: jest.fn().mockReturnValue(0),
      GetAttacksPerSecond: jest.fn().mockReturnValue(1),
    };

    expect(calculateAttackDPS(attacker as never, target)).toBe(0);
  });
});
