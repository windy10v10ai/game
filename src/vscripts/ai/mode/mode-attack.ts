import { BotBaseAIModifier } from '../hero/bot-base';
import { HeroUtil } from '../hero/hero-util';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';

export class ModeAttack extends ModeBase {
  mode: ModeEnum = ModeEnum.ATTACK;

  GetDesire(heroAI: BotBaseAIModifier): number {
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

    // 推进阶段后，Bot 大幅提升攻击欲望
    if (GameRules.AI.BotTeam?.isAfterPhaseStart()) {
      desire += 0.52;
      if (heroAI.aroundEnemyHeroes.length > 0) {
        desire += 0.26;
      }
      if (GameRules.Option.midOnlyMode) {
        desire += 0.1;
      }
    }

    desire = Math.min(desire, GameRules.Option.midOnlyMode ? 0.94 : 0.88);
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
