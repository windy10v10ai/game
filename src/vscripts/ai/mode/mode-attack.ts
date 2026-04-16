import { ActionFind } from '../action/action-find';
import { BotBaseAIModifier } from '../hero/bot-base';
import { HeroUtil } from '../hero/hero-util';
import { BotBehaviorUtil } from './bot-behavior-util';
import { TeamCommander } from '../team/team-commander';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';
import { PowerUtil } from './power-util';
import { UtilityMath } from './utility-math';

export class ModeAttack extends ModeBase {
  mode: ModeEnum = ModeEnum.ATTACK;

  GetDesire(heroAI: BotBaseAIModifier): number {
    const superiorityRatio = this.CalculateLocalSuperiority(heroAI);
    if (superiorityRatio < 0) return 0; // no visible enemies or ghosts
    let desire = UtilityMath.Logistic(superiorityRatio, 1.2, 5);

    // Standing inside an enemy tower's attack range: apply suppression unless
    // the local team can collectively kill the target before tower fire is fatal.
    //
    // Team DPS = sum of all allied heroes within 1200 units (including self).
    // Team HP  = sum of their current HP — tower focuses one at a time, so the
    //            combined pool approximates how long the team can collectively stay.
    //
    // Three tiers based on TowerKillConfidence(teamHp, teamDps, targetHp, towerDps):
    //   HIGH   (≥0.65) → no suppression  — team kills target before tower kills anyone.
    //   MEDIUM (≥0.40) → ×0.55 penalty   — cautious follow-up; might be possible.
    //   LOW    (<0.40) → ×0.1  penalty   — don't dive; tower wins.
    const nearestEnemyTower = heroAI.FindNearestEnemyTowerInvulnerable();
    if (nearestEnemyTower) {
      const distanceToRange = HeroUtil.GetDistanceToAttackRange(
        nearestEnemyTower,
        heroAI.GetHero(),
      );
      if (distanceToRange <= 0) {
        const hero = heroAI.GetHero();

        // Sum HP and DPS of all nearby allies + self
        const allyHeroes = ActionFind.Find(
          hero,
          1200,
          UnitTargetTeam.FRIENDLY,
          UnitTargetType.HERO,
          UnitTargetFlags.NONE,
        );
        let teamHp  = hero.GetHealth();
        let teamDps = hero.GetLevel() * 10;
        for (const ally of allyHeroes) {
          teamHp  += ally.GetHealth();
          teamDps += ally.GetLevel() * 10;
        }

        const heroAttackRange = hero.GetBaseAttackRange() + 300;
        let bestConfidence = 0;
        for (const e of heroAI.aroundEnemyHeroes) {
          if (HeroUtil.GetDistanceToHero(hero, e) <= heroAttackRange) {
            const conf = BotBehaviorUtil.TowerKillConfidence(teamHp, teamDps, e.GetHealth(), 150);
            if (conf > bestConfidence) bestConfidence = conf;
          }
        }

        if (bestConfidence >= BotBehaviorUtil.TOWER_KILL_HIGH_CONFIDENCE) {
          // High confidence: no suppression
        } else if (bestConfidence >= BotBehaviorUtil.TOWER_KILL_MEDIUM_CONFIDENCE) {
          desire *= 0.55;
        } else {
          desire *= 0.1;
        }
      }
    }

    const maxMana = heroAI.GetHero().GetMaxMana();
    const manaRatio = maxMana > 0 ? heroAI.GetHero().GetMana() / maxMana : 1;
    desire *= manaRatio;

    // Personality: aggressive bots fight more readily, cautious ones less so.
    // Applied before caps so personality cannot exceed the designed ceilings.
    desire *= heroAI.aggressionBias;

    // Bait suppression: when multiple enemies are unaccounted for and the bot
    // has no nearby allied tower for safety, a killable-looking target may be
    // bait. Cap desire just above the activation threshold so retreat can override.
    // Applied AFTER personality so an aggressive bias cannot defeat the suppression.
    const missingCount = TeamCommander.getInstance().GetEnemyMissingCount(
      heroAI.GetHero().GetTeamNumber(),
    );
    if (missingCount >= 3) {
      const alliedTowersNearby = ActionFind.FindTeamBuildingsInvulnerable(heroAI.GetHero(), 800);
      if (alliedTowersNearby.length === 0) {
        desire = Math.min(desire, 0.52);
      }
    }

    desire = Math.min(desire, 0.8);
    return desire;
  }

  private CalculateLocalSuperiority(heroAI: BotBaseAIModifier): number {
    const hero = heroAI.GetHero();
    const allyHeroes = ActionFind.Find(
      hero,
      1200,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NONE,
    );
    const enemyHeroes = ActionFind.FindEnemyHeroes(hero, 1200);

    let allyPower = 0;
    for (const ally of allyHeroes) {
      allyPower += PowerUtil.CalculatePowerUnit(ally);
    }

    // Ghost power: enemies that just left vision still contribute to enemy power,
    // decaying exponentially over ~6 seconds. Prevents the bot from instantly
    // assuming a fight is won when an enemy jukes behind a tree.
    const heroPos = hero.GetAbsOrigin();
    const ghostPower = TeamCommander.getInstance().GetGhostEnemyPower(
      hero.GetTeamNumber(),
      heroPos.x,
      heroPos.y,
      1200,
      heroAI.gameTime,
    );

    let enemyPower = 0;
    for (const enemy of enemyHeroes) {
      enemyPower += PowerUtil.CalculatePowerUnit(enemy);
    }
    enemyPower += ghostPower;

    if (enemyHeroes.length === 0 && ghostPower === 0) {
      return -1; // sentinel: no enemies visible or recently seen
    }

    // Allied tower within 800 range adds +2 to ally power
    const alliedTowers = ActionFind.FindTeamBuildingsInvulnerable(hero, 800);
    if (alliedTowers.length > 0) {
      allyPower += 2;
    }

    // Enemy tower within 800 range adds +2 to enemy power
    const enemyTowers = ActionFind.FindEnemyBuildingsInvulnerable(hero, 800);
    if (enemyTowers.length > 0) {
      enemyPower += 2;
    }

    return allyPower / (enemyPower || 1);
  }

  HasEnemyNotNearTower(heroAI: BotBaseAIModifier): boolean {
    const nearestHero = heroAI.FindNearestEnemyHero();
    if (!nearestHero) {
      return false;
    }
    const nearestTower = heroAI.FindNearestEnemyTowerInvulnerable();
    if (nearestTower) {
      const isNearestHeroInTowerRange = HeroUtil.IsInAttackRange(nearestTower, nearestHero);
      if (isNearestHeroInTowerRange) {
        return false;
      }

      const distanceToTowerRange = HeroUtil.GetDistanceToAttackRange(
        nearestTower,
        heroAI.GetHero(),
      );
      if (distanceToTowerRange < 400) {
        return false;
      }
    }
    return true;
  }
}
