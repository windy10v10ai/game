import { BaseHeroAIModifier } from "../hero/hero-base";
import { HeroUtil } from "../hero/hero-util";
import { ModeBase } from "./mode-base";
import { ModeEnum } from "./mode-enum";

export class ModeRetreat extends ModeBase {
  mode: ModeEnum = ModeEnum.RETREAT;

  GetDesire(heroAI: BaseHeroAIModifier): number {
    let desire = 0;
    if (heroAI.mode === ModeEnum.RETREAT) {
      desire += 0.4;
    }

    // 血量减少时，desire从0开始递增至1
    const curretHealthPercentage = heroAI.GetHero().GetHealthPercent();
    desire = (100 - curretHealthPercentage) / 100;
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
        building.GetUnitName().includes("rax") ||
        building.GetUnitName().includes("npc_dota_goodguys_tower3")
      ) {
        isNear3Tower = true;
        break;
      }
    }
    if (isNear3Tower) {
      print("[AI] hero is near 3 tower, not retreat");
      // is In tower4 attack range
      for (const building of buildings) {
        if (building.GetUnitName().includes("fort") || building.GetUnitName().includes("tower4")) {
          desire += this.GetIncreaseDesireNearTower(heroAI, building);
        }
      }
    }

    return desire;
  }

  GetIncreaseDesireNearTower(heroAI: BaseHeroAIModifier, tower: CDOTA_BaseNPC): number {
    let desire = 0;
    const distanceThanRange = HeroUtil.GetDistanceToAttackRange(tower, heroAI.GetHero());

    const towerBufferRange = 300;
    const distanceThanRangeWithBuffer = distanceThanRange - towerBufferRange;
    // 靠近防御塔攻击范围+300以内时，每减少100，desire增加0.1
    if (towerBufferRange <= 300) {
      desire += 0.3;
      desire += (-distanceThanRangeWithBuffer / 100) * 0.1;
    }
    return desire;
  }
}
