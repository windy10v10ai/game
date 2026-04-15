import { ActionFind } from '../action/action-find';
import { BotBaseAIModifier } from '../hero/bot-base';
import { HeroUtil } from '../hero/hero-util';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';
import { UtilityMath } from './utility-math';

export class ModeAttack extends ModeBase {
  mode: ModeEnum = ModeEnum.ATTACK;

  GetDesire(heroAI: BotBaseAIModifier): number {
    const superiorityRatio = this.CalculateLocalSuperiority(heroAI);
    if (superiorityRatio < 0) return 0; // no visible enemies
    let desire = UtilityMath.Logistic(superiorityRatio, 1.2, 5);

    const maxMana = heroAI.GetHero().GetMaxMana();
    const manaRatio = maxMana > 0 ? heroAI.GetHero().GetMana() / maxMana : 1;
    desire *= manaRatio;

    desire = Math.min(desire, 0.8);
    return desire;
  }

  private CalculateLocalSuperiority(heroAI: BotBaseAIModifier): number {
    const hero = heroAI.GetHero();
    const allyHeroes = ActionFind.Find(
      hero,
      1200,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NONE,
    );
    const enemyHeroes = ActionFind.FindEnemyHeroes(hero, 1200);

    let allyPower = 0;
    for (const ally of allyHeroes) {
      allyPower += (ally.GetHealthPercent() / 100) * ally.GetLevel();
    }

    if (enemyHeroes.length === 0) {
      return -1; // sentinel: no enemies visible
    }

    let enemyPower = 0;
    for (const enemy of enemyHeroes) {
      enemyPower += (enemy.GetHealthPercent() / 100) * enemy.GetLevel();
    }

    // Allied tower within 800 range adds +2 to ally power
    const alliedTowers = ActionFind.FindTeamBuildingsInvulnerable(hero, 800);
    if (alliedTowers.length > 0) {
      allyPower += 2;
    }

    // Enemy tower within 800 range adds +2 to enemy power
    const enemyTowers = ActionFind.FindEnemyBuildingsInvulnerable(hero, 800);
    if (enemyTowers.length > 0) {
      enemyPower += 2;
    }

    return allyPower / (enemyPower || 1);
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
