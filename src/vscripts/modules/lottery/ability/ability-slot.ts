export interface AbilitySlotSnapshot {
  name: string;
  index: number;
}

export function resolveDynamicAbilityTargetIndex(
  abilities: AbilitySlotSnapshot[],
  preferredIndex?: number,
): number {
  const talentIndex = abilities.reduce(
    (firstIndex, ability) =>
      ability.name.startsWith('special_bonus_') ? Math.min(firstIndex, ability.index) : firstIndex,
    Number.MAX_SAFE_INTEGER,
  );
  if (preferredIndex !== undefined) {
    return talentIndex === Number.MAX_SAFE_INTEGER
      ? preferredIndex
      : Math.min(preferredIndex, talentIndex);
  }
  if (talentIndex !== Number.MAX_SAFE_INTEGER) return talentIndex;

  return abilities.reduce((maxIndex, ability) => Math.max(maxIndex, ability.index), -1) + 1;
}

export function getAbilitySlotSnapshots(unit: CDOTA_BaseNPC): AbilitySlotSnapshot[] {
  const abilities: AbilitySlotSnapshot[] = [];
  for (let index = 0; index < unit.GetAbilityCount(); index += 1) {
    const ability = unit.GetAbilityByIndex(index);
    if (!ability || ability.IsNull()) continue;
    abilities.push({ name: ability.GetAbilityName(), index });
  }
  return abilities;
}

export function moveAbilityToDynamicSlot(
  unit: CDOTA_BaseNPC,
  ability: CDOTABaseAbility,
  preferredIndex?: number,
): void {
  const currentIndex = ability.GetAbilityIndex();
  if (preferredIndex !== undefined) {
    if (currentIndex !== preferredIndex) ability.SetAbilityIndex(preferredIndex);
    return;
  }

  const slots = getAbilitySlotSnapshots(unit);
  const firstTalentIndex = slots.reduce(
    (firstIndex, snapshot) =>
      snapshot.name.startsWith('special_bonus_')
        ? Math.min(firstIndex, snapshot.index)
        : firstIndex,
    Number.MAX_SAFE_INTEGER,
  );
  if (firstTalentIndex !== Number.MAX_SAFE_INTEGER && currentIndex > firstTalentIndex) {
    ability.SetAbilityIndex(firstTalentIndex);
  }
}

export function addAbilityToDynamicSlot(
  unit: CDOTA_BaseNPC,
  abilityName: string,
  preferredIndex?: number,
): CDOTABaseAbility | undefined {
  const targetIndex = resolveDynamicAbilityTargetIndex(
    getAbilitySlotSnapshots(unit),
    preferredIndex,
  );
  const added = unit.AddAbility(abilityName);
  if (!added || added.IsNull()) return undefined;
  if (added.GetAbilityIndex() !== targetIndex) added.SetAbilityIndex(targetIndex);
  return added;
}
