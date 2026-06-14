import { registerAbility } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  getFullCastRange,
} from './shared/auto-cast-ability';

/** 斧王 自动淘汰之刃-觉醒：autocast 开启、淘汰之刃就绪时，自动斩杀血量低于阈值的敌方英雄（施放原版淘汰之刃，击杀/收获护甲交给原版）。 */
@registerAbility('axe_auto_culling_blade')
export class AxeAutoCullingBlade extends AutoCastAbility {
  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    const culling = caster.FindAbilityByName('axe_culling_blade');
    if (!culling || !culling.IsFullyCastable()) return;

    // 淘汰之刃可对魔免单位施放
    const enemies = findEnemiesInRange(
      caster,
      getFullCastRange(caster, culling),
      UnitTargetType.HERO,
      true,
    );

    // 斩杀线 = 原版固定阈值，吃技能增强
    const threshold =
      culling.GetSpecialValueFor('damage') * (1 + caster.GetSpellAmplification(false));
    for (const enemy of enemies) {
      if (!enemy.IsNull() && enemy.IsAlive() && enemy.GetHealth() <= threshold) {
        castImmediatelyOnTarget(caster, culling, enemy);
        return;
      }
    }
  }
}
