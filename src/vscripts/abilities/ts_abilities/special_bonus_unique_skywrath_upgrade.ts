import { registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  findHeroOrCreepInRange,
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

    const [target] = findEnemiesInRange(
      caster,
      getFullCastRange(caster, seal),
      UnitTargetType.HERO,
    );
    if (target !== undefined) castImmediatelyOnTarget(caster, seal, target);
  }

  private castMysticFlare(caster: CDOTA_BaseNPC_Hero): void {
    const flare = caster.FindAbilityByName('skywrath_mage_mystic_flare');
    if (!flare || !flare.IsFullyCastable()) return;

    const [target] = findEnemiesInRange(
      caster,
      getFullCastRange(caster, flare),
      UnitTargetType.HERO,
    );
    if (target !== undefined) this.castAtPosition(caster, flare, target.GetAbsOrigin());
  }

  private castArcaneBolt(caster: CDOTA_BaseNPC_Hero): void {
    const bolt = caster.FindAbilityByName('skywrath_mage_arcane_bolt');
    if (!bolt || !bolt.IsFullyCastable()) return;

    const flags =
      bolt.GetSpecialValueFor('pierce_spell_immunity') > 0
        ? UnitTargetFlags.MAGIC_IMMUNE_ENEMIES
        : UnitTargetFlags.NONE;
    const target = findHeroOrCreepInRange(caster, getFullCastRange(caster, bolt), flags);
    if (target) castImmediatelyOnTarget(caster, bolt, target);
  }

  private castConcussiveShot(caster: CDOTA_BaseNPC_Hero): void {
    const shot = caster.FindAbilityByName('skywrath_mage_concussive_shot');
    if (!shot || !shot.IsFullyCastable()) return;

    // 无目标技能，实际目标由原生技能挑选，这里只确认搜索范围内确实有英雄可打
    const launchRadius = shot.GetSpecialValueFor('launch_radius');
    const searchRange =
      shot.GetSpecialValueFor('launch_global') > 0
        ? FIND_UNITS_EVERYWHERE
        : launchRadius > 0
          ? launchRadius
          : getFullCastRange(caster, shot);
    if (findEnemiesInRange(caster, searchRange, UnitTargetType.HERO).length === 0) return;

    caster.CastAbilityImmediately(shot, caster.GetPlayerOwnerID());
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
