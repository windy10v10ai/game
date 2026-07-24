const PERMANENT_IMMOLATION_ABILITY = 'warlock_golem_permanent_immolation';
const PERMANENT_IMMOLATION_DAMAGE_SPECIAL = 'aura_damage';

export function calculateWarlockAwakenDamagePerSecond(
  healthRegen: number,
  manaRegen: number,
  conversionPercent: number,
): number {
  if (conversionPercent <= 0) return 0;
  return Math.max(0, healthRegen + manaRegen) * (conversionPercent / 100);
}

export function calculateWarlockImmolationDamage(
  nativeDamage: number,
  healthRegen: number,
  manaRegen: number,
  conversionPercent: number,
): number {
  return (
    nativeDamage + calculateWarlockAwakenDamagePerSecond(healthRegen, manaRegen, conversionPercent)
  );
}

export function isWarlockImmolationDamageSpecial(
  abilityName: string,
  specialValueName: string,
): boolean {
  return (
    abilityName === PERMANENT_IMMOLATION_ABILITY &&
    specialValueName === PERMANENT_IMMOLATION_DAMAGE_SPECIAL
  );
}

export function isWarlockInfernalUnitName(unitName: string): boolean {
  return unitName === 'npc_dota_warlock_golem' || unitName.startsWith('npc_dota_warlock_golem_');
}

export interface WarlockInfernalCandidate {
  unitName: string;
  hasPermanentImmolation: boolean;
  ownerEntityIndex: number | undefined;
  warlockEntityIndex: number;
  unitPlayerOwnerId: number;
  warlockPlayerOwnerId: number;
}

export function isOwnedWarlockInfernalCandidate(candidate: WarlockInfernalCandidate): boolean {
  if (!isWarlockInfernalUnitName(candidate.unitName) || !candidate.hasPermanentImmolation) {
    return false;
  }

  if (candidate.ownerEntityIndex !== undefined) {
    return candidate.ownerEntityIndex === candidate.warlockEntityIndex;
  }

  return (
    candidate.unitPlayerOwnerId >= 0 &&
    candidate.warlockPlayerOwnerId >= 0 &&
    candidate.unitPlayerOwnerId === candidate.warlockPlayerOwnerId
  );
}
