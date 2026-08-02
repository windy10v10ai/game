import { advanceHammerAttackCount } from './omniknight-awaken-logic';

describe('Omniknight awaken attack counter', () => {
  it('fills the counter with three valid attacks and consumes it only after native Hammer procs', () => {
    expect(advanceHammerAttackCount(0, 3, true, false)).toEqual({
      count: 1,
      triggerHammer: false,
    });
    expect(advanceHammerAttackCount(1, 3, true, false)).toEqual({
      count: 2,
      triggerHammer: false,
    });
    expect(advanceHammerAttackCount(2, 3, true, false)).toEqual({
      count: 3,
      triggerHammer: false,
    });
    expect(advanceHammerAttackCount(3, 3, true, false)).toEqual({
      count: 3,
      triggerHammer: false,
    });
    expect(advanceHammerAttackCount(3, 3, true, true)).toEqual({
      count: 0,
      triggerHammer: true,
    });
  });

  it('does not advance or consume a ready proc for invalid attacks', () => {
    expect(advanceHammerAttackCount(2, 3, false, false)).toEqual({
      count: 2,
      triggerHammer: false,
    });
    expect(advanceHammerAttackCount(3, 3, false, true)).toEqual({
      count: 3,
      triggerHammer: false,
    });
  });

  it('normalizes stale counters and invalid thresholds', () => {
    expect(advanceHammerAttackCount(8, 3, true, true)).toEqual({
      count: 0,
      triggerHammer: true,
    });
    expect(advanceHammerAttackCount(-2, 3, true, false)).toEqual({
      count: 1,
      triggerHammer: false,
    });
    expect(advanceHammerAttackCount(0, 0, true, false)).toEqual({
      count: 1,
      triggerHammer: false,
    });
    expect(advanceHammerAttackCount(1, 0, true, true)).toEqual({
      count: 0,
      triggerHammer: true,
    });
  });
});
