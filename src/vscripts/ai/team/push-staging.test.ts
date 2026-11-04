import { startGroupPush, updateGroupPush } from './group-push';
import { resolveChaseFront, resolveOuterTowerState } from './push-staging';

const base = {
  targetForward: 7000,
  tier4Forwards: [9000, 9200],
  baseForward: 9500,
  outerTowersLeft: false,
  tower3Pushed: false,
};

describe('chase front', () => {
  it('stops at the push target while outer towers stand', () => {
    expect(resolveChaseFront({ ...base, outerTowersLeft: true })).toBe(7000);
  });

  it('reaches the outer tier 4 tower while all three tier 3 towers stand', () => {
    expect(resolveChaseFront(base)).toBe(8300);
  });

  it('reaches the base once any tier 3 tower is down', () => {
    expect(resolveChaseFront({ ...base, tower3Pushed: true })).toBe(9100);
  });

  it('keeps the push target when it is already deeper than the chase line', () => {
    expect(resolveChaseFront({ ...base, tower3Pushed: true, targetForward: 9300 })).toBe(9300);
  });

  it('falls back to the push target when the base is gone', () => {
    expect(resolveChaseFront({ ...base, tower3Pushed: true, baseForward: undefined })).toBe(7000);
  });

  it('falls back to the push target when no tier 4 tower is left', () => {
    expect(resolveChaseFront({ ...base, tier4Forwards: [] })).toBe(7000);
  });
});

describe('outer tower state', () => {
  const active = { ...startGroupPush(0), activeSince: 100 };
  const calm = { enemyDownShare: 0, longestRespawn: 0, now: 200 };

  it('drives the chase tier and the group push cooldown from one source', () => {
    const down = resolveOuterTowerState(0);
    expect(down).toEqual({ outerTowersLeft: false, enemyOuterTowersDown: true });
    expect(resolveChaseFront({ ...base, outerTowersLeft: down.outerTowersLeft })).toBe(8300);
    expect(
      updateGroupPush(active, { ...calm, enemyOuterTowersDown: down.enemyOuterTowersDown }),
    ).toEqual({
      cooldownUntil: 320,
      fallbackAt: 380,
    });

    const left = resolveOuterTowerState(6);
    expect(left).toEqual({ outerTowersLeft: true, enemyOuterTowersDown: false });
    expect(resolveChaseFront({ ...base, outerTowersLeft: left.outerTowersLeft })).toBe(7000);
    expect(
      updateGroupPush(active, { ...calm, enemyOuterTowersDown: left.enemyOuterTowersDown }),
    ).toEqual({
      cooldownUntil: 380,
      fallbackAt: 500,
    });
  });
});
