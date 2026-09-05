export interface PossessionKillContext {
  extension: number;
  victimIsRealHero: boolean;
  victimIsIllusion: boolean;
  victimIsReincarnating: boolean;
  victimTeam: number;
  casterTeam: number;
  attackerIsTarget: boolean;
  attackerIsCaster: boolean;
  attackerPlayerId: number;
  casterPlayerId?: number;
  attackerOwnerIsTargetOrCaster: boolean;
}

export interface CleanupStage {
  name: string;
  run: () => void;
}

export function shouldExtendPossession(context: PossessionKillContext): boolean {
  return (
    context.extension > 0 &&
    context.victimIsRealHero &&
    !context.victimIsIllusion &&
    !context.victimIsReincarnating &&
    context.victimTeam !== context.casterTeam &&
    (context.attackerIsTarget ||
      context.attackerIsCaster ||
      context.attackerPlayerId === context.casterPlayerId ||
      context.attackerOwnerIsTargetOrCaster)
  );
}

export function extendPossessionDuration(remaining: number, extension: number): number {
  return Math.max(0, remaining) + Math.max(0, extension);
}

export function uniqueAbilityNames(names: Array<string | undefined>): string[] {
  const seen: Record<string, true> = {};
  const result: string[] = [];
  for (const name of names) {
    if (!name || seen[name]) continue;
    seen[name] = true;
    result.push(name);
  }
  return result;
}

export function runBestEffortCleanup(
  stages: CleanupStage[],
  onError: (stageName: string, error: unknown) => void,
): void {
  for (const stage of stages) {
    try {
      stage.run();
    } catch (error) {
      onError(stage.name, error);
    }
  }
}
