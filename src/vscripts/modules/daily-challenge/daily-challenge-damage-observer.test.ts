import { setDailyChallengeDamageEventListener } from './daily-challenge-damage-event';
import { installDailyChallengeDamageObserver } from './daily-challenge-damage-observer';

type DamageObserverTestGlobals = {
  GameRules: {
    GetGameModeEntity: () => {
      SetDamageFilter: (callback: (event: DamageFilterEvent) => boolean) => void;
    };
  };
  CreateModifierThinker: (...args: unknown[]) => unknown;
  EntIndexToHScript: (index: number) => unknown;
};

const testGlobals = globalThis as unknown as DamageObserverTestGlobals;

describe('installDailyChallengeDamageObserver', () => {
  it('registers one game-wide damage filter instead of attaching to a single thinker', () => {
    const setDamageFilter = jest.fn();
    const createModifierThinker = jest.fn(() => ({ IsNull: () => false }));
    testGlobals.GameRules = {
      GetGameModeEntity: () => ({ SetDamageFilter: setDamageFilter }),
    };
    testGlobals.CreateModifierThinker = createModifierThinker;

    installDailyChallengeDamageObserver();

    expect(setDamageFilter).toHaveBeenCalledTimes(1);
    expect(createModifierThinker).not.toHaveBeenCalled();
  });

  it('resolves the filter indexes and forwards damage without cancelling it', () => {
    const attacker = {} as CDOTA_BaseNPC;
    const victim = {} as CDOTA_BaseNPC;
    const inflictor = {} as CDOTABaseAbility;
    const entities = new Map<number, unknown>([
      [11, attacker],
      [22, victim],
      [33, inflictor],
    ]);
    let filter: ((event: DamageFilterEvent) => boolean) | undefined;
    const gameMode = {
      SetDamageFilter: (callback: (event: DamageFilterEvent) => boolean) => {
        filter = callback;
      },
    };
    let received: unknown;
    setDailyChallengeDamageEventListener((event) => {
      received = event;
    });
    testGlobals.GameRules = { GetGameModeEntity: () => gameMode };
    testGlobals.EntIndexToHScript = (index: number) => entities.get(index);

    installDailyChallengeDamageObserver();

    expect(filter).toBeDefined();
    expect(
      filter?.({
        entindex_attacker_const: 11 as EntityIndex,
        entindex_victim_const: 22 as EntityIndex,
        entindex_inflictor_const: 33 as EntityIndex,
        damagetype_const: 2 as DAMAGE_TYPES,
        damage: 123.5,
      }),
    ).toBe(true);
    expect(received).toEqual({
      attacker,
      unit: victim,
      inflictor,
      damage: 123.5,
      damage_type: 2,
    });
  });
});
