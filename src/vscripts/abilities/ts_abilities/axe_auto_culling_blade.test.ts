const mockCastImmediatelyOnTarget = jest.fn();
const mockFindEnemiesInRange = jest.fn();
const mockGetFullCastRange = jest.fn().mockReturnValue(900);

jest.mock('../../utils/dota_ts_adapter', () => ({
  registerAbility: () => (ability: unknown) => ability,
}));

jest.mock('./shared/auto-cast-ability', () => ({
  AutoCastAbility: class {},
  castImmediatelyOnTarget: (...args: unknown[]) => mockCastImmediatelyOnTarget(...args),
  findEnemiesInRange: (...args: unknown[]) => mockFindEnemiesInRange(...args),
  getFullCastRange: (...args: unknown[]) => mockGetFullCastRange(...args),
}));

import { AxeAutoCullingBlade } from './axe_auto_culling_blade';

describe('AxeAutoCullingBlade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFullCastRange.mockReturnValue(900);
  });

  it('skips the green immortality spirit and culls the next valid target', () => {
    const culling = {
      IsFullyCastable: jest.fn().mockReturnValue(true),
      GetSpecialValueFor: jest.fn().mockReturnValue(300),
      EndCooldown: jest.fn(),
    };
    const caster = {
      FindAbilityByName: jest.fn().mockReturnValue(culling),
      GetSpellAmplification: jest.fn().mockReturnValue(0),
    };
    const immortalTarget = {
      IsNull: jest.fn().mockReturnValue(false),
      IsAlive: jest.fn().mockReturnValue(true),
      HasModifier: jest.fn().mockReturnValue(true),
      GetHealth: jest.fn().mockReturnValue(100),
    };
    const validTarget = {
      IsNull: jest.fn().mockReturnValue(false),
      IsAlive: jest.fn().mockReturnValue(true),
      HasModifier: jest.fn().mockReturnValue(false),
      GetHealth: jest.fn().mockReturnValue(100),
    };
    mockFindEnemiesInRange.mockReturnValue([immortalTarget, validTarget]);

    const ability = new AxeAutoCullingBlade();
    ability.GetCurrentAbilityCharges = jest.fn().mockReturnValue(2) as never;
    ability.SetCurrentAbilityCharges = jest.fn();

    ability.OnAutoCastThink(caster as never);

    expect(mockCastImmediatelyOnTarget).toHaveBeenCalledTimes(1);
    expect(mockCastImmediatelyOnTarget).toHaveBeenCalledWith(caster, culling, validTarget);
    expect(culling.EndCooldown).toHaveBeenCalledTimes(1);
    expect(ability.SetCurrentAbilityCharges).toHaveBeenCalledWith(1);
  });
});
