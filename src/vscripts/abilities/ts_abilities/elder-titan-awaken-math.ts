export interface SpiritWrapperState {
  waitingForReturn: boolean;
  returnHidden: boolean;
}

export function shouldRestoreAwakenWrapper(state: SpiritWrapperState): boolean {
  return state.waitingForReturn && state.returnHidden;
}

export function shouldTrackPendingSpiritReturn(returnHidden: boolean): boolean {
  return !returnHidden;
}
