import { registerAbility } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findAutoCastTarget,
  getFullCastRange,
  willReflect,
} from './shared/auto-cast-ability';

const ARC_LIGHTNING_CREEP_MIN_LEVEL = 3;

/**
 * 宙斯 神王-觉醒：autocast 开启后，自动对各技能施法距离内的敌人施放弧形闪电/雷击。
 * 优先英雄；没有英雄时，弧形闪电达到等级门槛、雷击学会范围天赋才会对小兵施放。宙斯不可对魔免单位施放。
 */
@registerAbility('special_bonus_unique_zuus_upgrade')
export class SpecialBonusUniqueZuusUpgrade extends AutoCastAbility {
  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    // 弧形闪电：英雄优先，等级够高时没有英雄也对小兵
    const arc = caster.FindAbilityByName('zuus_arc_lightning');
    if (arc && arc.IsFullyCastable()) {
      const target = findAutoCastTarget(
        caster,
        getFullCastRange(caster, arc),
        arc.GetLevel() >= ARC_LIGHTNING_CREEP_MIN_LEVEL,
        UnitTargetFlags.NONE,
        willReflect,
      );
      if (target) castImmediatelyOnTarget(caster, arc, target);
    }

    // 雷击：英雄优先，学会范围雷击天赋后没有英雄也对小兵
    const bolt = caster.FindAbilityByName('zuus_lightning_bolt');
    if (bolt && bolt.IsFullyCastable()) {
      const target = findAutoCastTarget(
        caster,
        getFullCastRange(caster, bolt),
        bolt.GetSpecialValueFor('aoe_radius') > 0,
        UnitTargetFlags.NONE,
        willReflect,
      );
      if (target !== undefined) castImmediatelyOnTarget(caster, bolt, target);
    }
  }
}
