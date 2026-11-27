import { modifier_monkey_king_defy_strike } from './monkey_king_defy_strike';

jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseModifier: class {},
  registerModifier: () => () => undefined,
}));

function makeVector(x: number, y: number, z: number): Vector {
  const length = Math.sqrt(x * x + y * y);
  return {
    x,
    y,
    z,
    Length2D: () => length,
    Normalized: () => makeVector(x / length, y / length, 0),
  } as Vector;
}

describe('Defy attack records', () => {
  const globals = globalThis as typeof globalThis & {
    IsServer: () => boolean;
    Vector: typeof makeVector;
  };
  const original = {
    IsServer: globals.IsServer,
    Timers: globals.Timers,
    Vector: globals.Vector,
    pcall: globals.pcall,
  };
  const timers: (() => void)[] = [];

  function resolveAttacks(): void {
    for (const callback of timers.splice(0)) callback();
  }

  beforeAll(() => {
    Object.assign(globals, {
      IsServer: () => true,
      Timers: { CreateTimer: (_delay: number, callback: () => void) => timers.push(callback) },
      Vector: makeVector,
      pcall: (callback: () => void) => {
        callback();
        return [true];
      },
    });
  });

  beforeEach(() => {
    timers.length = 0;
  });

  afterAll(() => {
    Object.assign(globals, original);
  });

  function createDefy() {
    const modifier = new modifier_monkey_king_defy_strike();
    let defyActive = true;
    let alive = true;
    let origin = makeVector(0, 0, 0);
    let targetPosition = makeVector(0, 100, 0);
    let facing = makeVector(1, 0, 0);
    let cursor = makeVector(10, 10, 0);
    const trigger = jest.fn(() => ({ facing, cursor }));
    const strike = {
      IsNull: () => false,
      IsHidden: () => false,
      GetLevel: () => 1,
      GetAltCastState: () => false,
      OnSpellStart: trigger,
    };
    let currentAbility = strike;
    const caster = {
      IsNull: () => false,
      IsAlive: () => alive,
      HasModifier: () => defyActive,
      GetTeamNumber: () => 2,
      FindAbilityByName: () => currentAbility,
      GetAbsOrigin: () => origin,
      GetForwardVector: () => facing,
      SetForwardVector: (value: Vector) => {
        facing = value;
      },
      GetCursorPosition: () => cursor,
      SetCursorPosition: (value: Vector) => {
        cursor = value;
      },
    } as unknown as CDOTA_BaseNPC;
    const target = {
      IsNull: () => false,
      GetTeamNumber: () => 3,
      GetAbsOrigin: () => targetPosition,
    } as unknown as CDOTA_BaseNPC;
    Object.assign(modifier, { GetParent: () => caster });

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
      die: () => {
        alive = false;
      },
      replaceSkill: () => {
        currentAbility = { ...strike };
      },
      move: () => {
        origin = makeVector(0, 50, 0);
        targetPosition = makeVector(100, 0, 0);
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

    expect(trigger).not.toHaveBeenCalled();
    resolveAttacks();
    expect(trigger).toHaveBeenCalledTimes(2);
  });

  it('ignores manual Boundless Strike and other added attacks', () => {
    const { attack, strike, trigger } = createDefy();
    attack(11, { no_attack_cooldown: true });
    attack(12, { inflictor: strike });
    attack(13);

    resolveAttacks();
    expect(trigger).toHaveBeenCalledTimes(1);
  });

  it('retains a recorded attack when Defy expires before resolution', () => {
    const { attack, expire, trigger } = createDefy();
    attack(11);
    expire();
    attack(12);

    resolveAttacks();
    expect(trigger).toHaveBeenCalledTimes(1);
  });

  it('uses the recorded direction after the caster and target move', () => {
    const { attack, move, trigger } = createDefy();
    attack(11);
    move();

    resolveAttacks();
    expect(trigger.mock.results[0].value).toMatchObject({
      facing: { x: 0, y: 1, z: 0 },
      cursor: { x: 0, y: 100, z: 0 },
    });
  });

  it('drops queued entries if the caster dies or loses the recorded ability', () => {
    const dead = createDefy();
    dead.attack(11);
    dead.die();
    const replaced = createDefy();
    replaced.attack(12);
    replaced.replaceSkill();

    resolveAttacks();
    expect(dead.trigger).not.toHaveBeenCalled();
    expect(replaced.trigger).not.toHaveBeenCalled();
  });
});
