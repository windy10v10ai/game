import { registerAbility } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  findHeroOrCreepInRange,
  getFullCastRange,
} from './shared/auto-cast-ability';

/**
 * 宙斯 神王-觉醒：autocast 开启后，自动对各技能施法距离内的敌人施放弧形闪电/雷击。
 * 优先英雄；只有小兵时仅放弧形闪电（雷击留给英雄）。宙斯不可对魔免单位施放。
 */
@registerAbility('special_bonus_unique_zuus_upgrade')
export class SpecialBonusUniqueZuusUpgrade extends AutoCastAbility {
  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    // 弧形闪电：英雄优先，无英雄也对小兵
    const arc = caster.FindAbilityByName('zuus_arc_lightning');
    if (arc && arc.IsFullyCastable()) {
      const target = findHeroOrCreepInRange(caster, getFullCastRange(caster, arc));
      if (target) castImmediatelyOnTarget(caster, arc, target);
    }

    // 雷击：仅对英雄，只有小兵时不放
    const bolt = caster.FindAbilityByName('zuus_lightning_bolt');
    if (bolt && bolt.IsFullyCastable()) {
      const [target] = findEnemiesInRange(
        caster,
        getFullCastRange(caster, bolt),
        UnitTargetType.HERO,
      );
      if (target !== undefined) castImmediatelyOnTarget(caster, bolt, target);
    }
  }
}
