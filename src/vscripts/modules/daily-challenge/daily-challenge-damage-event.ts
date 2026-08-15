export type DailyChallengeDamageEvent = Pick<
  ModifierInstanceEvent,
  'attacker' | 'unit' | 'damage' | 'damage_type' | 'inflictor'
>;

export type DailyChallengeDamageEventListener = (event: DailyChallengeDamageEvent) => void;

let activeListener: DailyChallengeDamageEventListener | undefined;

export function setDailyChallengeDamageEventListener(
  listener: DailyChallengeDamageEventListener,
): void {
  activeListener = listener;
}

export function emitDailyChallengeDamageEvent(event: DailyChallengeDamageEvent): void {
  activeListener?.(event);
}
