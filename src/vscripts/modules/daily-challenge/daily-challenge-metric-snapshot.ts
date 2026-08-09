import { ChallengeMetric } from '../../../common/dto/daily-challenge';
import {
  DailyChallengeMetricAccumulator,
  dailyChallengeMetricAccumulator,
} from './daily-challenge-accumulator';
import { DailyChallengeMetricValues } from './daily-challenge-match-context';

export interface DailyChallengeBaseMetricSource {
  heroDamage: number;
  damageTaken: number;
  healing: number;
  kills: number;
  assists: number;
  lastHits: number;
  towerKills: number;
}

function normalizeMetricValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function createDailyChallengeBaseMetricSnapshot(
  source: DailyChallengeBaseMetricSource,
): DailyChallengeMetricValues {
  return {
    hero_damage: normalizeMetricValue(source.heroDamage),
    damage_taken: normalizeMetricValue(source.damageTaken),
    healing: normalizeMetricValue(source.healing),
    kills: normalizeMetricValue(source.kills),
    assists: normalizeMetricValue(source.assists),
    last_hits: normalizeMetricValue(source.lastHits),
    tower_kills: normalizeMetricValue(source.towerKills),
  };
}

export function mergeDailyChallengeMetricSnapshots(
  base: DailyChallengeMetricValues,
  accumulated: DailyChallengeMetricValues,
): DailyChallengeMetricValues {
  const merged: DailyChallengeMetricValues = {};
  for (const [metric, value] of Object.entries({ ...base, ...accumulated }) as Array<
    [ChallengeMetric, number]
  >) {
    merged[metric] = normalizeMetricValue(value);
  }
  return merged;
}

export function getDailyChallengeDamageTaken(playerId: PlayerID): number {
  let damageTaken = 0;
  for (let attackerPlayerId = 0; attackerPlayerId < DOTA_MAX_TEAM_PLAYERS; attackerPlayerId++) {
    if (
      PlayerResource.IsValidPlayerID(attackerPlayerId) &&
      PlayerResource.IsValidPlayer(attackerPlayerId) &&
      PlayerResource.GetSelectedHeroEntity(attackerPlayerId) &&
      PlayerResource.GetTeam(attackerPlayerId) !== PlayerResource.GetTeam(playerId)
    ) {
      damageTaken += PlayerResource.GetDamageDoneToHero(attackerPlayerId, playerId);
    }
  }
  return damageTaken;
}

export function readDailyChallengeBaseMetrics(playerId: PlayerID): DailyChallengeMetricValues {
  return createDailyChallengeBaseMetricSnapshot({
    heroDamage: PlayerResource.GetRawPlayerDamage(playerId),
    damageTaken: getDailyChallengeDamageTaken(playerId),
    healing: PlayerResource.GetHealing(playerId),
    kills: PlayerResource.GetKills(playerId),
    assists: PlayerResource.GetAssists(playerId),
    lastHits: PlayerResource.GetLastHits(playerId),
    towerKills: PlayerResource.GetTowerKills(playerId),
  });
}

export function readDailyChallengeMetrics(
  playerId: PlayerID,
  accumulator: DailyChallengeMetricAccumulator = dailyChallengeMetricAccumulator,
): DailyChallengeMetricValues {
  return mergeDailyChallengeMetricSnapshots(
    readDailyChallengeBaseMetrics(playerId),
    accumulator.read(playerId),
  );
}
