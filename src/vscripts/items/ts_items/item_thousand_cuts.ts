import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility()
export class item_thousand_cuts extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_thousand_cuts';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const duration = this.GetSpecialValueFor('active_duration');
    caster.AddNewModifier(caster, this, 'modifier_item_thousand_cuts_active', {
      duration: duration,
    });
  }
}

@registerModifier('items/ts_items/item_thousand_cuts.lua')
export class modifier_item_thousand_cuts extends BaseItemModifier {
  protected override statsModifierName: string = '';
  private isPerformingMultiAttack: boolean = false;

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
      ModifierFunction.ATTACK_RANGE_BONUS,
      ModifierFunction.ON_ATTACK_LANDED,
    ];
  }

  GetModifierBonusStats_Agility(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_agility') ?? 0;
  }

  GetModifierBonusStats_Strength(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_strength') ?? 0;
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_damage') ?? 0;
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_attack_speed') ?? 0;
  }

  GetModifierAttackRangeBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_attack_range') ?? 0;
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    if (this.isPerformingMultiAttack) return;
    if (event.attacker !== this.GetParent()) return;
    if (!event.target.IsRealHero() && !event.target.IsCreep()) return;
    if (event.target.GetTeamNumber() === this.GetParent().GetTeamNumber()) return;

    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) return;

    const isActive = parent.HasModifier('modifier_item_thousand_cuts_active');
    const targetCount = isActive
      ? ability.GetSpecialValueFor('active_targets')
      : ability.GetSpecialValueFor('passive_targets');
    const radius = ability.GetSpecialValueFor('passive_target_radius');
    const damagePct = ability.GetSpecialValueFor('passive_damage_pct') / 100;
    const ministunDur = isActive ? ability.GetSpecialValueFor('active_ministun') : 0;

    const extraTargets = FindUnitsInRadius(
      parent.GetTeamNumber(),
      event.target.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    ).filter((u) => u !== event.target);

    const toAttack = extraTargets.slice(0, targetCount);

    this.isPerformingMultiAttack = true;
    for (const target of toAttack) {
      parent.PerformAttack(target, true, true, true, true, false, false, true);
      if (ministunDur > 0) {
        target.AddNewModifier(parent, ability, 'modifier_thousand_cuts_ministun', {
          duration: ministunDur,
        });
      }
    }
    this.isPerformingMultiAttack = false;
  }
}

@registerModifier('items/ts_items/item_thousand_cuts.lua')
export class modifier_item_thousand_cuts_active extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'item_thousand_cuts';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT];
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    return this.GetAbility()?.GetSpecialValueFor('active_attack_speed') ?? 0;
  }
}

@registerModifier('items/ts_items/item_thousand_cuts.lua')
export class modifier_thousand_cuts_ministun extends BaseModifier {
  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return { [ModifierState.STUNNED]: true };
  }
}
