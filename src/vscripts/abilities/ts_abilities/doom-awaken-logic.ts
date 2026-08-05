export interface DoomAwakenedFriendlyTargetInput {
  hasScepter: boolean;
  sameTeam: boolean;
  isRealHero: boolean;
}

export function isDoomAwakenedFriendlyTarget({
  hasScepter,
  sameTeam,
  isRealHero,
}: DoomAwakenedFriendlyTargetInput): boolean {
  return hasScepter && sameTeam && isRealHero;
}

export interface DoomAwakenedStateInput {
  hasMuteTalent: boolean;
  doesBreak: boolean;
}

export interface DoomAwakenedStates {
  muted: boolean;
  passivesDisabled: boolean;
}

export function getDoomAwakenedStates({
  hasMuteTalent,
  doesBreak,
}: DoomAwakenedStateInput): DoomAwakenedStates {
  return {
    muted: hasMuteTalent,
    passivesDisabled: doesBreak,
  };
}
