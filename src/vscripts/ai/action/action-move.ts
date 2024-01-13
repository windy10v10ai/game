import { HeroUtil } from "../hero/hero-util";

export class ActionMove {
  static MoveHero(hero: CDOTA_BaseNPC_Hero, pos: Vector) {
    hero.MoveToPosition(pos);
  }

  static MoveHeroToDirection(hero: CDOTA_BaseNPC_Hero, direction: Vector, distance: number) {
    const pos = hero.GetAbsOrigin().__add(direction.__mul(distance));
    hero.MoveToPosition(pos);
  }

  static MoveAround(hero: CDOTA_BaseNPC_Hero, pos: Vector, radius: number) {
    const randomPos = pos.__add(RandomVector(radius));
    hero.MoveToPosition(randomPos);
  }

  static GetAwayFromTower(hero: CDOTA_BaseNPC_Hero, enemyTower: CDOTA_BaseNPC): boolean {
    // 如果英雄残血，return false
    if (hero.GetHealthPercent() < 0.2) {
      return false;
    }
    const direction = hero
      .GetAbsOrigin()
      // 远离天辉泉水方向
      .__sub(Vector(-7200, -6700, 386))
      .Normalized();
    if (!enemyTower) {
      return false;
    }
    const towerName = enemyTower.GetUnitName();
    if (
      towerName.includes("tower3") ||
      towerName.includes("tower4") ||
      towerName.includes("fort")
    ) {
      print("[AI] 从基地撤退");
      ActionMove.MoveHeroToDirection(hero, direction, 100);
      return true;
    }

    // 如果在防御塔的攻击范围内，就往防御塔的反方向跑
    if (HeroUtil.GetDistanceToAttackRange(enemyTower, hero) <= 300) {
      const directionTower = hero.GetAbsOrigin().__sub(enemyTower.GetAbsOrigin()).Normalized();
      const newDirection = direction.__add(directionTower).Normalized();
      print("[AI] 远离防御塔");
      ActionMove.MoveHeroToDirection(hero, newDirection, 100);
      return true;
    }
    return false;
  }
}
