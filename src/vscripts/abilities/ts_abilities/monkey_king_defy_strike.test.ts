import { modifier_monkey_king_defy_strike } from './monkey_king_defy_strike';

jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseModifier: class {},
  registerModifier: () => () => undefined,
}));

describe('Defy attack records', () => {
  const globals = globalThis as typeof globalThis & { IsServer: () => boolean };
  const originalIsServer = globals.IsServer;

  beforeAll(() => {
    globals.IsServer = () => true;
  });

  afterAll(() => {
    globals.IsServer = originalIsServer;
  });

  function createDefy() {
    const modifier = new modifier_monkey_king_defy_strike();
    let defyActive = true;
    const strike = { IsNull: () => false, IsHidden: () => false, GetLevel: () => 1 };
    const caster = {
      IsAlive: () => true,
      HasModifier: () => defyActive,
      GetTeamNumber: () => 2,
      FindAbilityByName: () => strike,
    } as unknown as CDOTA_BaseNPC;
    const target = {
      IsNull: () => false,
      GetTeamNumber: () => 3,
      GetAbsOrigin: () => undefined,
    } as unknown as CDOTA_BaseNPC;
    const trigger = jest.fn();
    Object.assign(modifier, { GetParent: () => caster, strikeAt: trigger });

    return {
      attack: (record: number, overrides: Partial<ModifierAttackEvent> = {}) =>
        modifier.OnAttack({
          attacker: caster,
          target,
          record,
          ...overrides,
        } as ModifierAttackEvent),
      expire: () => {
        defyActive = false;
      },
      strike: strike as unknown as CDOTABaseAbility,
      trigger,
    };
  }

  it('triggers once per basic attack record', () => {
    const { attack, trigger } = createDefy();
    attack(11);
    attack(12);
    attack(11);

    expect(trigger).toHaveBeenCalledTimes(2);
  });

  it('ignores manual Boundless Strike and other added attacks', () => {
    const { attack, strike, trigger } = createDefy();
    attack(11, { no_attack_cooldown: true });
    attack(12, { inflictor: strike });
    attack(13);

    expect(trigger).toHaveBeenCalledTimes(1);
  });

  it('does not trigger after Defy expires', () => {
    const { attack, expire, trigger } = createDefy();
    attack(11);
    expire();
    attack(12);

    expect(trigger).toHaveBeenCalledTimes(1);
  });
});
