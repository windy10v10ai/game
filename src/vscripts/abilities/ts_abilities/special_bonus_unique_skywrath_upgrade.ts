import { registerAbility } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  findHeroOrCreepInRange,
  getFullCastRange,
} from './shared/auto-cast-ability';

/** 天怒法师 天裔之杖-觉醒：四个主动技能的自动施法开关。冷却缩减由觉醒一并发放的原版 skywrath_mage_staff_of_the_scion 提供。 */
@registerAbility('special_bonus_unique_skywrath_upgrade')
export class SpecialBonusUniqueSkywrathUpgrade extends AutoCastAbility {
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
