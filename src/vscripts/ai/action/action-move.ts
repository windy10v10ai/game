import { HeroUtil } from "../hero/hero-util";

export class ActionMove {
  static readonly posRadiantBase: Vector = Vector(-7200, -6700, 386);
  static readonly posDireBase: Vector = Vector(7200, 6624, 384);
  static MoveHero(hero: CDOTA_BaseNPC_Hero, pos: Vector) {
    hero.MoveToPosition(pos);
  }

  static MoveHeroToDirection(
    hero: CDOTA_BaseNPC_Hero,
    direction: Vector,
    distance: number,
    randomRadius?: number,
  ) {
    let pos = hero.GetAbsOrigin().__add(direction.__mul(distance));

    // 随机一点
    if (randomRadius) {
      pos = pos.__add(RandomVector(randomRadius));
    }

    ExecuteOrderFromTable({
      OrderType: UnitOrder.MOVE_TO_POSITION,
      UnitIndex: hero.GetEntityIndex(),
      Position: pos,
      Queue: false,
    });
  }

  // MOVE_RELATIVE
  static MoveRelative(hero: CDOTA_BaseNPC_Hero, pos: Vector) {
    ExecuteOrderFromTable({
      OrderType: UnitOrder.MOVE_TO_POSITION,
      UnitIndex: hero.GetEntityIndex(),
      Position: pos,
      Queue: false,
    });
  }

  static GetAwayFromTower(hero: CDOTA_BaseNPC_Hero, enemyTower: CDOTA_BaseNPC): boolean {
    // 如果英雄残血，return false
    if (hero.GetHealthPercent() < 0.2) {
      return false;
    }
    // const direction = hero
    //   .GetAbsOrigin()
    //   // 远离天辉泉水方向
    //   .__sub(Vector(-7200, -6700, 386))
    //   .Normalized();
    if (!enemyTower) {
      return false;
    }
    const towerName = enemyTower.GetUnitName();
    // if hero is good go to radiant base, else go to dire base
    const pos = hero.GetTeamNumber() === DotaTeam.GOODGUYS ? this.posRadiantBase : this.posDireBase;
    if (
      towerName.includes("tower3") ||
      towerName.includes("tower4") ||
      towerName.includes("fort")
    ) {
      // print(`[AI] 从基地撤退 ${hero.GetUnitName()} `);
      ActionMove.MoveRelative(hero, pos);
      return true;
    }

    // 如果在防御塔的攻击范围内，就往防御塔的反方向跑
    if (HeroUtil.GetDistanceToAttackRange(enemyTower, hero) <= 300) {
      // const directionTower = hero.GetAbsOrigin().__sub(enemyTower.GetAbsOrigin()).Normalized();
      // const newDirection = direction.__add(directionTower).Normalized();
      // print(`[AI] 从防御塔撤退 ${hero.GetUnitName()} `);
      ActionMove.MoveRelative(hero, pos);
      return true;
    }
    return false;
  }
}
