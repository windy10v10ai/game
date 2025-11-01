import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { reloadable } from '../../../utils/tstl-utils';
import { Option } from '../../option';

@reloadable
export class GameEndPoint {
  static CalculatePlayerScore(player: GameEndPlayerDto): number {
    const killScore = Math.sqrt(player.kills) * 1.5;
    const deathScore = -Math.sqrt(player.deaths) * 0.6;
    const assistScore = Math.sqrt(player.assists) * 1.5;
    const damageScore = Math.min(40, Math.sqrt(player.damage) / 200);
    const damageTakenScore = Math.min(40, Math.sqrt(player.damageTaken) / 100);
    const healingScore = Math.min(40, Math.sqrt(player.healing) / 50);
    const towerKillScore = Math.sqrt(player.towerKills) * 3.5;

    const totalScore =
      killScore +
      deathScore +
      assistScore +
      damageScore +
      damageTakenScore +
      healingScore +
      towerKillScore;

    return Math.round(totalScore);
  }

  static GetParticipationRateMultiplier(player: GameEndPlayerDto, teamKills: number): number {
    if (teamKills <= 0) {
      return 1;
    }

    // 计算总战斗参与次数（击杀+助攻）
    const totalEngagements = player.kills + player.assists;

    // 计算参战率
    const participationRate = totalEngagements / teamKills;

    // 如果参战率低于0.05（5%），获得0分
    if (participationRate < 0.05) {
      return 0;
    }
    // 参战率低于0.1（10%），获得一半时间分
    if (participationRate < 0.1) {
      return 0.5;
    }

    // 参战率高于0.1（10%），获得完整时间分
    return 1;
  }

  static GetGameTimePoints(gameTime: number): number {
    const min = gameTime / 60;
    const points = Math.sqrt(min) * 3;
    return Math.round(points);
  }

  static GetDifficultyMultiplier(difficulty: number, isLocalhost: boolean, option: Option): number {
    // 如果是作弊模式，不计算倍率。开发模式无视这条
    if (!IsInToolsMode()) {
      if (GameRules.IsCheatMode() || isLocalhost) {
        return 0;
      }
    }

    switch (difficulty) {
      case 1:
        return 1.2;
      case 2:
        return 1.4;
      case 3:
        return 1.6;
      case 4:
        return 1.8;
      case 5:
        return 2;
      case 6:
        return 2.2;
      default:
        // 自定义模式
        return this.GetCustomModeMultiplier(option);
    }
  }

  public static GetCustomModeMultiplier(option: Option): number {
    let multiplier = 1;
    // 基础倍率
    if (option.radiantGoldXpMultiplier >= 5) {
      multiplier *= 0.2;
    } else if (option.radiantGoldXpMultiplier >= 2) {
      multiplier *= 0.5;
    } else if (option.radiantGoldXpMultiplier < 1.3) {
      multiplier *= 1.1;
    }

    if (option.direGoldXpMultiplier >= 40) {
      multiplier *= 2.4;
    } else if (option.direGoldXpMultiplier === 30) {
      multiplier *= 2.3;
    } else if (option.direGoldXpMultiplier === 20) {
      multiplier *= 2.2;
    } else if (option.direGoldXpMultiplier === 17) {
      multiplier *= 2.1;
    } else if (option.direGoldXpMultiplier === 14) {
      multiplier *= 2.0;
    } else if (option.direGoldXpMultiplier === 12) {
      multiplier *= 1.95;
    } else if (option.direGoldXpMultiplier === 10) {
      multiplier *= 1.9;
    } else if (option.direGoldXpMultiplier >= 5) {
      multiplier *= 1.5;
    }

    // 禁用玩家属性
    if (!option.enablePlayerAttribute) {
      multiplier += 0.2;
    }
    // 相同英雄选择 -- 实际上目前是全英雄随机
    if (option.sameHeroSelection) {
      multiplier += 0.2;
    }
    // 防御塔倍率
    if (option.towerPower <= 150) {
      multiplier -= 0.1;
    } else if (option.towerPower >= 600) {
      multiplier -= 0.1;
    }

    // 倍率大于1时，玩家金钱高于等于5000时，倍率加-0.1
    if (multiplier > 1.5) {
      if (option.startingGoldPlayer >= 5000) {
        multiplier -= 0.1;
      }
      if (option.startingGoldBot <= 1000) {
        multiplier -= 0.1;
      }
    }

    // 固定技能时，降低倍率
    if (option.fixedAbility !== 'none') {
      multiplier -= 0.2;
    }

    // 勾选额外技能时，降低倍率
    if (option.extraPassiveAbilities) {
      multiplier -= 0.2;
    }

    // 电脑玩家数量
    multiplier *= option.direPlayerNumber / 10;
    // 复活时间
    if (option.respawnTimePercentage <= 10) {
      multiplier *= 0.6;
    }

    // 不为负数
    if (multiplier < 0) {
      multiplier = 0;
    }
    // 保留小数点1位
    return Math.round(multiplier * 10) / 10;
  }
}
