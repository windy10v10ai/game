import { ItemBlessingOfDragonDestruction } from './item_blessing_of_dragon';

jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseItem: class {},
  registerAbility: () => (ability: unknown) => ability,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

describe('ItemBlessingOfDragonDestruction', () => {
  beforeEach(() => {
    global.FIND_UNITS_EVERYWHERE = 99999;
    global.UnitTargetTeam = { ENEMY: 1 };
    global.UnitTargetType = { HERO: 2, BASIC: 4 };
    global.UnitTargetFlags = {
      MAGIC_IMMUNE_ENEMIES: 8,
      INVULNERABLE: 16,
      OUT_OF_WORLD: 32,
    };
    global.FindOrder = { ANY: 0 };
  });

  it('kills every living global enemy with caster credit and consumes one rechargeable charge', () => {
    const caster = {
      GetTeamNumber: jest.fn().mockReturnValue(2),
      GetAbsOrigin: jest.fn().mockReturnValue({ x: 1, y: 2, z: 3 }),
    };
    const livingHero = { IsAlive: jest.fn().mockReturnValue(true), Kill: jest.fn() };
    const livingBasic = { IsAlive: jest.fn().mockReturnValue(true), Kill: jest.fn() };
    const deadUnit = { IsAlive: jest.fn().mockReturnValue(false), Kill: jest.fn() };
    global.FindUnitsInRadius = jest.fn().mockReturnValue([livingHero, livingBasic, deadUnit]);

    const item = new ItemBlessingOfDragonDestruction();
    item.GetCaster = jest.fn().mockReturnValue(caster) as never;
    item.SpendCharge = jest.fn();

    item.OnSpellStart();

    expect(global.FindUnitsInRadius).toHaveBeenCalledWith(
      2,
      { x: 1, y: 2, z: 3 },
      undefined,
      FIND_UNITS_EVERYWHERE,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES +
        UnitTargetFlags.INVULNERABLE +
        UnitTargetFlags.OUT_OF_WORLD,
      FindOrder.ANY,
      false,
    );
    expect(livingHero.Kill).toHaveBeenCalledWith(item, caster);
    expect(livingBasic.Kill).toHaveBeenCalledWith(item, caster);
    expect(deadUnit.Kill).not.toHaveBeenCalled();
    expect(item.SpendCharge).toHaveBeenCalledWith(1);
  });
});
