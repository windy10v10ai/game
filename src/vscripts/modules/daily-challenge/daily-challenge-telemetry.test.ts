import { DailyChallengeMetricAccumulator } from './daily-challenge-accumulator';
import { DailyChallengeDamageEvent } from './daily-challenge-damage-event';
import { DailyChallengeModifierClassifierConstants } from './daily-challenge-modifier-classifier';
import {
  DailyChallengeTelemetry,
  DailyChallengeTelemetryDependencies,
  DailyChallengeTelemetryEntity,
} from './daily-challenge-telemetry';

const classifierConstants: DailyChallengeModifierClassifierConstants = {
  rootedState: 0 as modifierstate,
  silencedState: 3 as modifierstate,
  stunnedState: 5 as modifierstate,
  passivesDisabledState: 30 as modifierstate,
  tauntedState: 48 as modifierstate,
  slowFunctions: [20 as modifierfunction],
  slowModifierNames: ['modifier_verified_slow'],
};

type Listener = (event: Record<string, number>) => void;

const createEntity = ({
  entityIndex = 100,
  playerId = -1,
  team = 2,
  realHero = false,
  alive = true,
  illusion = false,
  unitName = 'npc_dota_creep',
  owner,
  modifiers = [],
}: {
  entityIndex?: number;
  playerId?: number;
  team?: number;
  realHero?: boolean;
  alive?: boolean;
  illusion?: boolean;
  unitName?: string;
  owner?: DailyChallengeTelemetryEntity;
  modifiers?: CDOTA_Buff[];
} = {}): DailyChallengeTelemetryEntity => ({
  GetEntityIndex: () => entityIndex as EntityIndex,
  GetPlayerOwnerID: () => playerId as PlayerID,
  GetOwnerEntity: () => owner,
  GetTeamNumber: () => team as DOTATeam_t,
  IsRealHero: () => realHero,
  IsIllusion: () => illusion,
  IsAlive: () => alive,
  IsReincarnating: () => false,
  GetUnitName: () => unitName,
  FindAllModifiers: () => modifiers,
});

const createModifier = ({
  name = 'modifier_test_debuff',
  caster,
  auraOwner,
  debuff = true,
  stun = false,
  states = {},
  functions = [],
  duration = -1,
  remainingTime = -1,
}: {
  name?: string;
  caster?: DailyChallengeTelemetryEntity;
  auraOwner?: DailyChallengeTelemetryEntity;
  debuff?: boolean;
  stun?: boolean;
  states?: Record<number, boolean>;
  functions?: number[];
  duration?: number;
  remainingTime?: number;
}) =>
  ({
    GetName: () => name,
    IsNull: () => false,
    GetCaster: () => caster,
    GetAuraOwner: () => auraOwner,
    IsDebuff: () => debuff,
    IsStunDebuff: () => stun,
    GetDuration: () => duration,
    GetRemainingTime: () => remainingTime,
    CheckStateToTable: (target: Record<number, boolean>) => Object.assign(target, states),
    HasFunction: (func: modifierfunction) => functions.includes(func as number),
  }) as unknown as CDOTA_Buff;

const createHarness = () => {
  const accumulator = new DailyChallengeMetricAccumulator();
  const listeners = new Map<string, Listener>();
  let damageListener: ((event: DailyChallengeDamageEvent) => void) | undefined;
  const entities = new Map<number, DailyChallengeTelemetryEntity>();
  const botHeroes: DailyChallengeTelemetryEntity[] = [];
  let gameTime = 0;
  const scheduled: Array<{ seconds: number; callback: () => number | void }> = [];
  const deps: DailyChallengeTelemetryDependencies = {
    register: (eventName, listener) => listeners.set(eventName, listener),
    registerDamageObserver: (listener) => (damageListener = listener),
    schedule: (seconds, callback) => scheduled.push({ seconds, callback }),
    getGameTime: () => gameTime,
    getGameState: () => 7,
    entityFromIndex: (index) => entities.get(index),
    getBotHeroes: () => botHeroes,
    isValidPlayerId: (playerId): playerId is PlayerID => playerId >= 0 && playerId < 24,
    isFakeClient: (playerId) => playerId === (8 as PlayerID),
    getSteamAccountId: (playerId) =>
      playerId === (3 as PlayerID) ? 483215844 : playerId === (4 as PlayerID) ? 483215845 : 0,
    getPlayerTeam: (playerId) =>
      (playerId === (3 as PlayerID) || playerId === (4 as PlayerID) ? 2 : 3) as DOTATeam_t,
  };
  const telemetry = new DailyChallengeTelemetry(accumulator, deps, classifierConstants);
  return {
    accumulator,
    listeners,
    entities,
    botHeroes,
    scheduled,
    telemetry,
    emitDamage: (event: DailyChallengeDamageEvent) => damageListener?.(event),
    setGameTime: (value: number) => (gameTime = value),
  };
};

describe('DailyChallengeTelemetry', () => {
  it('runs only one modifier scan timer per active match lifecycle', () => {
    const harness = createHarness();

    expect(harness.scheduled).toHaveLength(0);

    harness.telemetry.startMatch();
    harness.telemetry.startMatch();
    expect(harness.scheduled).toHaveLength(1);

    harness.telemetry.stopMatch();
    harness.telemetry.stopMatch();
    expect(harness.scheduled[0].callback()).toBeUndefined();

    harness.telemetry.startMatch();
    expect(harness.scheduled).toHaveLength(2);
  });

  it('uses the centralized modifier damage event and falls back to the inflictor caster owner', () => {
    const harness = createHarness();
    const humanHero = createEntity({ entityIndex: 20, playerId: 3, team: 2, realHero: true });
    const mapSource = createEntity({ entityIndex: 21, team: 2 });
    const enemyBot = createEntity({ entityIndex: 10, playerId: 8, team: 3, realHero: true });
    const inflictor = { GetCaster: () => humanHero } as unknown as CDOTABaseAbility;
    harness.telemetry.startMatch();

    for (const [damageType, damage] of [
      [1, 101.9],
      [2, 202.8],
      [4, 303.7],
    ]) {
      harness.emitDamage({
        attacker: mapSource as unknown as CDOTA_BaseNPC,
        damage,
        damage_type: damageType as DAMAGE_TYPES,
        inflictor,
        unit: enemyBot as unknown as CDOTA_BaseNPC,
      } as ModifierInstanceEvent);
    }

    expect(harness.accumulator.read(3 as PlayerID)).toMatchObject({
      physical_damage: 101,
      magical_damage: 202,
      pure_damage: 303,
    });
    expect([...harness.listeners.keys()].sort()).toEqual([
      'entity_killed',
      'game_rules_state_change',
    ]);
  });

  it('only attributes duration to its human source on an enemy bot', () => {
    const harness = createHarness();
    const localHuman = createEntity({ playerId: 3, team: 2, realHero: true });
    const otherHuman = createEntity({ playerId: 4, team: 2, realHero: true });
    const friendlyBot = createEntity({
      entityIndex: 10,
      playerId: 8,
      team: 2,
      realHero: true,
      modifiers: [createModifier({ caster: localHuman, states: { 0: true } })],
    });
    const enemyBot = createEntity({
      entityIndex: 11,
      playerId: 8,
      team: 3,
      realHero: true,
      modifiers: [createModifier({ caster: otherHuman, states: { 0: true } })],
    });
    harness.botHeroes.push(friendlyBot, enemyBot);
    harness.telemetry.startMatch();

    harness.setGameTime(0.25);
    harness.scheduled[0].callback();

    expect(harness.accumulator.read(3 as PlayerID).root_duration_ms).toBeUndefined();
    expect(harness.accumulator.read(4 as PlayerID).root_duration_ms).toBe(250);
  });
  it('does not reset collected metrics when the in-progress state callback repeats', () => {
    const harness = createHarness();
    const enemyBot = createEntity({ entityIndex: 10, playerId: 8, team: 3, realHero: true });
    const humanHero = createEntity({ entityIndex: 20, playerId: 3, team: 2, realHero: true });
    const inflictor = { GetCaster: () => humanHero } as unknown as CDOTABaseAbility;

    harness.telemetry.startMatch();
    harness.emitDamage({
      attacker: humanHero as unknown as CDOTA_BaseNPC,
      damage: 125,
      damage_type: 1 as DAMAGE_TYPES,
      inflictor,
      unit: enemyBot as unknown as CDOTA_BaseNPC,
    } as ModifierInstanceEvent);

    harness.telemetry.startMatch();

    expect(harness.accumulator.read(3 as PlayerID)).toMatchObject({ physical_damage: 125 });
  });
  it('counts enemy bot hero kills and Roshan kills but excludes map and bot ownership', () => {
    const harness = createHarness();
    const humanHero = createEntity({ playerId: 3, team: 2, realHero: true });
    const botAttacker = createEntity({ playerId: 8, team: 3, realHero: true });
    const enemyBot = createEntity({ playerId: 8, team: 3, realHero: true });
    const roshan = createEntity({ team: 4, unitName: 'npc_dota_roshan' });
    harness.entities.set(1, enemyBot);
    harness.entities.set(2, humanHero);
    harness.entities.set(3, roshan);
    harness.entities.set(4, botAttacker);
    harness.telemetry.startMatch();

    harness.listeners.get('entity_killed')?.({ entindex_killed: 1, entindex_attacker: 2 });
    harness.listeners.get('entity_killed')?.({ entindex_killed: 3, entindex_attacker: 2 });
    harness.listeners.get('entity_killed')?.({ entindex_killed: 3, entindex_attacker: 4 });

    expect(harness.accumulator.read(3 as PlayerID)).toMatchObject({
      bot_kills: 1,
      roshan_kills: 1,
    });
  });

  it('scans live enemy bot modifiers with actual GameTime delta and deduplicates overlaps', () => {
    const harness = createHarness();
    const humanHero = createEntity({ playerId: 3, team: 2, realHero: true });
    const rootA = createModifier({ caster: humanHero, states: { 0: true } });
    const rootB = createModifier({ caster: humanHero, states: { 0: true } });
    const slow = createModifier({
      name: 'modifier_verified_slow',
      caster: humanHero,
      functions: [20],
    });
    const enemyBot = createEntity({
      playerId: 8,
      team: 3,
      realHero: true,
      modifiers: [rootA, rootB, slow],
    });
    harness.botHeroes.push(enemyBot);
    harness.telemetry.startMatch();

    harness.setGameTime(0.25);
    expect(harness.scheduled[0].callback()).toBe(0.25);

    expect(harness.accumulator.read(3 as PlayerID)).toEqual({
      root_duration_ms: 250,
      slow_duration_ms: 250,
      debuff_duration_ms: 250,
    });
  });

  it('does not accrue finite-duration modifiers that remain listed after their duration expires', () => {
    const harness = createHarness();
    const humanHero = createEntity({ playerId: 3, team: 2, realHero: true });
    const expiredSilence = createModifier({
      name: 'modifier_silencer_global_silence',
      caster: humanHero,
      duration: 4.5,
      remainingTime: 0,
    });
    harness.botHeroes.push(
      createEntity({ playerId: 8, team: 3, realHero: true, modifiers: [expiredSilence] }),
    );
    harness.telemetry.startMatch();

    harness.setGameTime(0.25);
    harness.scheduled[0].callback();

    expect(harness.accumulator.read(3 as PlayerID).debuff_duration_ms).toBeUndefined();
  });

  it('ignores duration effects that were already active when the task was accepted until they end', () => {
    const harness = createHarness();
    const humanHero = createEntity({ playerId: 3, team: 2, realHero: true });
    const activeBeforeAcceptance = createModifier({ caster: humanHero });
    const modifiers: CDOTA_Buff[] = [activeBeforeAcceptance];
    const enemyBot = createEntity({
      playerId: 8,
      team: 3,
      realHero: true,
      modifiers,
    });
    harness.botHeroes.push(enemyBot);
    harness.telemetry.startMatch();

    harness.setGameTime(0.25);
    harness.scheduled[0].callback();
    expect(harness.accumulator.read(3 as PlayerID).debuff_duration_ms).toBe(250);

    harness.telemetry.ignoreCurrentlyActiveEffectsForMetric(3 as PlayerID, 'debuff_duration_ms');
    harness.setGameTime(0.5);
    harness.scheduled[0].callback();
    expect(harness.accumulator.read(3 as PlayerID).debuff_duration_ms).toBe(250);

    modifiers.length = 0;
    harness.setGameTime(0.75);
    harness.scheduled[0].callback();

    modifiers.push(createModifier({ caster: humanHero }));
    harness.setGameTime(1);
    harness.scheduled[0].callback();
    expect(harness.accumulator.read(3 as PlayerID).debuff_duration_ms).toBe(500);
  });

  it('deduplicates duplicate target entities by the bot player id', () => {
    const harness = createHarness();
    const humanHero = createEntity({ entityIndex: 20, playerId: 3, team: 2, realHero: true });
    const root = createModifier({ caster: humanHero, states: { 0: true } });
    harness.botHeroes.push(
      createEntity({
        entityIndex: 10,
        playerId: 8,
        team: 3,
        realHero: true,
        modifiers: [root],
      }),
      createEntity({
        entityIndex: 11,
        playerId: 8,
        team: 3,
        realHero: true,
        modifiers: [root],
      }),
    );
    harness.telemetry.startMatch();

    harness.setGameTime(0.25);
    harness.scheduled[0].callback();

    expect(harness.accumulator.read(3 as PlayerID).root_duration_ms).toBe(250);
  });

  it('caps abnormal timer gaps and stops accruing after the modifier is gone or the target dies', () => {
    const harness = createHarness();
    const humanHero = createEntity({ playerId: 3, team: 2, realHero: true });
    const stun = createModifier({ caster: humanHero, stun: true });
    let alive = true;
    let modifiers: CDOTA_Buff[] = [stun];
    const enemyBot = createEntity({ playerId: 8, team: 3, realHero: true });
    enemyBot.IsAlive = () => alive;
    enemyBot.FindAllModifiers = () => modifiers;
    harness.botHeroes.push(enemyBot);
    harness.telemetry.startMatch();

    harness.setGameTime(10);
    harness.scheduled[0].callback();
    expect(harness.accumulator.read(3 as PlayerID).stun_duration_ms).toBe(1000);

    modifiers = [];
    harness.setGameTime(10.25);
    harness.scheduled[0].callback();
    alive = false;
    harness.setGameTime(10.5);
    harness.scheduled[0].callback();
    expect(harness.accumulator.read(3 as PlayerID).stun_duration_ms).toBe(1000);
  });
});
