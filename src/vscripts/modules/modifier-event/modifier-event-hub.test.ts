type Hub = typeof import('./modifier-event-hub').ModifierEventHub;

const engine = globalThis as unknown as Record<string, unknown>;
let hub: Hub;
let spawnedListeners = 0;
let removedListeners = 0;

function fakeUnit(index: number): CDOTA_BaseNPC {
  return { entindex: () => index as EntityIndex } as unknown as CDOTA_BaseNPC;
}

function damageEvent(attacker: CDOTA_BaseNPC, unit: CDOTA_BaseNPC, damage = 100) {
  return { attacker, unit, damage } as unknown as ModifierInstanceEvent;
}

beforeAll(() => {
  engine._G = globalThis;
  engine.DotaTeam = { NOTEAM: 0 };
  engine.Vector = () => ({});
  engine.CreateModifierThinker = () => {
    spawnedListeners += 1;
    return { IsNull: () => false } as unknown as CDOTA_BaseNPC;
  };
  engine.UTIL_Remove = () => {
    removedListeners += 1;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  hub = (require('./modifier-event-hub') as typeof import('./modifier-event-hub')).ModifierEventHub;
});

beforeEach(() => {
  spawnedListeners = 0;
  removedListeners = 0;
});

describe('ModifierEventHub damage by victim', () => {
  const centaur = fakeUnit(1);
  const enemy = fakeUnit(2);

  it('calls the handler once when the registered unit takes damage', () => {
    const owner = {};
    const received: ModifierInstanceEvent[] = [];
    hub.RegisterDamageByVictim(centaur, owner, (event) => received.push(event));

    hub.DispatchDamage(damageEvent(enemy, centaur));
    hub.DispatchDamage(damageEvent(centaur, enemy));

    expect(received).toHaveLength(1);
    hub.UnregisterDamageByVictim(centaur, owner);
  });

  it('stops calling the handler after unregistering', () => {
    const owner = {};
    const received: ModifierInstanceEvent[] = [];
    hub.RegisterDamageByVictim(centaur, owner, (event) => received.push(event));
    hub.UnregisterDamageByVictim(centaur, owner);

    hub.DispatchDamage(damageEvent(enemy, centaur));

    expect(received).toHaveLength(0);
  });

  it('skips small damage like the attacker channel', () => {
    const owner = {};
    const received: ModifierInstanceEvent[] = [];
    hub.RegisterDamageByVictim(centaur, owner, (event) => received.push(event));

    hub.DispatchDamage(damageEvent(enemy, centaur, 19));

    expect(received).toHaveLength(0);
    hub.UnregisterDamageByVictim(centaur, owner);
  });

  it('shares one listener with the attacker channel until both are empty', () => {
    const victimOwner = {};
    const attackerOwner = {};
    hub.RegisterDamageByAttacker(enemy, attackerOwner, () => undefined);
    hub.RegisterDamageByVictim(centaur, victimOwner, () => undefined);
    expect(spawnedListeners).toBe(1);

    hub.UnregisterDamageByAttacker(enemy, attackerOwner);
    expect(removedListeners).toBe(0);

    hub.UnregisterDamageByVictim(centaur, victimOwner);
    expect(removedListeners).toBe(1);
  });
});
