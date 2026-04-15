import { BotBaseAIModifier } from '../hero/bot-base';
import { HeroUtil } from '../hero/hero-util';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';
import { TeamCommander } from '../team/team-commander';
import { UtilityMath } from './utility-math';

// Exact unit names for tier 3 towers and barracks (avoids .includes() in tight loop)
const TIER3_AND_RAX_NAMES: string[] = [
  'npc_dota_goodguys_tower3_top',
  'npc_dota_goodguys_tower3_mid',
  'npc_dota_goodguys_tower3_bot',
  'npc_dota_badguys_tower3_top',
  'npc_dota_badguys_tower3_mid',
  'npc_dota_badguys_tower3_bot',
  'npc_dota_goodguys_melee_rax_top',
  'npc_dota_goodguys_melee_rax_mid',
  'npc_dota_goodguys_melee_rax_bot',
  'npc_dota_goodguys_range_rax_top',
  'npc_dota_goodguys_range_rax_mid',
  'npc_dota_goodguys_range_rax_bot',
  'npc_dota_badguys_melee_rax_top',
  'npc_dota_badguys_melee_rax_mid',
  'npc_dota_badguys_melee_rax_bot',
  'npc_dota_badguys_range_rax_top',
  'npc_dota_badguys_range_rax_mid',
  'npc_dota_badguys_range_rax_bot',
];

const FORT_AND_TOWER4_NAMES: string[] = [
  'npc_dota_goodguys_fort',
  'npc_dota_badguys_fort',
  'npc_dota_goodguys_tower4',
  'npc_dota_badguys_tower4',
];

export class ModeRetreat extends ModeBase {
  mode: ModeEnum = ModeEnum.RETREAT;

  GetDesire(heroAI: BotBaseAIModifier): number {
    let desire = 0;

    // Panic curve: quadratic scaling from 60% HP down to 0%
    const currentHealthPercentage = heroAI.GetHero().GetHealthPercent();
    desire += UtilityMath.Quadratic(currentHealthPercentage, 60, 0);

    // Blackboard: add 0.05 per missing enemy above 2
    const missingCount = TeamCommander.getInstance().GetEnemyMissingCount(
      heroAI.GetHero().GetTeamNumber(),
    );
    if (missingCount > 2) {
      desire += (missingCount - 2) * 0.05;
    }

    // FIXME 修改成被塔攻击
    const nearestTower = heroAI.FindNearestEnemyTowerInvulnerable();
    if (nearestTower) {
      const distanceThanTowerAttackRange = HeroUtil.GetDistanceToAttackRange(
        nearestTower,
        heroAI.GetHero(),
      );
      if (distanceThanTowerAttackRange <= 0) {
        desire += 0.2;
      }
      // 英雄小于推进等级，在防御塔攻击范围内，desire为1
      if (heroAI.GetHero().GetLevel() < heroAI.PushLevel) {
        desire += this.GetIncreaseDesireNearTower(heroAI, nearestTower);
      }
    }

    // 3塔和兵营在的情况下，不冲4塔
    let isNear3Tower = false;
    const buildings = heroAI.aroundEnemyBuildingsInvulnerable;
    for (const building of buildings) {
      const name = building.GetUnitName();
      let isTier3OrRax = false;
      for (const tier3Name of TIER3_AND_RAX_NAMES) {
        if (name === tier3Name) {
          isTier3OrRax = true;
          break;
        }
      }
      if (isTier3OrRax) {
        isNear3Tower = true;
        break;
      }
    }
    if (isNear3Tower) {
      // is In tower4/fort attack range
      for (const building of buildings) {
        const name = building.GetUnitName();
        let isFortOrTower4 = false;
        for (const fortName of FORT_AND_TOWER4_NAMES) {
          if (name === fortName) {
            isFortOrTower4 = true;
            break;
          }
        }
        if (isFortOrTower4) {
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
