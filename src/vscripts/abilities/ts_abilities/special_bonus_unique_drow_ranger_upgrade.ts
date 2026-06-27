import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

/**
 * 卓尔游侠 裂影箭-觉醒：普攻有概率分裂出箭矢射向主目标周围的敌人，
 * 各造成本次攻击伤害的百分比并附带霜冻之箭减速。还原老版精准箭分裂手感。
 */
@registerAbility('special_bonus_unique_drow_ranger_upgrade')
export class SpecialBonusUniqueDrowRangerUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_special_bonus_unique_drow_ranger_upgrade';
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_drow_ranger_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_drow_ranger_upgrade extends BaseModifier {
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
    return [ModifierFunction.ON_ATTACK];
  }

  // 抬手射出即触发（不等主箭命中），分裂箭与主箭同时飞出
  OnAttack(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (event.attacker !== parent || parent.IsIllusion()) return;

    const target = event.target;
    if (!target || target.IsNull() || !target.IsAlive()) return;
    if (target.GetTeamNumber() === parent.GetTeamNumber()) return;

    const ability = this.GetAbility();
    if (!ability || ability.GetLevel() <= 0) return;
    if (!RollPseudoRandomPercentage(ability.GetSpecialValueFor('splinter_chance'), 0, parent)) {
      return;
    }

    // 抬手时本次攻击伤害尚未结算，用对该目标的平均攻击力作基数
    const damage =
      parent.GetAverageTrueAttackDamage(target) *
      ability.GetSpecialValueFor('splinter_damage_pct') *
      0.01;
    if (damage <= 0) return;

    const maxTargets = ability.GetSpecialValueFor('splinter_targets');
    const projectileSpeed = ability.GetSpecialValueFor('projectile_speed');
    const slowDuration = ability.GetSpecialValueFor('slow_duration');
    const frostArrows = parent.FindAbilityByName('drow_ranger_frost_arrows');
    const enemies = FindUnitsInRadius(
      parent.GetTeamNumber(),
      target.GetAbsOrigin(),
      undefined,
      ability.GetSpecialValueFor('splinter_radius'),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.CLOSEST,
      false,
    );

    let hit = 0;
    for (const enemy of enemies) {
      if (enemy === target || enemy.IsNull() || !enemy.IsAlive()) continue;
      this.fireSplinter(parent, ability, enemy, damage, projectileSpeed, slowDuration, frostArrows);
      hit += 1;
      if (hit >= maxTargets) break;
    }
  }

  // 对单个敌人射出一支分裂箭：弹道 + 物理伤害（不吃技能增强）+ 霜冻减速
  private fireSplinter(
    parent: CDOTA_BaseNPC,
    ability: CDOTABaseAbility,
    enemy: CDOTA_BaseNPC,
    damage: number,
    projectileSpeed: number,
    slowDuration: number,
    frostArrows?: CDOTABaseAbility,
  ): void {
    ProjectileManager.CreateTrackingProjectile({
      Target: enemy,
      Source: parent,
      Ability: ability,
      EffectName: 'particles/units/heroes/hero_drow/drow_marksmanship_attack.vpcf',
      iMoveSpeed: projectileSpeed,
      bDodgeable: false,
    });

    ApplyDamage({
      victim: enemy,
      attacker: parent,
      damage,
      damage_type: DamageTypes.PHYSICAL,
      damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.IGNORES_BASE_PHYSICAL_ARMOR,
      ability,
    });

    if (frostArrows && frostArrows.GetLevel() > 0) {
      enemy.AddNewModifier(parent, frostArrows, 'modifier_drow_ranger_frost_arrows_slow', {
        duration: slowDuration,
      });
    }
  }
}
