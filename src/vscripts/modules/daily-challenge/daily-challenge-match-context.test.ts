import { DailyChallengeMatchContext } from './daily-challenge-match-context';

describe('DailyChallengeMatchContext', () => {
  it('counts a task accepted within ten minutes and stores the current metric baseline', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);

    const state = context.recordAcceptance(483215844, 'assignment-1', 599, {
      hero_damage: 120000,
      healing: 5000,
    });

    expect(state.eligibleForCurrentMatch).toBe(true);
    expect(state.baseline.hero_damage).toBe(120000);
    expect(context.getMetricDelta(483215844, 'hero_damage', 170000)).toBe(50000);
  });

  it('does not count current-match progress when the task is accepted after ten minutes', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);

    const state = context.recordAcceptance(483215844, 'assignment-late', 601, {
      hero_damage: 120000,
    });

    expect(state.eligibleForCurrentMatch).toBe(false);
    expect(context.getMetricDelta(483215844, 'hero_damage', 170000)).toBe(0);
  });

  it('never returns a negative delta and keeps the first accepted baseline on duplicate success', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);
    const first = context.recordAcceptance(483215844, 'assignment-1', 300, {
      healing: 10000,
    });
    const duplicate = context.recordAcceptance(483215844, 'assignment-1', 320, {
      healing: 20000,
    });

    expect(duplicate).toEqual(first);
    expect(context.getMetricDelta(483215844, 'healing', 9000)).toBe(0);
  });

  it('replaces the provisional setup day with the authoritative GAME_IN_PROGRESS day', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-03', -120);
    context.recordAcceptance(483215844, 'old-day-assignment', -60, {});

    context.confirmMatchStart('2026-08-04', 0, '2026-08-04T00:00:05.000Z');

    expect(context.getDayId()).toBe('2026-08-04');
    expect(context.getMatchStartedAt()).toBe('2026-08-04T00:00:05.000Z');
    expect(context.isMatchStartConfirmed()).toBe(true);
    expect(context.getAcceptedState(483215844)).toBeUndefined();
  });

  it('keeps the first same-day GAME_IN_PROGRESS time anchor on duplicate confirmation', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);
    context.confirmMatchStart('2026-08-04', 0, '2026-08-04T00:00:00.000Z');

    context.confirmMatchStart('2026-08-04', 60, '2026-08-04T00:01:00.000Z');
    const state = context.recordAcceptance(483215844, 'assignment-1', 601, {});

    expect(state.eligibleForCurrentMatch).toBe(false);
    expect(context.getMatchStartedAt()).toBe('2026-08-04T00:01:00.000Z');
  });
  it('rejects an older challenge-day confirmation without mutating current match state', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-05', 0, '2026-08-05T00:00:00.000Z');
    context.confirmMatchStart('2026-08-05', 0, '2026-08-05T00:00:05.000Z');
    context.recordAcceptance(483215844, 'current-day-assignment', 30, { hero_damage: 1000 });

    const accepted = context.confirmMatchStart('2026-08-04', 60, '2026-08-04T00:01:00.000Z');

    expect(accepted).toBe(false);
    expect(context.getDayId()).toBe('2026-08-05');
    expect(context.getMatchStartedAt()).toBe('2026-08-05T00:00:05.000Z');
    expect(context.getAcceptedState(483215844)?.assignmentId).toBe('current-day-assignment');
  });
  it('preserves same-day accepted tasks while rebasing the ten-minute window to GAME_IN_PROGRESS', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', -120);
    context.recordAcceptance(483215844, 'same-day-assignment', -60, { hero_damage: 1000 });

    context.confirmMatchStart('2026-08-04', 0, '2026-08-04T01:00:00.000Z');
    const late = context.recordAcceptance(111, 'late-assignment', 601, {});

    expect(context.getAcceptedState(483215844)?.assignmentId).toBe('same-day-assignment');
    expect(late.eligibleForCurrentMatch).toBe(false);
  });
});
