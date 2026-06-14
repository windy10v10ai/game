import { registerAbility } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  getFullCastRange,
} from './shared/auto-cast-ability';

/**
 * 宙斯 神王-觉醒：autocast 开启后，自动对各技能施法距离内的敌人施放弧形闪电/雷击。
 * 优先英雄；只有小兵时仅放弧形闪电（雷击留给英雄）。宙斯不可对魔免单位施放。
 */
@registerAbility('special_bonus_unique_zuus_upgrade')
export class SpecialBonusUniqueZuusUpgrade extends AutoCastAbility {
  getThinkInterval(): number {
    return 0.5;
  }

  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    // 弧形闪电：英雄优先，无英雄也对小兵
    const arc = caster.FindAbilityByName('zuus_arc_lightning');
    if (arc && arc.IsFullyCastable()) {
      const [target] = this.findTarget(caster, arc);
      if (target) castImmediatelyOnTarget(caster, arc, target);
    }

    // 雷击：仅对英雄，只有小兵时不放
    const bolt = caster.FindAbilityByName('zuus_lightning_bolt');
    if (bolt && bolt.IsFullyCastable()) {
      const [target, isHero] = this.findTarget(caster, bolt);
      if (target && isHero) castImmediatelyOnTarget(caster, bolt, target);
    }
  }

  // 返回 [目标, 是否英雄]：英雄优先，否则最近小兵
  private findTarget(
    caster: CDOTA_BaseNPC_Hero,
    ability: CDOTABaseAbility,
  ): [CDOTA_BaseNPC | undefined, boolean] {
    // 宙斯不可对魔免单位施放，allowMagicImmune 用默认 false
    const enemies = findEnemiesInRange(caster, getFullCastRange(caster, ability), UnitTargetType.HERO + UnitTargetType.BASIC);
    let creep: CDOTA_BaseNPC | undefined;
    for (const enemy of enemies) {
      if (!enemy.IsNull() && enemy.IsAlive()) {
        if (enemy.IsHero()) {
          return [enemy, true];
        }
        if (!creep) {
          creep = enemy;
        }
      }
    }
    return [creep, false];
  }
}
