import {
  createResidenceState,
  getTickManaCost,
  tickResidence,
  tickResidenceWithTransition,
} from './enigma-black-hole-awaken-logic';
describe('enigma alternate black hole residence timing', () => {
  it('reaches control readiness after five seconds in range', () => {
    let state = createResidenceState();
    for (let i = 0; i < 20; i += 1) state = tickResidence(state, 0.25, true);
    expect(state.residenceSeconds).toBe(0);
    expect(state.controlSecondsRemaining).toBe(2);
  });

  it('leaving range clears residence immediately', () => {
    let state = createResidenceState();
    state = tickResidence(state, 2, true);
    state = tickResidence(state, 0.25, false);
    expect(state.residenceSeconds).toBe(0);
    expect(state.controlSecondsRemaining).toBe(0);
  });

  it('control window does not accumulate and restarts residence after control', () => {
    let state = createResidenceState();
    state = tickResidence(state, 5, true);
    expect(state.controlSecondsRemaining).toBe(2);
    state = tickResidence(state, 1, true);
    expect(state.controlSecondsRemaining).toBe(1);
    expect(state.residenceSeconds).toBe(0);
    state = tickResidence(state, 1, true);
    expect(state.controlSecondsRemaining).toBe(0);
    expect(state.residenceSeconds).toBe(0);
    state = tickResidence(state, 0.25, true);
    expect(state.residenceSeconds).toBe(0.25);
  });

  it('prorates mana cost by fixed tick interval', () => {
    expect(getTickManaCost(60, 0.25)).toBe(15);
    expect(getTickManaCost(80, 0.25)).toBe(20);
  });
  it('only marks control on the residence transition', () => {
    let state = createResidenceState();
    for (let i = 0; i < 19; i += 1) state = tickResidenceWithTransition(state, 0.25, true);
    const started = tickResidenceWithTransition(state, 0.25, true);
    expect(started.controlStarted).toBe(true);
    expect(tickResidenceWithTransition(started, 0.25, true).controlStarted).toBe(false);
  });
});
