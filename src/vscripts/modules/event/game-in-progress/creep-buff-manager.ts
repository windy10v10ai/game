import { TowerPushStatus } from '../event-entity-killed';

/**
 * 小兵buff管理器
 * 负责给刷新的小兵添加buff
 */
export class CreepBuffManager {
  private currentBuffLevels = {
    buffLevelGood: 0,
    buffLevelBad: 0,
    buffLevelMegaGood: 0,
    buffLevelMegaBad: 0,
  };

  constructor() {
    ListenToGameEvent('npc_spawned', (keys) => this.onNPCSpawned(keys), this);

    Timers.CreateTimer(2, () => {
      this.refreshBuffLevels();
      return 10; // 每10秒刷新一次
    });
  }

  private refreshBuffLevels(): void {
    const gameTime = GameRules.GetDOTATime(false, false);
    this.currentBuffLevels = this.calculateCreepBuffLevels(gameTime);
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
    let buffLevelMega = 0;

    if (team === DotaTeam.GOODGUYS) {
      buffLevel = this.currentBuffLevels.buffLevelGood;
      buffLevelMega = this.currentBuffLevels.buffLevelMegaGood;
    } else if (team === DotaTeam.BADGUYS) {
      buffLevel = this.currentBuffLevels.buffLevelBad;
      buffLevelMega = this.currentBuffLevels.buffLevelMegaBad;
    }

    // 随时间增加金钱
    const originMaxGold = creep.GetMaximumGoldBounty();
    const originMinGold = creep.GetMinimumGoldBounty();
    const mul = this.getLaneGoldMultiplier();
    const modifiedMaxGold = originMaxGold * mul;
    const modifiedMinGold = originMinGold * mul;
    creep.SetMaximumGoldBounty(modifiedMaxGold);
    creep.SetMinimumGoldBounty(modifiedMinGold);

    // 普通小兵buff
    if (buffLevel > 0) {
      if (unitName.indexOf('upgraded') === -1 && unitName.indexOf('mega') === -1) {
        const ability = creep.AddAbility('creep_buff');
        if (ability !== undefined) {
          ability.SetLevel(buffLevel);
        }
        return;
      }
    }

    // 超级小兵buff
    if (buffLevelMega > 0) {
      if (unitName.indexOf('upgraded') !== -1 && unitName.indexOf('mega') === -1) {
        // upgrade creep
        const ability = creep.AddAbility('creep_buff_upgraded');
        if (ability !== undefined) {
          ability.SetLevel(buffLevelMega);
        }
        return;
      } else if (unitName.indexOf('mega') !== -1) {
        // mega creep
        const ability = creep.AddAbility('creep_buff_mega');
        if (ability !== undefined) {
          ability.SetLevel(buffLevelMega);
        }
        return;
      }
    }
  }

  /**
   * 小兵金钱随时间增加
   */
  private getLaneGoldMultiplier(): number {
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

  private calculateBaseCreepBuffLevel(sumTowerPower: number): number {
    if (sumTowerPower <= 5) {
      return 0; // 150%
    } else if (sumTowerPower <= 7) {
      return 1; // 200%
    } else if (sumTowerPower <= 8) {
      return 2; // 250%
    } else if (sumTowerPower <= 9) {
      return 3; // 300%
    } else {
      return 4; // 500%
    }
  }

  /**
   * 计算小兵buff等级
   */
  private calculateCreepBuffLevels(gameTime: number): {
    buffLevelGood: number;
    buffLevelBad: number;
    buffLevelMegaGood: number;
    buffLevelMegaBad: number;
  } {
    let buffLevelGood = 0;
    let buffLevelBad = 0;
    let buffLevelMegaGood = 0;
    let buffLevelMegaBad = 0;

    // 根据3塔摧毁情况增加buff
    if (TowerPushStatus.tower3PushedGood === 1) {
      buffLevelGood += 1;
    } else if (TowerPushStatus.tower3PushedGood > 1) {
      buffLevelGood += 3;
    }
    if (TowerPushStatus.tower3PushedBad === 1) {
      buffLevelBad += 1;
    } else if (TowerPushStatus.tower3PushedBad > 1) {
      buffLevelBad += 3;
    }

    // 根据4塔摧毁情况增加buff和超级小兵buff
    if (TowerPushStatus.tower4PushedGood > 1) {
      buffLevelGood += 2;
      buffLevelMegaGood += 1;
    }
    if (TowerPushStatus.tower4PushedBad > 1) {
      buffLevelBad += 2;
      buffLevelMegaBad += 1;
    }

    // 添加基础buff等级
    const baseCreepBuffLevel = this.calculateBaseCreepBuffLevel(GameRules.Option.towerPower);
    buffLevelMegaGood += baseCreepBuffLevel;
    buffLevelMegaBad += baseCreepBuffLevel;

    // 根据游戏时间增加buff
    if (gameTime >= 45 * 60) {
      buffLevelGood += 5;
      buffLevelBad += 5;
      buffLevelMegaGood += 5;
      buffLevelMegaBad += 5;
    } else if (gameTime >= 40 * 60) {
      buffLevelGood += 4;
      buffLevelBad += 4;
      buffLevelMegaGood += 4;
      buffLevelMegaBad += 4;
    } else if (gameTime >= 35 * 60) {
      buffLevelGood += 3;
      buffLevelBad += 3;
      buffLevelMegaGood += 3;
      buffLevelMegaBad += 3;
    } else if (gameTime >= 30 * 60) {
      buffLevelGood += 2;
      buffLevelBad += 2;
      buffLevelMegaGood += 2;
      buffLevelMegaBad += 2;
    } else if (gameTime >= 25 * 60) {
      buffLevelGood += 1;
      buffLevelBad += 1;
      buffLevelMegaGood += 1;
      buffLevelMegaBad += 1;
    } else if (gameTime >= 20 * 60) {
      buffLevelGood += 1;
      buffLevelBad += 1;
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
    buffLevelMegaGood = Math.min(buffLevelMegaGood, 8);
    buffLevelMegaBad = Math.min(buffLevelMegaBad, 8);

    return {
      buffLevelGood,
      buffLevelBad,
      buffLevelMegaGood,
      buffLevelMegaBad,
    };
  }
}
