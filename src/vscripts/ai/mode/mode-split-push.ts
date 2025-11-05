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
    const hero = heroAI.GetHero();
    const heroName = hero.GetUnitName();

    // ✅ 修复: 先检查英雄是否符合条件
    if (!this.splitPushHeroes.includes(heroName) && !hero.isBoss) {
      return 0;
    }

    // ✅ 修复: 先检查等级要求
    const heroLevel = hero.GetLevel();
    if (heroLevel < 20) {
      return 0;
    }

    // ✅ 新增: 游戏时间限制 - 游戏开始10分钟后才考虑分推
    const gameTime = GameRules.GetDOTATime(false, false);
    if (gameTime < 10 * 60) {
      return 0;
    }

    let desire = 0;

    // 基础分推欲望
    desire += 0.5;

    // ✅ 新增: 根据游戏时间增加欲望(类似 ModePush)
    desire += Math.floor(gameTime / 60) * 0.02;

    // 等级加成
    if (heroLevel > 30) {
      desire += 0.2;
    }

    // ✅ 优化: 队友聚集判断 - 需要至少3个队友才考虑分推
    const nearbyAllies = heroAI.FindNearbyAllies(1500);
    if (nearbyAllies.length >= 3) {
      desire += 0.2;
    } else if (nearbyAllies.length >= 2) {
      desire += 0.1;
    }

    // ✅ 优化: 敌人距离判断 - 分级处理
    const nearestEnemy = heroAI.FindNearestEnemyHero();
    if (nearestEnemy) {
      const distance = heroAI.GetDistanceTo(nearestEnemy);
      if (distance < 1200) {
        // 非常近,不适合分推
        desire -= 0.5;
      } else if (distance < 2000) {
        // 较近,降低欲望
        desire -= 0.3;
      }
    }

    // 血量判断
    const healthPercent = hero.GetHealthPercent();
    if (healthPercent < 50) {
      desire -= 0.5;
    } else if (healthPercent > 80) {
      // ✅ 新增: 血量充足时增加欲望
      desire += 0.1;
    }

    // ✅ 新增: Boss特殊逻辑
    if (hero.isBoss) {
      const bossLevel = hero.GetLevel();
      const highestPlayerLevel = this.GetHighestPlayerLevel();

      // Boss等级远超玩家时,更倾向于分推施压
      if (bossLevel >= highestPlayerLevel + 10) {
        desire += 0.2;
      }
    }

    // ✅ 新增: 检查是否有可推的塔
    const nearestTower = heroAI.FindNearestEnemyTower();
    if (!nearestTower) {
      // 没有塔可推,降低欲望
      desire -= 0.2;
    }

    return Math.max(0, Math.min(desire, 0.75));
  }

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
