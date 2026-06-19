import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

/**
 * 莉娜 神灭斩-觉醒：莉娜每次施放神灭斩，对目标额外造成等同大招当前伤害的纯粹伤害（吃技能增强）。
 * 用 FULLY_CAST 而非 ABILITY_START，确保前摇走完真正释放才结算，避免取消前摇白嫖。
 */
@registerAbility('special_bonus_unique_lina_upgrade')
export class SpecialBonusUniqueLinaUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_special_bonus_unique_lina_upgrade';
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_lina_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_lina_upgrade extends BaseModifier {
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
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (event.unit !== parent) return;

    const ability = event.ability;
    if (ability.GetAbilityName() !== 'lina_laguna_blade') return;

    const target = ability.GetCursorTarget();
    if (!target || target.IsNull() || !target.IsAlive()) return;
    if (target.GetTeamNumber() === parent.GetTeamNumber()) return;

    // 直接读大招当前等级伤害，天然随等级/神杖/天赋分级；纯粹伤害且吃技能增强
    const damage = ability.GetSpecialValueFor('damage');
    if (damage <= 0) return;

    ApplyDamage({
      victim: target,
      attacker: parent,
      damage,
      damage_type: DamageTypes.PURE,
      ability,
    });
  }
}
