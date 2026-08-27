import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const BLINK_ABILITY = 'antimage_blink';
const MANA_BREAK_ABILITY = 'antimage_mana_break';
const MANA_VOID_ABILITY = 'antimage_mana_void';
const NATIVE_MANA_LOCK_MODIFIER = 'modifier_antimage_empowered_mana_break_debuff';
const MANA_VOID_PARTICLE = 'particles/units/heroes/hero_antimage/antimage_manavoid.vpcf';
const MANA_VOID_SOUND = 'Hero_Antimage.ManaVoid';

/** 敌法师觉醒：闪烁压制魔法，法力虚空向附近英雄同步释放。 */
@registerAbility('special_bonus_unique_antimage_mana_suppression_awaken')
export class SpecialBonusUniqueAntimageManaSuppressionAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_antimage_mana_suppression_awaken.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_antimage_mana_suppression_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_antimage_mana_suppression_awaken extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return BLINK_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const antiMage = this.GetParent();
    if (event.unit !== antiMage) return;

    const abilityName = event.ability.GetAbilityName();
    if (abilityName === BLINK_ABILITY) {
      this.applyBlinkEffects(antiMage);
    } else if (abilityName === MANA_VOID_ABILITY) {
      this.spreadManaVoid(antiMage, event.ability);
    }
  }

  private applyBlinkEffects(antiMage: CDOTA_BaseNPC): void {
    const awaken = this.GetAbility();
    const manaBreak = antiMage.FindAbilityByName(MANA_BREAK_ABILITY);
    if (!awaken || awaken.IsNull() || !manaBreak || manaBreak.IsNull()) return;

    const radius = awaken.GetSpecialValueFor('blink_radius');
    const duration = awaken.GetSpecialValueFor('mana_lock_duration');
    const manaReductionPct = awaken.GetSpecialValueFor('max_mana_reduction_pct');
    const enemies = FindUnitsInRadius(
      antiMage.GetTeamNumber(),
      antiMage.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    for (const enemy of enemies) {
      enemy.AddNewModifier(antiMage, manaBreak, NATIVE_MANA_LOCK_MODIFIER, { duration });

      if (!enemy.IsRealHero() || enemy.IsIllusion()) continue;
      const manaLoss = enemy.GetMaxMana() * (manaReductionPct / 100);
      enemy.SetMana(Math.max(0, enemy.GetMana() - manaLoss));
    }
  }

  private spreadManaVoid(antiMage: CDOTA_BaseNPC, manaVoid: CDOTABaseAbility): void {
    const awaken = this.GetAbility();
    const primaryTarget = manaVoid.GetCursorTarget();
    if (!awaken || awaken.IsNull() || !primaryTarget || primaryTarget.IsNull()) return;

    const spreadRadius = awaken.GetSpecialValueFor('mana_void_spread_radius');
    const targets = FindUnitsInRadius(
      antiMage.GetTeamNumber(),
      primaryTarget.GetAbsOrigin(),
      undefined,
      spreadRadius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    for (const target of targets) {
      if (target === primaryTarget || !target.IsRealHero() || target.IsIllusion()) continue;
      this.applyManaVoidToTarget(antiMage, manaVoid, target);
    }
  }

  private applyManaVoidToTarget(
    antiMage: CDOTA_BaseNPC,
    manaVoid: CDOTABaseAbility,
    target: CDOTA_BaseNPC,
  ): void {
    const missingMana = Math.max(0, target.GetMaxMana() - target.GetMana());
    const damage = missingMana * manaVoid.GetSpecialValueFor('mana_void_damage_per_mana');
    if (damage > 0) {
      ApplyDamage({
        victim: target,
        attacker: antiMage,
        damage,
        damage_type: manaVoid.GetAbilityDamageType(),
        ability: manaVoid,
      });
    }

    const stunDuration = manaVoid.GetSpecialValueFor('mana_void_ministun');
    if (target.IsAlive() && stunDuration > 0) {
      target.AddNewModifier(antiMage, manaVoid, 'modifier_stunned', {
        duration: stunDuration * (1 - target.GetStatusResistance()),
      });
    }

    const particle = ParticleManager.CreateParticle(
      MANA_VOID_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      target,
    );
    ParticleManager.ReleaseParticleIndex(particle);
    EmitSoundOn(MANA_VOID_SOUND, target);
  }
}
