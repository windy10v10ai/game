import { BotBaseAIModifier } from '../hero/bot-base';
import { HeroUtil } from '../hero/hero-util';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';

export class ModeRetreat extends ModeBase {
  mode: ModeEnum = ModeEnum.RETREAT;

  GetDesire(heroAI: BotBaseAIModifier): number {
    let desire = 0;
    if (heroAI.mode === ModeEnum.RETREAT) {
      desire += 0.4;
    }

    // 血量小于60%时，desire从0开始递增至1，直到10%
    const curretHealthPercentage = heroAI.GetHero().GetHealthPercent();
    if (curretHealthPercentage < 60) {
      desire += 0.02 * (60 - curretHealthPercentage);
    }

    // FIXME 修改成被塔攻击
    // 在防御塔攻击范围内
    const nearestTower = heroAI.FindNearestEnemyTowerInvulnerable();
    if (nearestTower) {
      const distanceThanTowerAttackRange = HeroUtil.GetDistanceToAttackRange(
        nearestTower,
        heroAI.GetHero(),
      );
      if (distanceThanTowerAttackRange <= 0) {
        desire += 0.2;
      }
    }
    // 英雄小于推进等级，在防御塔攻击范围内，desire为1
    if (heroAI.GetHero().GetLevel() < heroAI.PushLevel) {
      const nearestTower = heroAI.FindNearestEnemyTowerInvulnerable();
      if (nearestTower) {
        desire += this.GetIncreaseDesireNearTower(heroAI, nearestTower);
      }
    }

    // 3塔和兵营在的情况下，不冲4塔
    // if build name contains npc_dota_goodguys_melee_rax or npc_dota_goodguys_range_rax or npc_dota_goodguys_tower3
    let isNear3Tower = false;
    const buildings = heroAI.aroundEnemyBuildingsInvulnerable;
    for (const building of buildings) {
      if (
        building.GetUnitName().includes('rax') ||
        building.GetUnitName().includes('npc_dota_goodguys_tower3')
      ) {
        isNear3Tower = true;
        break;
      }
    }
    if (isNear3Tower) {
      // is In tower4 attack range
      for (const building of buildings) {
        if (building.GetUnitName().includes('fort') || building.GetUnitName().includes('tower4')) {
          desire += this.GetIncreaseDesireNearTower(heroAI, building);
        }
      }
    }

    desire = Math.min(desire, 1);
    return desire;
  }

  GetIncreaseDesireNearTower(heroAI: BotBaseAIModifier, tower: CDOTA_BaseNPC): number {
    let desire = 0;
    const distanceThanRange = HeroUtil.GetDistanceToAttackRange(tower, heroAI.GetHero());

    const towerBufferRange = 300;
    const distanceThanRangeWithBuffer = distanceThanRange - towerBufferRange;
    // 靠近防御塔攻击范围+300以内时，每减少100，desire增加0.1
    if (distanceThanRangeWithBuffer <= 0) {
      desire += (-distanceThanRangeWithBuffer / 100) * 0.1;
    }
    desire = Math.min(desire, 0.6);
    return desire;
  }
}
