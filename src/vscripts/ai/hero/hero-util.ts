export class HeroUtil {
  static stunModifiers = [
    "modifier_axe_berserkers_call", // 战吼
    "modifier_legion_commander_duel", // 决斗
    "modifier_winter_wyvern_winters_curse", // 冰龙大
    "modifier_huskar_life_break_taunt", // 哈斯卡 A杖大
    "modifier_teleporting", // TP
  ];

  static NotActionable(hero: CDOTA_BaseNPC): boolean {
    // 死亡
    if (hero.IsAlive() === false) {
      return true;
    }
    // 眩晕
    if (hero.IsStunned()) {
      return true;
    }
    // 变羊
    if (hero.IsHexed()) {
      return true;
    }
    // 噩梦
    if (hero.IsNightmared()) {
      return true;
    }
    // 虚空大
    if (hero.IsFrozen()) {
      return true;
    }
    // FIXME 禁用物品，修改成可以采取其他行动
    if (hero.IsMuted()) {
      return true;
    }
    // is hero has stun modifier
    for (const modifier of this.stunModifiers) {
      if (hero.HasModifier(modifier)) {
        return true;
      }
    }

    return false;
  }

  // static GetDirectionAwayFromEnemies(
  //   hero: CDOTA_BaseNPC_Hero,
  //   enemyTower: CDOTA_BaseNPC | undefined,
  // ): Vector {
  //   let direction = Vector(0, 0, 0);
  //   if (enemyTower) {
  //     const towerName = enemyTower.GetUnitName();
  //     if (
  //       towerName.includes("tower3") ||
  //       towerName.includes("tower4") ||
  //       towerName.includes("fort")
  //     ) {
  //       print("[AI] 从基地撤退");
  //       direction = hero
  //         .GetAbsOrigin()
  //         .__sub(Vector(-7200, -6700, 386))
  //         .Normalized();
  //       return direction;
  //     }

  //     const directionTower = hero.GetAbsOrigin().__sub(enemyTower.GetAbsOrigin()).Normalized();
  //     direction = direction.__add(directionTower).Normalized();
  //     // 如果在防御塔的攻击范围内，就往防御塔的反方向跑
  //     if (this.IsInAttackRange(enemyTower, hero)) {
  //       return direction;
  //     }
  //   }
  //   return direction;
  // }

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

  static GetDistanceToHero(attacker: CDOTA_BaseNPC, target: CDOTA_BaseNPC): number {
    const distance = attacker.GetRangeToUnit(target);
    return distance;
  }
}
