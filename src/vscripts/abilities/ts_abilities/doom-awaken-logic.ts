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

export interface DoomAwakenedTalentStateInput {
  hasMuteTalent: boolean;
  hasBreakTalent: boolean;
}

export interface DoomAwakenedTalentStates {
  muted: boolean;
  passivesDisabled: boolean;
}

export function getDoomAwakenedTalentStates({
  hasMuteTalent,
  hasBreakTalent,
}: DoomAwakenedTalentStateInput): DoomAwakenedTalentStates {
  return {
    muted: hasMuteTalent,
    passivesDisabled: hasBreakTalent,
  };
}
