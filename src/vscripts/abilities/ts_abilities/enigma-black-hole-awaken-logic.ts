export interface ResidenceState {
  residenceSeconds: number;
  controlSecondsRemaining: number;
}
export interface ResidenceTick extends ResidenceState {
  controlStarted: boolean;
}

export function createResidenceState(): ResidenceState {
  return { residenceSeconds: 0, controlSecondsRemaining: 0 };
}

export function getTickManaCost(manaPerSecond: number, intervalSeconds: number): number {
  return manaPerSecond * intervalSeconds;
}

export function tickResidence(
  state: ResidenceState,
  intervalSeconds: number,
  inRange: boolean,
  residenceRequiredSeconds = 5,
  controlDurationSeconds = 2,
): ResidenceState {
  if (!inRange) return createResidenceState();
  if (state.controlSecondsRemaining > 0) {
    return {
      residenceSeconds: 0,
      controlSecondsRemaining: Math.max(0, state.controlSecondsRemaining - intervalSeconds),
    };
  }
  const residenceSeconds = state.residenceSeconds + intervalSeconds;
  return residenceSeconds >= residenceRequiredSeconds
    ? { residenceSeconds: 0, controlSecondsRemaining: controlDurationSeconds }
    : { residenceSeconds, controlSecondsRemaining: 0 };
}

export function tickResidenceWithTransition(
  state: ResidenceState,
  intervalSeconds: number,
  inRange: boolean,
  residenceRequiredSeconds = 5,
  controlDurationSeconds = 2,
): ResidenceTick {
  const next = tickResidence(
    state,
    intervalSeconds,
    inRange,
    residenceRequiredSeconds,
    controlDurationSeconds,
  );
  return {
    ...next,
    controlStarted: state.controlSecondsRemaining <= 0 && next.controlSecondsRemaining > 0,
  };
}
