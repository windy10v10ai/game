import { BotBaseAIModifier } from '../hero/bot-base';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';

export class ModeVanguard extends ModeBase {
  mode: ModeEnum = ModeEnum.VANGUARD;

  GetDesire(heroAI: BotBaseAIModifier): number {
    let desire = 0;

    // 只有坦克型英雄适合冲锋
    const heroName = heroAI.GetHero().GetUnitName();
    const vanguardHeroes = [
      'npc_dota_hero_axe', // 斧王 - 开团嘲讽
      'npc_dota_hero_chaos_knight', // 混沌骑士 - 坦克输出
      'npc_dota_hero_earthshaker', // 撼地者 - 开团控制
      'npc_dota_hero_kunkka', // 昆卡 - 开团控制
      'npc_dota_hero_pudge', // 帕吉 - 钩人开团
      'npc_dota_hero_sand_king', // 沙王 - 跳大开团
      'npc_dota_hero_sven', // 斯温 - 坦克输出
      'npc_dota_hero_tiny', // 小小 - 开团控制
      'npc_dota_hero_skeleton_king', // 骷髅王 - 坦克复活
      'npc_dota_hero_omniknight', // 全能骑士 - 保护队友
    ];

    if (!vanguardHeroes.includes(heroName)) {
      return 0;
    }

    // 当前必须是推进模式
    if (heroAI.mode !== ModeEnum.PUSH) {
      return 0;
    }

    // 基础冲锋欲望
    desire += 0.3;

    // 如果队友在附近
    const nearbyAllies = heroAI.FindNearbyAllies(2000);
    if (nearbyAllies.length >= 2) {
      desire += 0.4;
    }

    // 血量和装备足够
    if (heroAI.GetHero().GetHealthPercent() > 60) {
      desire += 0.3;
    }

    // 如果接近敌方高地
    const nearestTower = heroAI.FindNearestEnemyTowerInvulnerable();
    if (nearestTower) {
      const towerName = nearestTower.GetUnitName();
      if (towerName.includes('tower3') || towerName.includes('tower4')) {
        desire += 0.3;
      }
    }

    return Math.max(0, Math.min(desire, 0.85));
  }
}
