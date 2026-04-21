import { ActionFind } from '../action/action-find';
import { BotBaseAIModifier } from '../hero/bot-base';
import { HeroUtil } from '../hero/hero-util';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';
import { PowerUtil } from './power-util';
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
  hysteresisBonus: number = 0.2;

  GetDesire(heroAI: BotBaseAIModifier): number {
    let desire = 0;

    // Health panic: linear from 70% HP down to 0% — gives a strong, early signal
    // that outcompetes push desire (0.75 × healthRatio) before the bot is nearly dead.
    // cautionBias > 1 makes the bot panic sooner; < 1 makes it fight through low HP.
    const currentHealthPercentage = heroAI.GetHero().GetHealthPercent();
    desire += UtilityMath.Linear(currentHealthPercentage, 70, 0) * heroAI.cautionBias;

    // Blackboard: add 0.05 per missing enemy above 2
    const missingCount = TeamCommander.getInstance().GetEnemyMissingCount(
      heroAI.GetHero().GetTeamNumber(),
    );
    if (missingCount > 2) {
      desire += (missingCount - 2) * 0.05;
    }

    // Outnumbered panic: retreat desire scales linearly with how badly we're losing
    // the local power comparison — 0 at even fight, 0.5 at 1v2, 1.0 alone vs enemies.
    // Ghost power from recently-disappeared enemies is included so the bot stays
    // cautious after an enemy jukes a tree rather than instantly relaxing.
    const enemyHeroes = heroAI.aroundEnemyHeroes;
    const hero = heroAI.GetHero();
    const heroPos = hero.GetAbsOrigin();
    const ghostPower = TeamCommander.getInstance().GetGhostEnemyPower(
      hero.GetTeamNumber(),
      heroPos.x,
      heroPos.y,
      1200,
      heroAI.gameTime,
    );
    if (enemyHeroes.length > 0 || ghostPower > 0) {
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
      let enemyPower = ghostPower;
      for (const enemy of enemyHeroes) {
        enemyPower += PowerUtil.CalculatePowerUnit(enemy);
      }
      const ratio = allyPower / (enemyPower || 1);
      desire += UtilityMath.Linear(ratio, 1.0, 0) * heroAI.cautionBias;
    }

    // Tower retreat: only meaningful when enemies are nearby — a bot at 100% HP
    // walking past a tower with no opponents shouldn't retreat back to base.
    const nearestTower = heroAI.FindNearestEnemyTowerInvulnerable();
    if (nearestTower && (enemyHeroes.length > 0 || ghostPower > 0)) {
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

    // Isolation: an enemy hero is within 900 units but the bot has no creep wave
    // or allied tower nearby for support. In lane, friendly creeps provide zoning;
    // near a tower, the tower deters pursuit. In the jungle or deep in enemy territory
    // with neither, the bot is exposed and should fall back even at full HP.
    // This beats the LANING floor (0.55) so the bot actually retreats instead of
    // hovering aimlessly. ATTACK desire (capped 0.8) still wins when the bot has
    // clear superiority, so a strong bot will still fight in the jungle.
    if (enemyHeroes.length > 0) {
      const closeEnemy = enemyHeroes.some((e) => HeroUtil.GetDistanceToHero(hero, e) <= 900);
      if (closeEnemy) {
        const alliedCreeps = ActionFind.Find(
          hero,
          1200,
          UnitTargetTeam.FRIENDLY,
          UnitTargetType.CREEP,
          UnitTargetFlags.NONE,
        );
        const alliedTowers = ActionFind.FindTeamBuildingsInvulnerable(hero, 1200);
        if (alliedCreeps.length === 0 && alliedTowers.length === 0) {
          desire += 0.6;
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
