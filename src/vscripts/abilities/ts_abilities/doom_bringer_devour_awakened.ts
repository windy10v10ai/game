import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  DevourAbilityEntry,
  getDevourAbilityHighestDeclaredLevel,
  getUniqueDevourAbilityNames,
  selectTrackedDevourAbilityEntityIndexes,
} from './doom-devour-awaken-logic';

const DEVOUR_ABILITY = 'doom_bringer_devour';
const DEVOUR_LEVEL_INTERVAL = 0.1;

interface PendingDevour {
  ability: CDOTABaseAbility;
  targetAbilityNames: string[];
}

function getUnitAbilityEntries(unit: CDOTA_BaseNPC): DevourAbilityEntry[] {
  const abilities: DevourAbilityEntry[] = [];
  for (let index = 0; index < unit.GetAbilityCount(); index += 1) {
    const ability = unit.GetAbilityByIndex(index);
    if (!ability || ability.IsNull()) continue;

    const name = ability.GetAbilityName();
    if (!name) continue;
    abilities.push({ name, entityIndex: ability.GetEntityIndex() });
  }
  return abilities;
}

function getUnitAbilityNames(unit: CDOTA_BaseNPC): string[] {
  return getUniqueDevourAbilityNames(getUnitAbilityEntries(unit).map((ability) => ability.name));
}

@registerAbility('doom_bringer_devour_awakened')
export class DoomBringerDevourAwakened extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_doom_bringer_devour_awakened';
  }
}

@registerModifier('abilities/ts_abilities/doom_bringer_devour_awakened')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_doom_bringer_devour_awakened extends BaseModifier {
  private pendingDevour?: PendingDevour;
  private trackedAbilityNames: string[] = [];

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_START, ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.StartIntervalThink(DEVOUR_LEVEL_INTERVAL);
  }

  OnAbilityStart(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent) return;

    const ability = event.ability;
    if (ability.GetAbilityName() !== DEVOUR_ABILITY) return;

    const target = ability.GetCursorTarget();
    if (!target || target.IsNull()) {
      this.pendingDevour = undefined;
      return;
    }

    this.pendingDevour = {
      ability,
      targetAbilityNames: getUnitAbilityNames(target),
    };
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent) return;

    const pending = this.pendingDevour;
    if (!pending || event.ability !== pending.ability) return;
    this.pendingDevour = undefined;
    this.trackedAbilityNames = pending.targetAbilityNames;
    this.maximizeTrackedAbilities();
  }

  OnIntervalThink(): void {
    this.maximizeTrackedAbilities();
  }

  private maximizeTrackedAbilities(): void {
    if (!IsServer() || this.trackedAbilityNames.length === 0) return;

    const parent = this.GetParent();
    if (parent.IsNull()) return;

    const selectedIndexes = selectTrackedDevourAbilityEntityIndexes(
      this.trackedAbilityNames,
      getUnitAbilityEntries(parent),
    );

    for (let index = 0; index < parent.GetAbilityCount(); index += 1) {
      const grantedAbility = parent.GetAbilityByIndex(index);
      if (!grantedAbility || grantedAbility.IsNull()) continue;
      if (!selectedIndexes.includes(grantedAbility.GetEntityIndex())) continue;

      // Some neutral passives expose a one-level shell while AbilityValues still declares four tiers.
      const maxLevel = Math.max(
        grantedAbility.GetMaxLevel(),
        getDevourAbilityHighestDeclaredLevel(
          GetAbilityKeyValuesByName(grantedAbility.GetAbilityName()),
        ),
      );
      if (grantedAbility.GetLevel() !== maxLevel) {
        grantedAbility.SetLevel(maxLevel);
      }
    }
  }
}
