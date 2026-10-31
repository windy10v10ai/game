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
    // 够不着时也指定目标走过去打；攻击移动会让引擎半路改打更近的单位，如旁边的远古野
    ExecuteOrderFromTable({
      OrderType: UnitOrder.ATTACK_TARGET,
      UnitIndex: hero.GetEntityIndex(),
      TargetIndex: target.GetEntityIndex(),
      Queue: false,
    });
    return true;
  }
}
