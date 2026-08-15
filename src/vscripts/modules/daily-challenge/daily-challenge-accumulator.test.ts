import { DailyChallengeMetricAccumulator } from './daily-challenge-accumulator';

describe('DailyChallengeMetricAccumulator', () => {
  it('accumulates advanced metrics per human player and exposes integer snapshots', () => {
    const accumulator = new DailyChallengeMetricAccumulator();

    accumulator.add(3 as PlayerID, 'physical_damage', 100.8);
    accumulator.add(3 as PlayerID, 'physical_damage', 20.7);
    accumulator.add(3 as PlayerID, 'stun_duration_ms', 250.9);
    accumulator.add(4 as PlayerID, 'physical_damage', 999);
    accumulator.add(3 as PlayerID, 'physical_damage', Number.POSITIVE_INFINITY);
    accumulator.add(3 as PlayerID, 'physical_damage', -50);

    expect(accumulator.read(3 as PlayerID)).toEqual({
      physical_damage: 121,
      stun_duration_ms: 250,
    });
    expect(accumulator.read(4 as PlayerID)).toEqual({ physical_damage: 999 });
  });

  it('resets all match-local metrics without leaking mutable snapshots', () => {
    const accumulator = new DailyChallengeMetricAccumulator();
    accumulator.add(3 as PlayerID, 'bot_kills', 1);

    const snapshot = accumulator.read(3 as PlayerID);
    snapshot.bot_kills = 99;
    expect(accumulator.read(3 as PlayerID)).toEqual({ bot_kills: 1 });

    accumulator.reset();
    expect(accumulator.read(3 as PlayerID)).toEqual({});
  });
});
