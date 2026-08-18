import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  modifier_special_bonus_unique_dragon_knight_upgrade_corrosive,
  modifier_special_bonus_unique_dragon_knight_upgrade_frost,
} from './special_bonus_unique_dragon_knight_upgrade';
import { getTrueDragonFormTier } from './dragon-knight-true-dragon-math';

const ELDER_DRAGON_FORM_ABILITY = 'dragon_knight_elder_dragon_form';
const ELDER_DRAGON_FORM_MODIFIER = 'modifier_dragon_knight_dragon_form';
const NORMAL_UPGRADE_ABILITY = 'dragon_knight_elder_dragon_form_upgrade';

@registerAbility(NORMAL_UPGRADE_ABILITY)
export class DragonKnightElderDragonFormUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_dragon_knight_elder_dragon_form_upgrade.name;
  }
}

@registerModifier(`abilities/ts_abilities/${NORMAL_UPGRADE_ABILITY}`)
export class modifier_dragon_knight_elder_dragon_form_upgrade extends BaseModifier {
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
    return [ModifierFunction.ON_ATTACK_LANDED];
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const target = event.target;
    if (
      event.attacker !== parent ||
      parent.IsIllusion() ||
      !parent.HasModifier(ELDER_DRAGON_FORM_MODIFIER)
    ) {
      return;
    }
    if (!target || target.IsNull() || !target.IsAlive()) return;
    if (
      target.GetTeamNumber() === parent.GetTeamNumber() ||
      target.IsBuilding() ||
      target.IsOther()
    ) {
      return;
    }

    const elderDragonForm = parent.FindAbilityByName(ELDER_DRAGON_FORM_ABILITY);
    const ability = this.GetAbility();
    if (!elderDragonForm || elderDragonForm.IsNull() || !ability || ability.IsNull()) return;

    const tier = getTrueDragonFormTier(elderDragonForm.GetLevel(), parent.HasScepter());
    this.applyCorrosiveArmor(target, elderDragonForm, ability, tier);
    this.applyFrostHealingReduction(target, elderDragonForm, ability, tier);
  }

  private applyFrostHealingReduction(
    target: CDOTA_BaseNPC,
    elderDragonForm: CDOTABaseAbility,
    ability: CDOTABaseAbility,
    tier: number,
  ): void {
    const healingReduction = elderDragonForm.GetLevelSpecialValueFor(
      'frost_healing_reduction',
      tier - 1,
    );
    const movementSlow = elderDragonForm.GetLevelSpecialValueFor(
      'frost_bonus_movement_speed',
      tier - 1,
    );
    const attackSpeedSlow = elderDragonForm.GetLevelSpecialValueFor(
      'frost_bonus_attack_speed',
      tier - 1,
    );
    if (healingReduction <= 0 && movementSlow <= 0 && attackSpeedSlow <= 0) return;

    const nativeDuration = elderDragonForm.GetLevelSpecialValueFor('frost_duration', tier - 1);
    const duration = nativeDuration * (1 - target.GetStatusResistance());
    if (duration <= 0) return;

    target.AddNewModifier(
      this.GetParent(),
      ability,
      modifier_special_bonus_unique_dragon_knight_upgrade_frost.name,
      { duration, healingReduction, movementSlow, attackSpeedSlow },
    );
  }

  private applyCorrosiveArmor(
    target: CDOTA_BaseNPC,
    elderDragonForm: CDOTABaseAbility,
    ability: CDOTABaseAbility,
    tier: number,
  ): void {
    const armorReduction = elderDragonForm.GetLevelSpecialValueFor(
      'corrosive_armor_reduction',
      tier - 1,
    );
    const additionalDamage = elderDragonForm.GetLevelSpecialValueFor(
      'corrosive_damage_per_second',
      tier - 1,
    );
    const nativeDuration = elderDragonForm.GetLevelSpecialValueFor('corrosive_duration', tier - 1);
    const duration = nativeDuration * (1 - target.GetStatusResistance());
    if (armorReduction <= 0 && additionalDamage <= 0) return;
    if (duration <= 0) return;

    target.AddNewModifier(
      this.GetParent(),
      ability,
      modifier_special_bonus_unique_dragon_knight_upgrade_corrosive.name,
      {
        duration,
        armorReduction,
        additionalDamage,
      },
    );
  }
}
