import { HeroUtil } from "../hero/hero-util";

export class ActionAttack {
  static Attack(hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC): boolean {
    if (!target) {
      return false;
    }
    // if target in attack range
    if (HeroUtil.IsInAttackRange(hero, target)) {
      // perform attack order
      print(`[AI] Attack ${hero.GetUnitName()} to ${target.GetUnitName()}`);

      ExecuteOrderFromTable({
        OrderType: UnitOrder.ATTACK_TARGET,
        UnitIndex: hero.GetEntityIndex(),
        TargetIndex: target.GetEntityIndex(),
        Queue: false,
      });
      return true;
    } else {
      const distanceToTarget = hero.GetRangeToUnit(target);
      if (distanceToTarget > 300) {
        return false;
      }
      // 300 range内，移动到目标处攻击
      print(`[AI] MoveToTargetToAttack ${hero.GetUnitName()} to ${target.GetUnitName()}`);
      hero.MoveToTargetToAttack(target);
      return true;
    }
  }
}
