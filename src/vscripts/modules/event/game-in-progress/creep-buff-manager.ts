import { reloadable } from '../../../utils/tstl-utils';
import { TowerPushStatus } from '../event-entity-killed';

/**
 * 小兵buff管理器
 * 负责给刷新的小兵添加buff
 */
@reloadable
export class CreepBuffManager {
  private currentBuffLevels = {
    buffLevelGood: 0,
    buffLevelBad: 0,
  };

  private laneGoldMultiplier = 1;

  constructor() {
    ListenToGameEvent('npc_spawned', (keys) => this.onNPCSpawned(keys), this);

    Timers.CreateTimer(2, () => {
      this.refreshBuffLevels();
      return 10; // 每10秒刷新一次
    });
  }

  private refreshBuffLevels(): void {
    this.currentBuffLevels = this.calculateCreepBuffLevels();
    this.laneGoldMultiplier = this.calculateLaneGoldMultiplier();
  }

  private onNPCSpawned(keys: GameEventProvidedProperties & NpcSpawnedEvent): void {
    if (GameRules.State_Get() < GameState.PRE_GAME) {
      Timers.CreateTimer(1, () => {
        this.onNPCSpawned(keys);
      });
      return;
    }

    const entity = EntIndexToHScript(keys.entindex) as CDOTA_BaseNPC | undefined;
    if (!entity || entity.IsNull()) {
      return;
    }

    const name = entity.GetName();
    // 检查是否为小兵或攻城单位
    if (name === 'npc_dota_creep_lane' || name === 'npc_dota_creep_siege') {
      this.applyCreepBuff(entity);
    }
  }

  private applyCreepBuff(creep: CDOTA_BaseNPC): void {
    const unitName = creep.GetUnitName();
    const team = creep.GetTeamNumber();

    let buffLevel = 0;

    if (team === DotaTeam.GOODGUYS) {
      buffLevel = this.currentBuffLevels.buffLevelGood;
    } else if (team === DotaTeam.BADGUYS) {
      buffLevel = this.currentBuffLevels.buffLevelBad;
    }

    // 随时间增加金钱
    const originMaxGold = creep.GetMaximumGoldBounty();
    const originMinGold = creep.GetMinimumGoldBounty();
    const modifiedMaxGold = originMaxGold * this.laneGoldMultiplier;
    const modifiedMinGold = originMinGold * this.laneGoldMultiplier;
    creep.SetMaximumGoldBounty(modifiedMaxGold);
    creep.SetMinimumGoldBounty(modifiedMinGold);

    // 设置小兵基础血量
    const baseMaxHealth = this.calculateCreepBaseMaxHealth(creep, buffLevel);
    creep.SetBaseMaxHealth(baseMaxHealth);

    // 添加小兵buff
    if (buffLevel > 0) {
      if (unitName.indexOf('upgraded') === -1 && unitName.indexOf('mega') === -1) {
        const ability = creep.AddAbility('creep_buff');
        if (ability !== undefined) {
          ability.SetLevel(buffLevel);
        }
        return;
      } else if (unitName.indexOf('upgraded') !== -1 && unitName.indexOf('mega') === -1) {
        // upgrade creep
        const ability = creep.AddAbility('creep_buff_upgraded');
        if (ability !== undefined) {
          ability.SetLevel(buffLevel);
        }
        return;
      } else if (unitName.indexOf('mega') !== -1) {
        // mega creep
        const ability = creep.AddAbility('creep_buff_mega');
        if (ability !== undefined) {
          ability.SetLevel(buffLevel);
        }
        return;
      }
    }
  }

  /**
   * 小兵金钱随时间增加
   */
  private calculateLaneGoldMultiplier(): number {
    const time = GameRules.GetDOTATime(false, false);
    let mul = 1;
    if (time <= 15 * 60) {
      mul = 1;
    } else {
      mul = Math.floor(time / 900);
    }
    // 60分钟封顶
    mul = Math.min(mul, 4);
    return mul;
  }

  /**
   * 计算小兵buff等级
   */
  private calculateCreepBuffLevels(): {
    buffLevelGood: number;
    buffLevelBad: number;
  } {
    // 添加基础buff等级
    // 根据防御塔等级增加buff
    let baseCreepBuffLevel = this.getCreepBuffByTowerPower();
    // 根据游戏时间增加buff
    baseCreepBuffLevel += this.getCreepBuffByGameTime();

    let buffLevelGood = baseCreepBuffLevel;
    let buffLevelBad = baseCreepBuffLevel;

    // 根据2塔摧毁情况增加buff
    if (TowerPushStatus.tower2PushedGood === 1) {
      buffLevelGood += 1;
    } else if (TowerPushStatus.tower2PushedGood > 1) {
      buffLevelGood += 2;
    }
    if (TowerPushStatus.tower2PushedBad === 1) {
      buffLevelBad += 1;
    } else if (TowerPushStatus.tower2PushedBad > 1) {
      buffLevelBad += 2;
    }

    // 根据3塔摧毁情况增加buff
    if (TowerPushStatus.tower3PushedGood === 1) {
      buffLevelGood += 1;
    } else if (TowerPushStatus.tower3PushedGood > 1) {
      buffLevelGood += 2;
    }
    if (TowerPushStatus.tower3PushedBad === 1) {
      buffLevelBad += 1;
    } else if (TowerPushStatus.tower3PushedBad > 1) {
      buffLevelBad += 2;
    }

    // 根据4塔摧毁情况增加buff和超级小兵buff
    if (TowerPushStatus.tower4PushedGood === 1) {
      buffLevelGood += 1;
    } else if (TowerPushStatus.tower4PushedGood > 1) {
      buffLevelGood += 2;
    }
    if (TowerPushStatus.tower4PushedBad === 1) {
      buffLevelBad += 1;
    } else if (TowerPushStatus.tower4PushedBad > 1) {
      buffLevelBad += 2;
    }

    // 未推掉任何塔时，不设置小兵buff
    if (TowerPushStatus.tower1PushedGood === 0) {
      buffLevelGood = 0;
    }
    if (TowerPushStatus.tower1PushedBad === 0) {
      buffLevelBad = 0;
    }

    // 限制最大值为8
    buffLevelGood = Math.min(buffLevelGood, 8);
    buffLevelBad = Math.min(buffLevelBad, 8);

    return {
      buffLevelGood,
      buffLevelBad,
    };
  }

  /**
   * 计算小兵baseMaxHealth
   */
  private calculateCreepBaseMaxHealth(creep: CDOTA_BaseNPC, buffLevel: number): number {
    let baseMaxHealth = creep.GetBaseMaxHealth();

    if (buffLevel > 0) {
      // 额外百分比血量
      baseMaxHealth += baseMaxHealth * (0.1 * buffLevel);
      // 基础数值
      baseMaxHealth += 100 * buffLevel;
    }
    return baseMaxHealth;
  }

  private getCreepBuffByTowerPower(): number {
    // 前5分钟不计算防御塔buff等级
    const gameTime = GameRules.GetDOTATime(false, false);
    if (gameTime <= 5 * 60) {
      return 0;
    }
    const sumTowerPower = GameRules.Option.towerPower;
    if (sumTowerPower <= 150) {
      return 0;
    } else if (sumTowerPower <= 300) {
      return 1;
    } else if (sumTowerPower <= 400) {
      return 2; // 250%
    } else {
      return 3;
    }
  }

  private getCreepBuffByGameTime(): number {
    const gameTime = GameRules.GetDOTATime(false, false);
    if (gameTime <= 10 * 60) {
      return 0;
    } else if (gameTime <= 15 * 60) {
      return 1;
    } else if (gameTime <= 20 * 60) {
      return 2;
    } else if (gameTime <= 25 * 60) {
      return 3;
    } else if (gameTime <= 30 * 60) {
      return 4;
    } else if (gameTime <= 35 * 60) {
      return 5;
    } else {
      return 6;
    }
  }
}
