import { PlayerHelper } from '../helper/player-helper';

/** 读取玩家当前某项任务指标的数值，用于候选展示和结算判定，都是实时读取当前数据 */
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
      return PlayerHelper.GetTotalGoldEarned(playerId);
    case 'damage_taken':
      return PlayerHelper.GetDamageTaken(playerId);
    case 'stun_duration':
      return PlayerHelper.GetStuns(playerId);
    case 'roshan_kills': {
      const team = PlayerResource.GetTeam(playerId);
      let kills = 0;
      PlayerHelper.ForEachPlayer((teammateId) => {
        if (PlayerResource.GetTeam(teammateId) === team) {
          kills += PlayerResource.GetRoshanKills(teammateId);
        }
      });
      return kills;
    }
    default:
      // 无法识别的指标（老客户端遇到新任务池）返回 undefined，交给调用方做未知任务保护
      return undefined;
  }
}
