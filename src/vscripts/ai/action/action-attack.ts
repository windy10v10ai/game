export class ActionAttack {
  static Attack(hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC) {
    // if target in attack range
    if (this.IsInAttackRange(hero, target)) {
      // perform attack order
      print(`[AI] Attack ${hero.GetUnitName()} to ${target.GetUnitName()}`);

      ExecuteOrderFromTable({
        OrderType: UnitOrder.ATTACK_TARGET,
        UnitIndex: hero.GetEntityIndex(),
        TargetIndex: target.GetEntityIndex(),
        Queue: false,
      });
      return;
    } else {
      // move to target
      print(`[AI] MoveToTargetToAttack ${hero.GetUnitName()} to ${target.GetUnitName()}`);
      hero.MoveToTargetToAttack(target);
    }
  }

  static IsInAttackRange(attacker: CDOTA_BaseNPC, target: CDOTA_BaseNPC): boolean {
    return this.GetDistanceToAttackRange(attacker, target) <= 0;
  }

  /**
   * 小于等于0表示在攻击范围内
   * @returns distance - attackRange
   */
  static GetDistanceToAttackRange(attacker: CDOTA_BaseNPC, target: CDOTA_BaseNPC): number {
    const attackRange = attacker.GetBaseAttackRange();
    const attackerCollision = attacker.GetHullRadius();
    const targetCollision = target.GetHullRadius();
    const distance = attacker.GetRangeToUnit(target) - attackerCollision - targetCollision;
    return distance - attackRange;
  }
}
