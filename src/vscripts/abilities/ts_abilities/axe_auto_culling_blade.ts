import { registerAbility } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  getFullCastRange,
} from './shared/auto-cast-ability';

/**
 * 斧王 自动淘汰之刃-觉醒：autocast 开启时自动斩杀血量低于阈值的敌方英雄。
 * 自动触发只耗 1 次蓝、不进入 CD；下一 tick 目标仍存活则判定失败并回滚（退蓝 + 刷新 CD）。
 */
@registerAbility('axe_auto_culling_blade')
export class AxeAutoCullingBlade extends AutoCastAbility {
  private pendingTarget?: CDOTA_BaseNPC;

  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    const culling = caster.FindAbilityByName('axe_culling_blade');
    if (!culling) return;

    const pending = this.pendingTarget;
    this.pendingTarget = undefined;
    if (pending && !pending.IsNull() && pending.IsAlive()) {
      // 斩杀失败，回滚
      caster.GiveMana(culling.GetManaCost(-1));
      culling.EndCooldown();
      return;
    }

    if (!culling.IsFullyCastable()) return;
    if (this.GetCurrentAbilityCharges() <= 0) return;

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
        culling.EndCooldown(); // 不进入 CD
        this.SetCurrentAbilityCharges(this.GetCurrentAbilityCharges() - 1);
        this.pendingTarget = enemy;
        return;
      }
    }
  }
}
