import { emitDailyChallengeDamageEvent } from './daily-challenge-damage-event';

let installedGameMode: CDOTABaseGameMode | undefined;

function onDamageFilter(event: DamageFilterEvent): boolean {
  if (!Number.isFinite(event.damage) || event.damage <= 0) {
    return true;
  }

  const attacker = EntIndexToHScript(event.entindex_attacker_const) as CDOTA_BaseNPC | undefined;
  const unit = EntIndexToHScript(event.entindex_victim_const) as CDOTA_BaseNPC | undefined;
  if (!attacker || !unit) {
    return true;
  }

  const inflictor =
    event.entindex_inflictor_const !== undefined && event.entindex_inflictor_const > 0
      ? (EntIndexToHScript(event.entindex_inflictor_const) as CDOTABaseAbility | undefined)
      : undefined;

  emitDailyChallengeDamageEvent({
    attacker,
    unit,
    damage: event.damage,
    damage_type: event.damagetype_const,
    ...(inflictor ? { inflictor } : {}),
  });
  return true;
}

/** Installs exactly one match-wide damage filter. */
export function installDailyChallengeDamageObserver(): void {
  const gameMode = GameRules.GetGameModeEntity();
  if (installedGameMode === gameMode) {
    return;
  }

  gameMode.SetDamageFilter((event) => onDamageFilter(event), {});
  installedGameMode = gameMode;
}
