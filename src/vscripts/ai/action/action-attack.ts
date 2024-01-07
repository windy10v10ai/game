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

  static IsInAttackRange(hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC): boolean {
    const attackRange = hero.GetBaseAttackRange();
    const distance = hero.GetRangeToUnit(target);
    return distance <= attackRange;
  }
}
