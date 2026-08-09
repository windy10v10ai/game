import {
  createDailyChallengeBaseMetricSnapshot,
  mergeDailyChallengeMetricSnapshots,
} from './daily-challenge-metric-snapshot';

describe('createDailyChallengeBaseMetricSnapshot', () => {
  it('maps the stable game-end scoreboard fields to challenge metrics', () => {
    expect(
      createDailyChallengeBaseMetricSnapshot({
        heroDamage: 500000,
        damageTaken: 320000,
        healing: 100000,
        kills: 12,
        assists: 34,
        lastHits: 456,
        towerKills: 7,
      }),
    ).toEqual({
      hero_damage: 500000,
      damage_taken: 320000,
      healing: 100000,
      kills: 12,
      assists: 34,
      last_hits: 456,
      tower_kills: 7,
    });
  });

  it('normalizes invalid, fractional and negative engine values before they enter the integer API DTO', () => {
    expect(
      createDailyChallengeBaseMetricSnapshot({
        heroDamage: Number.NaN,
        damageTaken: Number.POSITIVE_INFINITY,
        healing: -1,
        kills: 2.9,
        assists: 3.1,
        lastHits: 4.8,
        towerKills: 1.2,
      }),
    ).toEqual({
      hero_damage: 0,
      damage_taken: 0,
      healing: 0,
      kills: 2,
      assists: 3,
      last_hits: 4,
      tower_kills: 1,
    });
  });
});

describe('mergeDailyChallengeMetricSnapshots', () => {
  it('preserves v1 scoreboard metrics and adds normalized v2 accumulator metrics', () => {
    expect(
      mergeDailyChallengeMetricSnapshots(
        { hero_damage: 500000, healing: 100000 },
        {
          physical_damage: 300000.9,
          magical_damage: 150000.8,
          pure_damage: 50000.7,
          bot_kills: 12.9,
          slow_duration_ms: 1250.9,
        },
      ),
    ).toEqual({
      hero_damage: 500000,
      healing: 100000,
      physical_damage: 300000,
      magical_damage: 150000,
      pure_damage: 50000,
      bot_kills: 12,
      slow_duration_ms: 1250,
    });
  });
});
