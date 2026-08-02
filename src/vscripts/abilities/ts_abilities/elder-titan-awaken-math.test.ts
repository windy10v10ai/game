import {
  shouldRestoreAwakenWrapper,
  shouldTrackPendingSpiritReturn,
} from './elder-titan-awaken-math';

describe('shouldTrackPendingSpiritReturn', () => {
  it('tracks a spirit cast that was already active before awakening', () => {
    expect(shouldTrackPendingSpiritReturn(false)).toBe(true);
    expect(shouldTrackPendingSpiritReturn(true)).toBe(false);
  });
});

describe('shouldRestoreAwakenWrapper', () => {
  const shouldRestore = (waitingForReturn: boolean, returnHidden: boolean): boolean =>
    shouldRestoreAwakenWrapper({ waitingForReturn, returnHidden });

  it('restores only after a delegated spirit cast has returned and hidden the return ability', () => {
    expect(shouldRestore(true, true)).toBe(true);
    expect(shouldRestore(true, false)).toBe(false);
    expect(shouldRestore(false, true)).toBe(false);
  });
});
