import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

interface FateRouletteModifier extends CDOTA_Modifier_Lua {
  GetInheritedRouletteEffect(record: number): number;
  PlayInheritedRouletteEffect(target: CDOTA_BaseNPC, record: number): void;
}

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
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ATTACK, ModifierFunction.TOOLTIP];
  }

  OnTooltip(): number {
    return this.GetAbility()?.GetSpecialValueFor('splinter_chance') ?? 0;
  }

  // Fire splinter arrows when the attack starts, without waiting for the primary projectile to land.
  OnAttack(event: ModifierAttackEvent): void {
    if (!IsServer()) return;

    const attack = this.getSplinterAttack(event);
    if (!attack) return;

    const { parent, target, ability, damage } = attack;
    const fateRoulette = parent.FindModifierByName('modifier_ability_fate_roulette_counter') as
      | FateRouletteModifier
      | undefined;
    const fateEffect = fateRoulette?.GetInheritedRouletteEffect(event.record) ?? 0;
    const fateAbility = parent.FindAbilityByName('ability_fate_roulette');
    const fateCriticalDamage = fateAbility?.GetSpecialValueFor('critical_damage') ?? 0;
    const frostArrows = parent.FindAbilityByName('drow_ranger_frost_arrows');
    const enemies = this.findSplinterTargets(parent, target, ability);

    this.fireSplinters(
      enemies,
      parent,
      target,
      ability,
      damage,
      frostArrows,
      fateRoulette,
      event.record,
      fateEffect,
      fateCriticalDamage,
    );
  }

  private getSplinterAttack(event: ModifierAttackEvent):
    | {
        parent: CDOTA_BaseNPC;
        target: CDOTA_BaseNPC;
        ability: CDOTABaseAbility;
        damage: number;
      }
    | undefined {
    const parent = this.GetParent();
    if (event.attacker !== parent || parent.IsIllusion()) return undefined;

    const target = event.target;
    if (!target || target.IsNull() || !target.IsAlive()) return undefined;
    if (target.GetTeamNumber() === parent.GetTeamNumber()) return undefined;

    const ability = this.GetAbility();
    if (!ability || ability.GetLevel() <= 0) return undefined;
    if (!RollPseudoRandomPercentage(ability.GetSpecialValueFor('splinter_chance'), 0, parent)) {
      return undefined;
    }

    // The attack has not dealt damage yet, so use average true attack damage as the base.
    const damage =
      parent.GetAverageTrueAttackDamage(target) *
      ability.GetSpecialValueFor('splinter_damage_pct') *
      0.01;
    if (damage <= 0) return undefined;

    return { parent, target, ability, damage };
  }

  private findSplinterTargets(
    parent: CDOTA_BaseNPC,
    target: CDOTA_BaseNPC,
    ability: CDOTABaseAbility,
  ): CDOTA_BaseNPC[] {
    return FindUnitsInRadius(
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
  }

  private fireSplinters(
    enemies: CDOTA_BaseNPC[],
    parent: CDOTA_BaseNPC,
    target: CDOTA_BaseNPC,
    ability: CDOTABaseAbility,
    damage: number,
    frostArrows: CDOTABaseAbility | undefined,
    fateRoulette: FateRouletteModifier | undefined,
    attackRecord: number,
    fateEffect: number,
    fateCriticalDamage: number,
  ): void {
    const maxTargets = ability.GetSpecialValueFor('splinter_targets');
    const projectileSpeed = ability.GetSpecialValueFor('projectile_speed');
    const slowDuration = ability.GetSpecialValueFor('slow_duration');
    let hit = 0;

    for (const enemy of enemies) {
      if (enemy === target || enemy.IsNull() || !enemy.IsAlive()) continue;
      this.fireSplinter(
        parent,
        ability,
        enemy,
        damage,
        projectileSpeed,
        slowDuration,
        frostArrows,
        fateRoulette,
        attackRecord,
        fateEffect,
        fateCriticalDamage,
      );
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
    frostArrows: CDOTABaseAbility | undefined,
    fateRoulette: FateRouletteModifier | undefined,
    attackRecord: number,
    fateEffect: number,
    fateCriticalDamage: number,
  ): void {
    ProjectileManager.CreateTrackingProjectile({
      Target: enemy,
      Source: parent,
      Ability: ability,
      EffectName: 'particles/units/heroes/hero_drow/drow_marksmanship_attack.vpcf',
      iMoveSpeed: projectileSpeed,
      bDodgeable: false,
    });

    const inheritedDamage =
      fateEffect === 1 && fateCriticalDamage > 0 ? damage * fateCriticalDamage * 0.01 : damage;

    ApplyDamage({
      victim: enemy,
      attacker: parent,
      damage: inheritedDamage,
      damage_type: DamageTypes.PHYSICAL,
      damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.IGNORES_BASE_PHYSICAL_ARMOR,
      ability,
    });

    fateRoulette?.PlayInheritedRouletteEffect(enemy, attackRecord);

    if (frostArrows && frostArrows.GetLevel() > 0) {
      enemy.AddNewModifier(parent, frostArrows, 'modifier_drow_ranger_frost_arrows_slow', {
        duration: slowDuration,
      });
    }
  }
}
