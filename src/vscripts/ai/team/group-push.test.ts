import { GroupPushState, startGroupPush, updateGroupPush } from './group-push';

const calm = { enemyDownShare: 0, longestRespawn: 0 };
const wiped = { enemyDownShare: 1, longestRespawn: 40 };

describe('group push', () => {
  const fresh = startGroupPush(0);

  it('starts when the enemy is dead for a while', () => {
    expect(updateGroupPush(fresh, { ...calm, now: 100 }).activeSince).toBeUndefined();
    expect(updateGroupPush(fresh, { ...wiped, now: 100 }).activeSince).toBe(100);
  });

  it('does not start for a short respawn or during the cooldown', () => {
    expect(
      updateGroupPush(fresh, { enemyDownShare: 1, longestRespawn: 5, now: 100 }).activeSince,
    ).toBeUndefined();
    expect(updateGroupPush(fresh, { ...wiped, now: 10 }).activeSince).toBeUndefined();
  });

  it('starts on the fallback timer even when nobody died', () => {
    expect(updateGroupPush(fresh, { ...calm, now: 1000 }).activeSince).toBe(1000);
  });

  it('keeps going while the enemy is down and ends after the enemy is back', () => {
    const active: GroupPushState = { ...fresh, activeSince: 100 };
    expect(updateGroupPush(active, { ...wiped, now: 160 }).activeSince).toBe(100);
    expect(updateGroupPush(active, { ...calm, now: 120 }).activeSince).toBe(100);
    const ended = updateGroupPush(active, { ...calm, now: 160 });
    expect(ended.activeSince).toBeUndefined();
    expect(updateGroupPush(ended, { ...wiped, now: 170 }).activeSince).toBeUndefined();
  });

  it('never lasts past the time cap', () => {
    const active: GroupPushState = { ...fresh, activeSince: 100 };
    expect(updateGroupPush(active, { ...wiped, now: 300 }).activeSince).toBeUndefined();
  });
});
