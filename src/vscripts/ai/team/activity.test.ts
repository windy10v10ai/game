import { Activity, ACTIVITY_LIMIT, ACTIVITY_REST, ActivityTracker } from './activity';

const counts = (entries: [Activity, number][]) => new Map<Activity, number>(entries);
const none = new Set<Activity>();

describe('ActivityTracker', () => {
  const run = (tracker: ActivityTracker, activity: Activity, from: number, to: number) => {
    for (let now = from; now <= to; now++) {
      tracker.Update(counts([[activity, 6]]), 10, none, now);
    }
  };

  it('rests an activity the team has been stuck on too long', () => {
    const tracker = new ActivityTracker();
    run(tracker, 'fight', 0, ACTIVITY_LIMIT.fight - 1);
    expect(tracker.Resting(ACTIVITY_LIMIT.fight - 1).has('fight')).toBe(false);
    run(tracker, 'fight', ACTIVITY_LIMIT.fight, ACTIVITY_LIMIT.fight);
    expect(tracker.Resting(ACTIVITY_LIMIT.fight).has('fight')).toBe(true);
    expect(tracker.Resting(ACTIVITY_LIMIT.fight + ACTIVITY_REST).has('fight')).toBe(false);
  });

  it('keeps going while the activity makes progress', () => {
    const tracker = new ActivityTracker();
    for (let now = 0; now <= ACTIVITY_LIMIT.push * 2; now++) {
      const progress = now % 60 === 0 ? new Set<Activity>(['push']) : none;
      tracker.Update(counts([['push', 6]]), 10, progress, now);
    }
    expect(tracker.Resting(ACTIVITY_LIMIT.push * 2).has('push')).toBe(false);
  });

  it('only counts what at least half the team is doing', () => {
    const tracker = new ActivityTracker();
    for (let now = 0; now <= ACTIVITY_LIMIT.fight * 2; now++) {
      tracker.Update(counts([['fight', 4]]), 10, none, now);
    }
    expect(tracker.Resting(ACTIVITY_LIMIT.fight * 2).has('fight')).toBe(false);
  });

  it('does not restart the clock on a short switch', () => {
    const tracker = new ActivityTracker();
    run(tracker, 'fight', 0, 30);
    tracker.Update(counts([['push', 6]]), 10, none, 31);
    run(tracker, 'fight', 32, ACTIVITY_LIMIT.fight);
    expect(tracker.Resting(ACTIVITY_LIMIT.fight).has('fight')).toBe(true);
  });

  it('starts over after the team did something else for a while', () => {
    const tracker = new ActivityTracker();
    run(tracker, 'fight', 0, 30);
    run(tracker, 'push', 31, 60);
    run(tracker, 'fight', 61, ACTIVITY_LIMIT.fight + 30);
    expect(tracker.Resting(ACTIVITY_LIMIT.fight + 30).has('fight')).toBe(false);
  });
});
