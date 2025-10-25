import { BotBaseAIModifier } from '../hero/bot-base';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';

export class ModeSplitPush extends ModeBase {
  mode: ModeEnum = ModeEnum.SPLIT_PUSH;
  // 定义适合带线的英雄列表
  private readonly splitPushHeroes = [
    'npc_dota_hero_death_prophet', // 死亡先知 - 大招推塔
    'npc_dota_hero_dragon_knight', // 龙骑士 - 坦克推塔
    'npc_dota_hero_juggernaut', // 剑圣 - 清兵快
    'npc_dota_hero_luna', // 月之骑士 - 清兵快
    'npc_dota_hero_medusa', // 美杜莎 - 分裂箭清兵
    'npc_dota_hero_sniper', // 狙击手 - 远程推塔
    'npc_dota_hero_drow_ranger', // 卓尔游侠 - 远程推塔
    'npc_dota_hero_tinker', // 修补匠 - 清兵快,有传送
    'npc_dota_hero_windrunner', // 风行者 - 推塔快
    'npc_dota_hero_bristleback', // 钢背兽 - 坦克
  ];

  GetDesire(heroAI: BotBaseAIModifier): number {
    let desire = 0;
    const heroName = heroAI.GetHero().GetUnitName();
    const hero = heroAI.GetHero();
    // 基础带线欲望
    desire += 0.5;
    // ✅ 新增: Boss特殊逻辑
    if (hero.isBoss) {
      const bossLevel = hero.GetLevel();
      const targetLevel = 30; // 可以根据难度调整为30/40/50

      // Boss达到目标等级
      if (bossLevel >= targetLevel) {
        const highestPlayerLevel = this.GetHighestPlayerLevel();
        if (bossLevel >= highestPlayerLevel) {
          desire -= 0.5; // 去attack而不是splitpysh
          //print(`[BotBoss] ${hero.GetUnitName()} level ${bossLevel} > player ${highestPlayerLevel}, decreasing splitpush desire`,);
        } else {
          // 等级低于玩家,提高分路带线欲望
          desire += 0.5;
          //print(
          //  `[BotBoss] ${hero.GetUnitName()} level ${bossLevel} < player ${highestPlayerLevel}, adding splitpush desire`,
          //);
        }
      } else {
        // 未达到目标等级,不进入
        desire -= 0.5;
      }

      desire = Math.min(desire, 0.95);
      desire = Math.max(desire, 0);
    } else {
      // 只有特定英雄才能使用带线模式
      if (!this.splitPushHeroes.includes(heroName)) {
        return 0;
      }
      // 等级至少10级才考虑带线
      const heroLevel = heroAI.GetHero().GetLevel();
      if (heroLevel < 20) {
        return 0;
      }
      if (heroLevel > 30) desire += 0.2;
    }

    // 如果队友聚集在一起,增加带线欲望
    const nearbyAllies = heroAI.FindNearbyAllies(1500);
    if (nearbyAllies.length >= 2) {
      desire += 0.2;
    }

    // 如果附近有敌方英雄,降低欲望
    const nearestEnemy = heroAI.FindNearestEnemyHero();
    if (nearestEnemy) {
      const distance = heroAI.GetDistanceTo(nearestEnemy);
      if (distance < 2000) {
        desire -= 0.3;
      }
    }

    // 血量低于50%时不带线
    if (heroAI.GetHero().GetHealthPercent() < 50) {
      desire -= 0.5;
    }

    return Math.max(0, Math.min(desire, 0.75));
  }

  // 新增: 获取最高玩家等级
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
