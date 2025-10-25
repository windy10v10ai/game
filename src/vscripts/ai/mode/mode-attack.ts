import { BotBaseAIModifier } from '../hero/bot-base';
import { HeroUtil } from '../hero/hero-util';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';

export class ModeAttack extends ModeBase {
  mode: ModeEnum = ModeEnum.ATTACK;

  GetDesire(heroAI: BotBaseAIModifier): number {
    let desire = 0;
    const hero = heroAI.GetHero();
    // ✅ 新增: Boss特殊逻辑
    if (hero.isBoss) {
      const bossLevel = hero.GetLevel();
      const targetLevel = 30; // 可以根据难度调整为30/40/50

      // Boss等级低于目标等级时,强制保持laning
      if (bossLevel < targetLevel) {
        desire -= 0.3; // 高优先级保持laning
        // print(
        //  `[BotBoss] ${hero.GetUnitName()} level ${bossLevel} < ${targetLevel}, no activate attacking mode`,
        // );
      }
    }
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

  HasEnemyNotNearTower(heroAI: BotBaseAIModifier): boolean {
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
