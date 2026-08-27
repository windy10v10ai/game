import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { calculateStatusResistedDuration } from '../../utils/damage-calculation';

const BLINK_ABILITY = 'antimage_blink';
const MANA_BREAK_ABILITY = 'antimage_mana_break';
const MANA_VOID_ABILITY = 'antimage_mana_void';
const NATIVE_MANA_LOCK_MODIFIER = 'modifier_antimage_empowered_mana_break_debuff';

/** 敌法师 法力禁域觉醒：闪烁压制附近敌人魔法，法力虚空对范围内英雄按各自缺失魔法结算。 */
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
      this.suppressMana(antiMage);
    } else if (abilityName === MANA_VOID_ABILITY) {
      this.topUpManaVoidDamage(antiMage, event.ability);
    }
  }

  private suppressMana(antiMage: CDOTA_BaseNPC): void {
    const awaken = this.GetAbility();
    const manaBreak = antiMage.FindAbilityByName(MANA_BREAK_ABILITY);
    if (awaken === undefined || manaBreak === undefined) return;

    const duration = awaken.GetSpecialValueFor('mana_lock_duration');
    const manaLossRatio = awaken.GetSpecialValueFor('current_mana_loss_pct') / 100;
    const enemies = FindUnitsInRadius(
      antiMage.GetTeamNumber(),
      antiMage.GetAbsOrigin(),
      undefined,
      awaken.GetSpecialValueFor('blink_radius'),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );

    for (const enemy of enemies) {
      enemy.AddNewModifier(antiMage, manaBreak, NATIVE_MANA_LOCK_MODIFIER, {
        duration: calculateStatusResistedDuration(duration, enemy),
      });
      if (enemy.IsRealHero()) {
        enemy.SetMana(enemy.GetMana() * (1 - manaLossRatio));
      }
    }
  }

  // 法力虚空按主目标缺失魔法对范围内所有人结算，只补自身缺失魔法多出主目标的部分，使每人最终按两者较高值受伤
  private topUpManaVoidDamage(antiMage: CDOTA_BaseNPC, manaVoid: CDOTABaseAbility): void {
    const primaryTarget = manaVoid.GetCursorTarget();
    if (primaryTarget === undefined) return;

    const damagePerMana = manaVoid.GetSpecialValueFor('mana_void_damage_per_mana');
    const primaryMissingMana = primaryTarget.GetMaxMana() - primaryTarget.GetMana();
    const heroes = FindUnitsInRadius(
      antiMage.GetTeamNumber(),
      primaryTarget.GetAbsOrigin(),
      undefined,
      manaVoid.GetSpecialValueFor('mana_void_aoe_radius'),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );

    for (const hero of heroes) {
      if (!hero.IsRealHero()) continue;
      const extraMissingMana = hero.GetMaxMana() - hero.GetMana() - primaryMissingMana;
      if (extraMissingMana <= 0) continue;
      ApplyDamage({
        victim: hero,
        attacker: antiMage,
        damage: extraMissingMana * damagePerMana,
        damage_type: manaVoid.GetAbilityDamageType(),
        ability: manaVoid,
      });
    }
  }
}
