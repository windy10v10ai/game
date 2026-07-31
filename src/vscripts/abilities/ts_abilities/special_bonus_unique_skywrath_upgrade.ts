import { registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  getFullCastRange,
  modifier_autocast_think,
} from './shared/auto-cast-ability';

/** 天怒法师 天裔之杖-觉醒：造成魔法技能伤害时减少冷却，并提供四个主动技能的自动施法开关。 */
@registerAbility('special_bonus_unique_skywrath_upgrade')
export class SpecialBonusUniqueSkywrathUpgrade extends AutoCastAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_skywrath_upgrade.name;
  }

  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    this.castAncientSeal(caster);
    this.castMysticFlare(caster);
    this.castArcaneBolt(caster);
    this.castConcussiveShot(caster);
  }

  private castAncientSeal(caster: CDOTA_BaseNPC_Hero): void {
    const seal = caster.FindAbilityByName('skywrath_mage_ancient_seal');
    if (!seal || !seal.IsFullyCastable()) return;

    const target = this.findHero(caster, seal);
    if (target) castImmediatelyOnTarget(caster, seal, target);
  }

  private castMysticFlare(caster: CDOTA_BaseNPC_Hero): void {
    const flare = caster.FindAbilityByName('skywrath_mage_mystic_flare');
    if (!flare || !flare.IsFullyCastable()) return;

    const target = this.findHero(caster, flare);
    if (target) this.castAtPosition(caster, flare, target.GetAbsOrigin());
  }

  private castArcaneBolt(caster: CDOTA_BaseNPC_Hero): void {
    const bolt = caster.FindAbilityByName('skywrath_mage_arcane_bolt');
    if (!bolt || !bolt.IsFullyCastable()) return;

    const flags =
      bolt.GetSpecialValueFor('pierce_spell_immunity') > 0
        ? UnitTargetFlags.MAGIC_IMMUNE_ENEMIES
        : UnitTargetFlags.NONE;
    const target = this.findHeroOrCreep(caster, bolt, flags);
    if (target) castImmediatelyOnTarget(caster, bolt, target);
  }

  private castConcussiveShot(caster: CDOTA_BaseNPC_Hero): void {
    const shot = caster.FindAbilityByName('skywrath_mage_concussive_shot');
    const launchRadius = shot?.GetSpecialValueFor('launch_radius') ?? 0;
    const shotRange =
      shot && shot.GetSpecialValueFor('launch_global') > 0
        ? FIND_UNITS_EVERYWHERE
        : launchRadius > 0
          ? launchRadius
          : shot && getFullCastRange(caster, shot);
    if (!shot || !shot.IsFullyCastable() || !shotRange || !this.findHero(caster, shot, shotRange)) {
      return;
    }

    // 震荡光弹是无目标技能，由原生技能在有效搜索范围内选择目标。
    caster.CastAbilityImmediately(shot, caster.GetPlayerOwnerID());
  }

  private findHero(
    caster: CDOTA_BaseNPC_Hero,
    ability: CDOTABaseAbility,
    range = getFullCastRange(caster, ability),
  ): CDOTA_BaseNPC | undefined {
    const enemies = findEnemiesInRange(caster, range, UnitTargetType.HERO);
    return enemies.find((enemy) => !enemy.IsNull() && enemy.IsAlive() && enemy.IsHero());
  }

  private findHeroOrCreep(
    caster: CDOTA_BaseNPC_Hero,
    ability: CDOTABaseAbility,
    extraFlags: UnitTargetFlags,
  ): CDOTA_BaseNPC | undefined {
    const enemies = findEnemiesInRange(
      caster,
      getFullCastRange(caster, ability),
      UnitTargetType.HERO + UnitTargetType.BASIC,
      extraFlags,
    );
    let creep: CDOTA_BaseNPC | undefined;
    for (const enemy of enemies) {
      if (enemy.IsNull() || !enemy.IsAlive()) continue;
      if (enemy.IsHero()) return enemy;
      if (!creep) creep = enemy;
    }
    return creep;
  }

  private castAtPosition(
    caster: CDOTA_BaseNPC_Hero,
    ability: CDOTABaseAbility,
    position: Vector,
  ): void {
    caster.SetCursorPosition(position);
    caster.CastAbilityImmediately(ability, caster.GetPlayerOwnerID());
  }
}

/**
 * 共享自动施法思考，并在每次造成魔法技能伤害后减少天怒非物品技能的剩余冷却。
 * 引擎伤害事件负责触发，不增加额外扫描或定时器。
 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_skywrath_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_skywrath_upgrade extends modifier_autocast_think {
  IsHidden(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'skywrath_mage_staff_of_the_scion_awaken';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_TAKEDAMAGE];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability || event.attacker !== parent || parent.PassivesDisabled()) return;
    if (
      event.damage <= 0 ||
      event.damage_category !== DamageCategory.SPELL ||
      event.damage_type !== DamageTypes.MAGICAL ||
      !event.inflictor ||
      event.inflictor.IsItem()
    ) {
      return;
    }
    const reduction = ability.GetSpecialValueFor('cooldown_reduction');
    if (reduction <= 0) return;

    for (let index = 0; index < parent.GetAbilityCount(); index++) {
      const targetAbility = parent.GetAbilityByIndex(index);
      if (!targetAbility) continue;

      const remaining = targetAbility.GetCooldownTimeRemaining();
      if (remaining <= 0) continue;

      targetAbility.EndCooldown();
      const reducedRemaining = remaining - reduction;
      if (reducedRemaining > 0) targetAbility.StartCooldown(reducedRemaining);
    }
  }
}
