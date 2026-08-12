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
  // 每轮 think 最多放一个技能，避免四个技能同帧连发，下一个留给下轮 think
  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    if (this.castConcussiveShot(caster)) return;
    if (this.castMysticFlare(caster)) return;
    if (this.castAncientSeal(caster)) return;
    if (this.castArcaneBolt(caster)) return;
  }

  // 上古封印
  private castAncientSeal(caster: CDOTA_BaseNPC_Hero): boolean {
    const seal = caster.FindAbilityByName('skywrath_mage_ancient_seal');
    if (!seal || !seal.IsFullyCastable()) return false;

    const [target] = findEnemiesInRange(
      caster,
      getFullCastRange(caster, seal),
      UnitTargetType.HERO,
    );
    if (target === undefined) return false;
    castImmediatelyOnTarget(caster, seal, target);
    return true;
  }

  // 神秘之耀
  private castMysticFlare(caster: CDOTA_BaseNPC_Hero): boolean {
    const flare = caster.FindAbilityByName('skywrath_mage_mystic_flare');
    if (!flare || !flare.IsFullyCastable()) return false;

    const [target] = findEnemiesInRange(
      caster,
      getFullCastRange(caster, flare),
      UnitTargetType.HERO,
    );
    if (target === undefined) return false;
    this.castAtPosition(caster, flare, target.GetAbsOrigin());
    return true;
  }

  // 奥法鹰隼
  private castArcaneBolt(caster: CDOTA_BaseNPC_Hero): boolean {
    const bolt = caster.FindAbilityByName('skywrath_mage_arcane_bolt');
    if (!bolt || !bolt.IsFullyCastable()) return false;

    const flags =
      bolt.GetSpecialValueFor('pierce_spell_immunity') > 0
        ? UnitTargetFlags.MAGIC_IMMUNE_ENEMIES
        : UnitTargetFlags.NONE;
    const target = findHeroOrCreepInRange(caster, getFullCastRange(caster, bolt), flags);
    if (!target) return false;
    castImmediatelyOnTarget(caster, bolt, target);
    return true;
  }

  // 震荡光弹
  private castConcussiveShot(caster: CDOTA_BaseNPC_Hero): boolean {
    const shot = caster.FindAbilityByName('skywrath_mage_concussive_shot');
    if (!shot || !shot.IsFullyCastable()) return false;

    // 无目标技能，实际目标由原生技能挑选，这里只确认搜索范围内确实有英雄可打
    const launchRadius = shot.GetSpecialValueFor('launch_radius');
    const searchRange =
      shot.GetSpecialValueFor('launch_global') > 0
        ? FIND_UNITS_EVERYWHERE
        : launchRadius > 0
          ? launchRadius
          : getFullCastRange(caster, shot);
    if (findEnemiesInRange(caster, searchRange, UnitTargetType.HERO).length === 0) return false;

    caster.CastAbilityImmediately(shot, caster.GetPlayerOwnerID());
    return true;
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
