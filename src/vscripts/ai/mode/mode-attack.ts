import { BaseHeroAIModifier } from "../hero/hero-base";
import { HeroUtil } from "../hero/hero-util";
import { ModeBase } from "./mode-base";
import { ModeEnum } from "./mode-enum";

export class ModeAttack extends ModeBase {
  mode: ModeEnum = ModeEnum.ATTACK;

  GetDesire(heroAI: BaseHeroAIModifier): number {
    let desire = 0;

    if (heroAI.mode === ModeEnum.RETREAT) {
      desire -= 0.4;
    }
    if (heroAI.mode === ModeEnum.LANING) {
      desire -= 0.1;
    }
    if (heroAI.mode === ModeEnum.PUSH) {
      desire += 0.1;
    }
    if (heroAI.mode === ModeEnum.ATTACK) {
      desire += 0.1;
    }

    // if (heroAI.gameTime < 180) {
    //   if (this.HasEnemyNotNearTower(heroAI)) {
    //     desire += 0.7;
    //   }
    // }
    desire = Math.min(desire, 0.8);
    return desire;
  }

  HasEnemyNotNearTower(heroAI: BaseHeroAIModifier): boolean {
    const nearestHero = heroAI.FindNearestEnemyHero();
    if (!nearestHero) {
      return false;
    }
    const nearestTower = heroAI.FindNearestEnemyTowerInvulnerable();
    if (nearestTower) {
      const isNearestHeroInTowerRange = HeroUtil.IsInAttackRange(nearestTower, nearestHero);
      if (isNearestHeroInTowerRange) {
        return false;
      }

      const distanceToTowerRange = HeroUtil.GetDistanceToAttackRange(
        nearestTower,
        heroAI.GetHero(),
      );
      if (distanceToTowerRange < 400) {
        return false;
      }
    }
    return true;
  }
}
