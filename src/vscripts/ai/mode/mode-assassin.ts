import { BotBaseAIModifier } from '../hero/bot-base';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';
export class ModeAssassin extends ModeBase {
  mode: ModeEnum = ModeEnum.ASSASSIN;

  GetDesire(heroAI: BotBaseAIModifier): number {
    let desire = 0;

    // 添加时间限制:游戏开始后10分钟内才能使用刺客模式
    const gameTime = GameRules.GetDOTATime(false, false);
    if (gameTime > 13 * 60) {
      return 0;
    }
    // 只有特定英雄适合暗杀
    const heroName = heroAI.GetHero().GetUnitName();
    const assassinHeroes = [
      'npc_dota_hero_bounty_hunter',
      'npc_dota_hero_phantom_assassin',
      'npc_dota_hero_riki',
      'npc_dota_hero_bloodseeker',
      'npc_dota_hero_lina',
      'npc_dota_hero_lion',
      'npc_dota_hero_skywrath_mage',
      'npc_dota_hero_zuus',
      'npc_dota_hero_nevermore',
    ];
    const hero = heroAI.GetHero();

    // 非刺客英雄且非Boss,不激活刺客模式
    if (!assassinHeroes.includes(heroName) && !hero.isBoss) {
      return 0;
    }

    // 等级太低,不适合刺杀
    if (heroAI.GetHero().GetLevel() < 20) {
      return 0;
    }

    // ✅ 修改: 使用基类的FindNearestAloneEnemyAssassin方法
    // 注意: 这里需要临时设置heroAI的hero,因为基类方法使用this.hero
    const target = heroAI.FindNearestAloneEnemyAssassin();

    if (!target) {
      //print(`[AI-Assassin] ${heroName} found no alone enemy, desire = 0`);
      return 0;
    }
    // ✅ Boss特殊逻辑
    if (hero.isBoss) {
      const bossLevel = hero.GetLevel();
      const targetLevel = 10;

      if (bossLevel >= targetLevel) {
        const highestPlayerLevel = this.GetHighestPlayerLevel();
        if (bossLevel >= highestPlayerLevel) {
          desire += 0.3;
        }
      }
    }
    //print(`[AI-Assassin] ${heroName} found alone enemy ${target.GetUnitName()}`);
    desire += 0.5;

    if (heroAI.GetHero().GetHealthPercent() > 70) {
      desire += 0.2;
    }

    const nearbyAllies = heroAI.FindNearbyAllies(1500);
    if (nearbyAllies.length >= 3) {
      desire -= 0.1;
    }

    return Math.max(0, Math.min(desire, 0.8));
  }

  // ✅ 移除: FindNearestAloneEnemy方法已移到ModeBase基类

  private GetHighestPlayerLevel(): number {
    let highestLevel = 0;
    for (let i = 0; i < 24; i++) {
      if (PlayerResource.IsValidPlayerID(i) && !PlayerResource.IsFakeClient(i)) {
        const playerHero = PlayerResource.GetSelectedHeroEntity(i);
        if (playerHero && !playerHero.IsNull()) {
          const level = playerHero.GetLevel();
          if (level > highestLevel) {
            highestLevel = level;
          }
        }
      }
    }
    return highestLevel;
  }
}
