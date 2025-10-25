import { BotBaseAIModifier } from '../hero/bot-base';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';

export class ModeLaning extends ModeBase {
  mode: ModeEnum = ModeEnum.LANING;

  GetDesire(heroAI: BotBaseAIModifier): number {
    let desire = 0;

    const hero = heroAI.GetHero();
    // ✅ 新增: Boss特殊逻辑
    if (hero.isBoss) {
      const bossLevel = hero.GetLevel();
      const targetLevel = 30; // 可以根据难度调整为30/40/50

      // Boss等级低于目标等级时,强制保持laning
      if (bossLevel < targetLevel) {
        desire += 0.55; // 高优先级保持laning
        //print(
        //  `[BotBoss] ${hero.GetUnitName()} level ${bossLevel} < ${targetLevel}, forcing laning mode`,
        //);
      }

      desire = Math.min(desire, 0.7);
      desire = Math.max(desire, 0);
      return desire;
    }

    if (heroAI.GetHero().GetLevel() < heroAI.PushLevel) {
      desire += 0.55;
    } else {
      // 不增加
    }

    desire = Math.min(desire, 0.7);
    desire = Math.max(desire, 0);
    return desire;
  }
}
