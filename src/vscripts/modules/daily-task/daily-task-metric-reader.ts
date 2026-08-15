import { normalizeControlTime } from '../event/game-end/game-end-point';

/**
 * 10 个指标全部来自 PlayerResource 原生 API，局内展示与结算判定各调一次，没有采集代码。
 * metric 为未知值（老客户端遇到新任务池）时返回 undefined，调用方按未知任务保护处理。
 */
export function ReadTaskMetric(playerId: PlayerID, metric: string): number | undefined {
  switch (metric) {
    case 'kills':
      return PlayerResource.GetKills(playerId);
    case 'assists':
      return PlayerResource.GetAssists(playerId);
    case 'last_hits':
      return PlayerResource.GetLastHits(playerId);
    case 'tower_kills':
      return PlayerResource.GetTowerKills(playerId);
    case 'hero_damage':
      return PlayerResource.GetRawPlayerDamage(playerId);
    case 'healing':
      return PlayerResource.GetHealing(playerId);
    case 'total_gold_earned':
      return readTotalGoldEarned(playerId);
    case 'damage_taken':
      return readDamageTaken(playerId);
    case 'stun_duration':
      return normalizeControlTime(PlayerResource.GetStuns(playerId));
    case 'roshan_kills':
      return PlayerResource.GetRoshanKills(playerId);
    default:
      return undefined;
  }
}

function readDamageTaken(playerId: PlayerID): number {
  let damageTaken = 0;
  for (let victimID = 0; victimID < DOTA_MAX_TEAM_PLAYERS; victimID++) {
    if (
      PlayerResource.IsValidPlayerID(victimID) &&
      PlayerResource.IsValidPlayer(victimID) &&
      PlayerResource.GetSelectedHeroEntity(victimID)
    ) {
      if (PlayerResource.GetTeam(victimID) !== PlayerResource.GetTeam(playerId)) {
        damageTaken += PlayerResource.GetDamageDoneToHero(victimID, playerId);
      }
    }
  }
  return damageTaken;
}

// 与 game-end.ts 同源口径：扣除从虚拟金币库转回的金额
function readTotalGoldEarned(playerId: PlayerID): number {
  const virtualGoldData = CustomNetTables.GetTableValue('player_virtual_gold', playerId.toString());
  const transferredBackTotal = virtualGoldData?.transferred_back_total ?? 0;
  return Math.max(0, PlayerResource.GetTotalEarnedGold(playerId) - transferredBackTotal);
}
