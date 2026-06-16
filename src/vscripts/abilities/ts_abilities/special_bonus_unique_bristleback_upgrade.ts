import { registerAbility } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  getFullCastRange,
} from './shared/auto-cast-ability';

/**
 * 钢背兽 自动喷刺-觉醒：autocast 开启后，仅在范围内有敌方英雄时自动施放。
 * 倒刺喷射对自身 AoE，黏液锁最近敌方英雄；离战不放以省蓝。每次自动施放叠战意层。
 */
@registerAbility('special_bonus_unique_bristleback_upgrade')
export class SpecialBonusUniqueBristlebackUpgrade extends AutoCastAbility {
  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    // 倒刺喷射：自身 AoE，检测半径读 KV radius；范围内有敌方英雄才喷
    const quill = caster.FindAbilityByName('bristleback_quill_spray');
    if (quill && quill.IsFullyCastable()) {
      const radius = quill.GetSpecialValueFor('radius');
      if (findEnemiesInRange(caster, radius, UnitTargetType.HERO).length > 0) {
        caster.CastAbilityImmediately(quill, caster.GetPlayerOwnerID());
      }
    }

    // 黏液：锁施法距离内最近的敌方英雄
    const goo = caster.FindAbilityByName('bristleback_viscous_nasal_goo');
    if (goo && goo.IsFullyCastable()) {
      const [target] = findEnemiesInRange(
        caster,
        getFullCastRange(caster, goo),
        UnitTargetType.HERO,
      );
      if (target !== undefined) {
        castImmediatelyOnTarget(caster, goo, target);
      }
    }
  }
}
