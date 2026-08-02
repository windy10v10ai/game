import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  calculateLichAwakenDamage,
  calculateLichAwakenDetonationDamage,
  isLichAwakenMarkTarget,
} from './lich-awaken-math';

const CHAIN_FROST = 'lich_chain_frost';
const FROST_NOVA = 'lich_frost_nova';
const ICE_SPIRE = 'lich_ice_spire';
const AWAKEN_MODIFIER = 'modifier_special_bonus_unique_lich_upgrade';
const MARK_MODIFIER = 'modifier_special_bonus_unique_lich_upgrade_mark';

/** 巫妖觉醒：连环霜冻智力附伤、寒灾印记引爆，寒冰尖柱已解锁时自动施放。 */
@registerAbility('special_bonus_unique_lich_upgrade')
export class SpecialBonusUniqueLichUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return AWAKEN_MODIFIER;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_lich_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_lich_upgrade extends BaseModifier {
  private resolvingAwakenDamage = false;

  IsHidden(): boolean {
    return false;
  }

  GetTexture(): string {
    return CHAIN_FROST;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_TAKEDAMAGE];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer() || this.resolvingAwakenDamage) return;

    const lich = this.GetParent() as CDOTA_BaseNPC_Hero;
    const awaken = this.GetAbility();
    const target = event.unit;
    const inflictor = event.inflictor;
    if (
      event.attacker !== lich ||
      !awaken ||
      awaken.IsNull() ||
      awaken.GetLevel() <= 0 ||
      !awaken.IsActivated() ||
      lich.PassivesDisabled() ||
      !target ||
      target.IsNull() ||
      event.damage <= 0 ||
      !inflictor ||
      inflictor.IsNull()
    ) {
      return;
    }

    const abilityName = inflictor.GetAbilityName();
    if (abilityName === CHAIN_FROST) {
      this.onChainFrostDamage(lich, awaken, inflictor, target);
    } else if (abilityName === FROST_NOVA) {
      this.onFrostNovaDamage(lich, awaken, target);
    }
  }

  private onChainFrostDamage(
    lich: CDOTA_BaseNPC_Hero,
    awaken: CDOTABaseAbility,
    chainFrost: CDOTABaseAbility,
    target: CDOTA_BaseNPC,
  ): void {
    if (!this.isValidDamageTarget(lich, target)) return;

    this.maybeAutoCastIceSpire(lich, chainFrost, target);

    const bonusDamage = calculateLichAwakenDamage(
      lich.GetIntellect(false),
      awaken.GetSpecialValueFor('intelligence_damage_multiplier'),
    );
    if (bonusDamage > 0) {
      this.resolvingAwakenDamage = true;
      ApplyDamage({
        victim: target,
        attacker: lich,
        damage: bonusDamage,
        damage_type: DamageTypes.MAGICAL,
        ability: awaken,
      });
      this.resolvingAwakenDamage = false;
    }

    if (
      target.IsAlive() &&
      isLichAwakenMarkTarget(this.isRoshan(target), target.IsRealHero(), target.IsIllusion())
    ) {
      this.addMark(lich, awaken, target);
    }
  }

  private onFrostNovaDamage(
    lich: CDOTA_BaseNPC_Hero,
    awaken: CDOTABaseAbility,
    target: CDOTA_BaseNPC,
  ): void {
    if (!this.isValidDamageTarget(lich, target)) return;

    const mark = target.FindModifierByNameAndCaster(MARK_MODIFIER, lich);
    if (!mark || mark.IsNull()) return;

    const consumedStacks = mark.GetStackCount();
    if (consumedStacks <= 0) return;
    mark.Destroy();

    const damage = calculateLichAwakenDetonationDamage(
      lich.GetIntellect(false),
      awaken.GetSpecialValueFor('nova_detonation_multiplier_per_stack'),
      consumedStacks,
    );
    this.detonate(lich, awaken, target, damage);
  }

  private addMark(lich: CDOTA_BaseNPC_Hero, awaken: CDOTABaseAbility, target: CDOTA_BaseNPC): void {
    const duration = awaken.GetSpecialValueFor('mark_duration');
    const maxStacks = Math.max(1, awaken.GetSpecialValueFor('mark_max_stacks'));
    const existing = target.FindModifierByNameAndCaster(MARK_MODIFIER, lich);

    let stacks = 1;
    if (existing && !existing.IsNull()) {
      stacks = Math.min(existing.GetStackCount() + 1, maxStacks);
      existing.SetStackCount(stacks);
      existing.SetDuration(duration, true);
    } else {
      const added = target.AddNewModifier(lich, awaken, MARK_MODIFIER, { duration });
      if (!added) return;
      added.SetStackCount(1);
    }

    if (stacks < maxStacks) return;
    const mark = target.FindModifierByNameAndCaster(MARK_MODIFIER, lich);
    if (mark && !mark.IsNull()) mark.Destroy();

    const damage = calculateLichAwakenDetonationDamage(
      lich.GetIntellect(false),
      awaken.GetSpecialValueFor('nova_detonation_multiplier_per_stack'),
      maxStacks,
    );
    this.detonate(lich, awaken, target, damage);
  }

  private detonate(
    lich: CDOTA_BaseNPC_Hero,
    awaken: CDOTABaseAbility,
    center: CDOTA_BaseNPC,
    damage: number,
  ): void {
    if (damage <= 0) return;

    const radius = awaken.GetSpecialValueFor('detonation_radius');
    const freezeDuration = awaken.GetSpecialValueFor('freeze_duration');
    const enemies = FindUnitsInRadius(
      lich.GetTeamNumber(),
      center.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );

    this.resolvingAwakenDamage = true;
    for (const enemy of enemies) {
      if (!this.isValidDamageTarget(lich, enemy)) continue;

      ApplyDamage({
        victim: enemy,
        attacker: lich,
        damage,
        damage_type: DamageTypes.MAGICAL,
        ability: awaken,
      });

      if (!this.isRoshan(enemy) && enemy.IsAlive() && freezeDuration > 0) {
        enemy.AddNewModifier(lich, awaken, 'modifier_stunned', {
          duration: freezeDuration * (1 - enemy.GetStatusResistance()),
        });
      }
    }
    this.resolvingAwakenDamage = false;
  }

  private isRoshan(unit: CDOTA_BaseNPC): boolean {
    return unit.GetUnitName() === 'npc_dota_roshan';
  }

  private isValidDamageTarget(lich: CDOTA_BaseNPC, target: CDOTA_BaseNPC): boolean {
    return (
      target.GetTeamNumber() !== lich.GetTeamNumber() &&
      !target.IsBuilding() &&
      !target.IsWard() &&
      !target.IsOther() &&
      !target.IsInvulnerable()
    );
  }

  private maybeAutoCastIceSpire(
    lich: CDOTA_BaseNPC_Hero,
    chainFrost: CDOTABaseAbility,
    target: CDOTA_BaseNPC,
  ): void {
    const iceSpire = lich.FindAbilityByName(ICE_SPIRE);
    if (!iceSpire || iceSpire.GetLevel() <= 0 || !iceSpire.IsFullyCastable()) return;

    const nearbyHeroes = FindUnitsInRadius(
      lich.GetTeamNumber(),
      target.GetAbsOrigin(),
      undefined,
      chainFrost.GetSpecialValueFor('jump_range'),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.FOW_VISIBLE + UnitTargetFlags.NO_INVIS,
      FindOrder.CLOSEST,
      false,
    ).filter((enemy) => enemy.IsAlive() && enemy.IsRealHero() && !enemy.IsIllusion());
    if (nearbyHeroes.length !== 1) return;

    lich.SetCursorPosition(nearbyHeroes[0].GetAbsOrigin());
    lich.CastAbilityImmediately(iceSpire, lich.GetPlayerOwnerID());
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_lich_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_lich_upgrade_mark extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return true;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.MULTIPLE;
  }

  GetTexture(): string {
    return 'lich_chain_frost';
  }
}
