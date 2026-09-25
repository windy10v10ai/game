import { HeroUtil } from '../hero/hero-util';

export class ActionAttack {
  static MoveToAttack(
    hero: CDOTA_BaseNPC_Hero,
    target: CDOTA_BaseNPC,
    maxRange: number = 300,
  ): boolean {
    if (!target) {
      return false;
    }
    if (hero.GetRangeToUnit(target) > maxRange) {
      return false;
    }
    // 正在攻击同一目标时不重复下指令，攻击别的单位（如塔）时要转火
    if (hero.IsAttacking() && hero.GetAttackTarget() === target) {
      return true;
    }
    // if target in attack range perform attack order
    if (HeroUtil.IsInAttackRange(hero, target)) {
      // print(`[AI] Attack ${hero.GetUnitName()} to ${target.GetUnitName()}`);

      ExecuteOrderFromTable({
        OrderType: UnitOrder.ATTACK_TARGET,
        UnitIndex: hero.GetEntityIndex(),
        TargetIndex: target.GetEntityIndex(),
        Queue: false,
      });
      return true;
    } else {
      // maxRange内，移动到目标处攻击
      ExecuteOrderFromTable({
        OrderType: UnitOrder.ATTACK_MOVE,
        UnitIndex: hero.GetEntityIndex(),
        Position: target.GetAbsOrigin(),
        Queue: false,
      });
      return true;
    }
  }
}
