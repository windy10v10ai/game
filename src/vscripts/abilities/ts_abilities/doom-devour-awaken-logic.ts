export interface DevourAbilityEntry {
  name: string;
  entityIndex: number;
}

export function getUniqueDevourAbilityNames(abilityNames: Array<string | undefined>): string[] {
  const uniqueNames: string[] = [];
  for (const abilityName of abilityNames) {
    if (!abilityName || uniqueNames.includes(abilityName)) continue;
    uniqueNames.push(abilityName);
  }
  return uniqueNames;
}

export function selectTrackedDevourAbilityEntityIndexes(
  trackedAbilityNames: string[],
  currentAbilities: DevourAbilityEntry[],
): number[] {
  const trackedNames = getUniqueDevourAbilityNames(trackedAbilityNames);
  const selected: number[] = [];

  for (const ability of currentAbilities) {
    if (!trackedNames.includes(ability.name)) continue;
    if (!selected.includes(ability.entityIndex)) selected.push(ability.entityIndex);
  }

  return selected;
}

interface DevourAbilityKeyValues {
  MaxLevel?: unknown;
  AbilityValues?: unknown;
}

function readDeclaredPositiveInteger(value: unknown): number {
  if (typeof value === 'number') return value > 0 ? Math.floor(value) : 0;
  if (typeof value !== 'string') return 0;

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function getLongestNumericLevelList(value: unknown): number {
  if (typeof value === 'number') return 1;
  if (typeof value === 'string') {
    const entries = value
      .trim()
      .split(' ')
      .filter((entry) => entry.length > 0);
    if (entries.length === 0 || entries.some((entry) => !Number.isFinite(Number(entry)))) return 0;
    return entries.length;
  }
  if (!value || typeof value !== 'object') return 0;

  let longest = 0;
  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    longest = Math.max(longest, getLongestNumericLevelList(nestedValue));
  }
  return longest;
}

export function getDevourAbilityHighestDeclaredLevel(abilityKeyValues: unknown): number {
  const keyValues = abilityKeyValues as DevourAbilityKeyValues | undefined;
  return Math.max(
    1,
    readDeclaredPositiveInteger(keyValues?.MaxLevel),
    getLongestNumericLevelList(keyValues?.AbilityValues),
  );
}
