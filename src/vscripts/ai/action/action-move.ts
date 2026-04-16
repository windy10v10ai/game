import { HeroUtil } from '../hero/hero-util';
import { BotBehaviorUtil } from '../mode/bot-behavior-util';

export class ActionMove {
  static readonly posRadiantBase: Vector = Vector(-7050, -6550, 384);
  static readonly posDireBase: Vector = Vector(6950, 6320, 384);
  static MoveHero(hero: CDOTA_BaseNPC_Hero, pos: Vector) {
    ExecuteOrderFromTable({
      OrderType: UnitOrder.MOVE_TO_POSITION,
      UnitIndex: hero.GetEntityIndex(),
      Position: pos,
      Queue: false,
    });
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

  /**
   * Flee from a group of enemies toward safety.
   *
   * Uses the centroid of all visible enemies (rather than just the nearest) and
   * the centroid of all nearby allies to compute the escape vector, so the bot
   * threads between multiple threats instead of running into a cluster that
   * happens to lie in the direction of the nearest ally.
   *
   * When allies are present the direction blends 60% toward ally centroid and
   * 40% away from enemy centroid. Without allies the hero runs straight to base.
   */
  static FleeTowardSafety(
    hero: CDOTA_BaseNPC_Hero,
    enemies: CDOTA_BaseNPC[],
    allies: CDOTA_BaseNPC[],
  ): void {
    if (enemies.length === 0) return;

    const heroPos = hero.GetAbsOrigin();

    const enemyPositions = enemies.map((e) => {
      const p = e.GetAbsOrigin();
      return { x: p.x, y: p.y };
    });
    const allyPositions = allies.map((a) => {
      const p = a.GetAbsOrigin();
      return { x: p.x, y: p.y };
    });

    if (allyPositions.length > 0) {
      const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(
        heroPos.x, heroPos.y,
        enemyPositions,
        allyPositions,
      );
      ActionMove.MoveHeroToDirection(hero, Vector(dir.x, dir.y, 0) as Vector, 600);
    } else {
      // No allies nearby — run straight to base
      const basePos =
        hero.GetTeamNumber() === DotaTeam.GOODGUYS
          ? ActionMove.posRadiantBase
          : ActionMove.posDireBase;
      ActionMove.MoveHero(hero, basePos);
    }
  }

  static GetAwayFromTower(hero: CDOTA_BaseNPC_Hero, enemyTower: CDOTA_BaseNPC): boolean {
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
      towerName.includes('tower3') ||
      towerName.includes('tower4') ||
      towerName.includes('fort')
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
