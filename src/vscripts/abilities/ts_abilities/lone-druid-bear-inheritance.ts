import {
  abilityTiersActive,
  abilityTiersPassive,
} from '../../modules/lottery/ability/lottery-abilities';

export const LONE_DRUID_BEAR_INHERITANCE_MODIFIER =
  'modifier_special_bonus_unique_lone_druid_upgrade_bear';

export interface InheritedAbilitySnapshot {
  name: string;
  level: number;
}

export interface InheritedPropertySnapshot {
  name: string;
  level: number;
}

export interface InheritedAbilityDiff {
  add: InheritedAbilitySnapshot[];
  update: InheritedAbilitySnapshot[];
  remove: string[];
}

export interface LoneDruidSpiritBearCandidate {
  unitName: string;
  ownerEntityIndex: number | undefined;
  ownerIsBaseNpc: boolean;
  druidEntityIndex: number;
  unitPlayerOwnerId: number;
  druidPlayerOwnerId: number;
  unitTeam: number;
  druidTeam: number;
}

function buildLotteryAbilityNameSet(): Set<string> {
  const names = new Set<string>();
  for (const tier of [...abilityTiersActive, ...abilityTiersPassive]) {
    for (const name of tier.names) names.add(name);
  }
  return names;
}

export const LONE_DRUID_INHERITABLE_ABILITY_NAMES = buildLotteryAbilityNameSet();

export function collectInheritableAbilities(
  ownedAbilities: InheritedAbilitySnapshot[],
  allowedNames: Set<string> = LONE_DRUID_INHERITABLE_ABILITY_NAMES,
): InheritedAbilitySnapshot[] {
  const levels = new Map<string, number>();
  for (const ability of ownedAbilities) {
    if (!allowedNames.has(ability.name)) continue;
    levels.set(ability.name, Math.max(levels.get(ability.name) ?? 0, ability.level));
  }

  return [...levels.entries()]
    .map(([name, level]) => ({ name, level }))
    .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
}

export function calculateInheritedAbilityDiff(
  desiredAbilities: InheritedAbilitySnapshot[],
  inheritedLedger: Record<string, number>,
  actualAbilityLevels?: Record<string, number | undefined>,
): InheritedAbilityDiff {
  const desiredByName = new Map<string, number>();
  for (const ability of desiredAbilities) desiredByName.set(ability.name, ability.level);

  const add: InheritedAbilitySnapshot[] = [];
  const update: InheritedAbilitySnapshot[] = [];
  for (const ability of desiredAbilities) {
    const inheritedLevel = inheritedLedger[ability.name];
    if (inheritedLevel === undefined) add.push(ability);
    else if (
      inheritedLevel !== ability.level ||
      (actualAbilityLevels !== undefined && actualAbilityLevels[ability.name] !== ability.level)
    ) {
      update.push(ability);
    }
  }

  const remove = Object.keys(inheritedLedger)
    .filter((name) => !desiredByName.has(name))
    .sort();

  return {
    add: add.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0)),
    update: update.sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    ),
    remove,
  };
}

export function buildInheritedAbilityRuntimeSignature(
  desiredAbilities: InheritedAbilitySnapshot[],
  actualAbilityLevels: Record<string, number | undefined>,
): string {
  return desiredAbilities
    .map((ability) => `${ability.name}:${actualAbilityLevels[ability.name] ?? 'missing'}`)
    .sort()
    .join(',');
}

export function buildLoneDruidBearInheritanceSignature(
  druidLevel: number,
  properties: InheritedPropertySnapshot[],
  abilities: InheritedAbilitySnapshot[],
  bonusSkillPoints: number,
): string {
  const propertySignature = properties
    .map((property) => `${property.name}:${property.level}`)
    .sort()
    .join(',');
  const abilitySignature = abilities
    .map((ability) => `${ability.name}:${ability.level}`)
    .sort()
    .join(',');
  return `${druidLevel}|${bonusSkillPoints}|${propertySignature}|${abilitySignature}`;
}

export function isLoneDruidSpiritBearUnitName(unitName: string): boolean {
  return unitName.startsWith('npc_dota_lone_druid_bear');
}

export function isOwnedLoneDruidSpiritBearCandidate(
  candidate: LoneDruidSpiritBearCandidate,
): boolean {
  if (
    !isLoneDruidSpiritBearUnitName(candidate.unitName) ||
    candidate.unitTeam !== candidate.druidTeam
  ) {
    return false;
  }

  if (candidate.ownerEntityIndex === candidate.druidEntityIndex) {
    return true;
  }

  if (candidate.ownerEntityIndex !== undefined && candidate.ownerIsBaseNpc) {
    return false;
  }

  return (
    candidate.unitPlayerOwnerId >= 0 &&
    candidate.druidPlayerOwnerId >= 0 &&
    candidate.unitPlayerOwnerId === candidate.druidPlayerOwnerId
  );
}
