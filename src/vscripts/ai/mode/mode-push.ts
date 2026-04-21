import { ActionFind } from '../action/action-find';
import { BotBaseAIModifier } from '../hero/bot-base';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';
import { PowerUtil } from './power-util';
import { UtilityMath } from './utility-math';

export class ModePush extends ModeBase {
  mode: ModeEnum = ModeEnum.PUSH;
  hysteresisBonus: number = 0.05;

  GetDesire(heroAI: BotBaseAIModifier): number {
    const currentTime = heroAI.gameTime;
    let desire = Math.floor(currentTime / 60) * 0.03;

    const heroLevel = heroAI.GetHero().GetLevel();
    if (heroLevel >= heroAI.PushLevel) {
      desire += 0.5;
      desire += 0.01 * (heroLevel - heroAI.PushLevel);
    }

    desire = Math.min(desire, 0.75);

    // Injured bots should not push towers
    const healthRatio = heroAI.GetHero().GetHealthPercent() / 100;
    desire *= healthRatio;

    // Suppress push when outnumbered by visible enemies
    const enemyHeroes = heroAI.aroundEnemyHeroes;
    if (enemyHeroes.length > 0) {
      const hero = heroAI.GetHero();
      const allyHeroes = ActionFind.Find(
        hero,
        1200,
        UnitTargetTeam.FRIENDLY,
        UnitTargetType.HERO,
        UnitTargetFlags.NONE,
      );

      let allyPower = 0;
      for (const ally of allyHeroes) {
        allyPower += PowerUtil.CalculatePowerUnit(ally);
      }
      let enemyPower = 0;
      for (const enemy of enemyHeroes) {
        enemyPower += PowerUtil.CalculatePowerUnit(enemy);
      }

      const ratio = allyPower / (enemyPower || 1);
      desire *= UtilityMath.Logistic(ratio, 0.8, 4);
    }

    return desire;
  }
}
