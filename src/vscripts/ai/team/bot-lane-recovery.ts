import { PlayerHelper } from '../../modules/helper/player-helper';
import { ActionFind } from '../action/action-find';
import { HeroUtil } from '../hero/hero-util';
import {
  BotLane,
  BotLaneRecoveryTower,
  getRecoveryTowerCandidates,
  getPreferredRecoveryTowers,
  resolveBotLaneRecovery,
} from './bot-lane-recovery-decision';

const ENEMY_HERO_RADIUS = 1600;
const LANE_CREEP_RADIUS = 1400;
const LANDING_RADIUS_MIN = 300;
const LANDING_RADIUS_MAX = 600;

export class BotLaneRecovery {
  public Run(): void {
    const towers = this.FindFriendlyTowers();
    if (towers.length === 0) {
      return;
    }

    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsBotPlayerByPlayerId(playerId)) {
        return;
      }
      if (PlayerResource.GetTeam(playerId) !== DotaTeam.BADGUYS) {
        return;
      }

      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero || !hero.IsAlive() || hero.IsIllusion() || HeroUtil.NotActionable(hero)) {
        return;
      }
      if (hero.IsMuted()) {
        return;
      }

      const scroll = hero.FindItemInInventory('item_tpscroll');
      if (!scroll || !scroll.IsFullyCastable()) {
        return;
      }
      if (ActionFind.FindEnemyHeroes(hero, ENEMY_HERO_RADIUS).length > 0) {
        return;
      }

      const laneCreeps = this.FindLaneCreeps(hero);
      const enemyLaneCreep = laneCreeps.find(
        (creep) => creep.GetTeamNumber() !== hero.GetTeamNumber(),
      );
      const lane = enemyLaneCreep ? this.GetLane(enemyLaneCreep.GetAbsOrigin()) : undefined;
      const laneTowers = getRecoveryTowerCandidates(towers, lane);
      const nearestLaneTowerDistance = this.GetNearestTowerDistance(hero, laneTowers);
      const nearestTowerDistance = this.GetNearestTowerDistance(hero, towers);
      const attackTarget = hero.GetAttackTarget();
      const hasAttackTarget =
        attackTarget !== undefined && !attackTarget.IsNull() && attackTarget.IsAlive();
      const decision = resolveBotLaneRecovery({
        enemyLane: lane,
        hasFriendlyLaneCreep: laneCreeps.some(
          (creep) => creep.GetTeamNumber() === hero.GetTeamNumber(),
        ),
        distanceToLaneTower: nearestLaneTowerDistance,
        isAttackingNeutral: hasAttackTarget && attackTarget.GetTeamNumber() === DotaTeam.NEUTRALS,
        isAttackingAncient: hasAttackTarget && attackTarget.IsAncient(),
        distanceToNearestTower: nearestTowerDistance,
      });
      if (!decision) {
        return;
      }

      const preferredTowers = getPreferredRecoveryTowers(towers, decision.lane);
      const tower = preferredTowers[RandomInt(0, preferredTowers.length - 1)];
      const recoveryDistance =
        decision.reason === 'lane' ? nearestLaneTowerDistance : nearestTowerDistance;
      const landingPosition = tower.value
        .GetAbsOrigin()
        .__add(RandomVector(RandomInt(LANDING_RADIUS_MIN, LANDING_RADIUS_MAX)));

      hero.CastAbilityOnPosition(landingPosition, scroll, playerId);
      print(
        `[BotLaneRecovery] hero=${hero.GetUnitName()} reason=${decision.reason} distance=${Math.floor(recoveryDistance!)} tower=${tower.value.GetUnitName()} landing=(${Math.floor(landingPosition.x)},${Math.floor(landingPosition.y)},${Math.floor(landingPosition.z)})`,
      );
    });
  }

  private FindFriendlyTowers(): BotLaneRecoveryTower<CDOTA_BaseNPC>[] {
    const towers = Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[];
    const result: BotLaneRecoveryTower<CDOTA_BaseNPC>[] = [];
    for (const tower of towers) {
      if (tower.IsNull() || !tower.IsAlive() || tower.GetTeamNumber() !== DotaTeam.BADGUYS) {
        continue;
      }

      const tier = this.GetTowerTier(tower.GetUnitName());
      if (!tier) {
        continue;
      }
      result.push({ value: tower, lane: this.GetTowerLane(tower.GetUnitName()), tier });
    }
    return result;
  }

  private FindLaneCreeps(hero: CDOTA_BaseNPC_Hero): CDOTA_BaseNPC[] {
    const creeps = ActionFind.Find(
      hero,
      LANE_CREEP_RADIUS,
      UnitTargetTeam.BOTH,
      UnitTargetType.CREEP,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
    );
    return creeps.filter((creep) => this.IsLaneCreep(creep));
  }

  private IsLaneCreep(creep: CDOTA_BaseNPC): boolean {
    const name = creep.GetUnitName();
    return name.includes('creep_goodguys') || name.includes('creep_badguys');
  }

  private GetNearestTowerDistance(
    hero: CDOTA_BaseNPC_Hero,
    towers: readonly BotLaneRecoveryTower<CDOTA_BaseNPC>[],
  ): number | undefined {
    if (towers.length === 0) {
      return undefined;
    }
    let distance = hero.GetRangeToUnit(towers[0].value);
    for (const tower of towers) {
      distance = Math.min(distance, hero.GetRangeToUnit(tower.value));
    }
    return distance;
  }

  private GetTowerTier(name: string): number | undefined {
    if (name.includes('tower1')) {
      return 1;
    }
    if (name.includes('tower2')) {
      return 2;
    }
    if (name.includes('tower3')) {
      return 3;
    }
    return undefined;
  }

  private GetTowerLane(name: string): BotLane | undefined {
    if (name.includes('top')) {
      return 'top';
    }
    if (name.includes('mid')) {
      return 'mid';
    }
    if (name.includes('bot')) {
      return 'bot';
    }
    return undefined;
  }

  private GetLane(position: Vector): BotLane | undefined {
    if (Math.abs(Math.abs(position.x) - Math.abs(position.y)) < 1500) {
      return 'mid';
    }
    if (position.x > 0 && position.y < 0) {
      return 'bot';
    }
    if (position.x < 0 && position.y > 0) {
      return 'top';
    }
    return undefined;
  }
}
