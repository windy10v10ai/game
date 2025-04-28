import { Player } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';
import { GameConfig } from '../GameConfig';
import { BotPower } from '../helper/bot-power';
import { PlayerHelper } from '../helper/player-helper';

@reloadable
export class EventPlayerLevelUp {
  constructor() {
    ListenToGameEvent('dota_player_gained_level', (keys) => this.OnPlayerLevelUp(keys), this);
  }

  OnPlayerLevelUp(keys: GameEventProvidedProperties & DotaPlayerGainedLevelEvent): void {
    const hero = EntIndexToHScript(keys.hero_entindex) as CDOTA_BaseNPC_Hero | undefined;
    if (!hero) {
      print(`[Event] ERROR: OnPlayerLevelUp hero is undefined`);
      return;
    }

    this.UpdatePlayerAndBot(hero);
    this.SetDeathXP(hero, keys.level);
  }

  /**
   * 更新玩家属性/升级机器人技能
   * @param hero 英雄实体
   */
  private UpdatePlayerAndBot(hero: CDOTA_BaseNPC_Hero): void {
    if (PlayerHelper.IsHumanPlayer(hero)) {
      print(`[Event] OnPlayerLevelUp SetPlayerProperty ${hero.GetUnitName()}`);
      Player.SetPlayerProperty(hero);
    }
    if (PlayerHelper.IsBotPlayer(hero)) {
      BotPower.LevelUpBotPower(hero);
    }
  }

  /**
   * 设置死亡经验值
   * 根据英雄等级设置不同的经验值计算公式
   * @param hero 英雄实体
   * @param level 当前等级
   */
  private SetDeathXP(hero: CDOTA_BaseNPC_Hero, level: number): void {
    Timers.CreateTimer(0.5, () => {
      if (hero.IsNull()) {
        return;
      }
      if (level <= GameConfig.LEVEL_THRESHOLD) {
        // 低等级经验值 = 基础值 + 当前经验值 * 系数
        hero.SetCustomDeathXP(
          GameConfig.LOW_LEVEL_BASE_XP + hero.GetCurrentXP() * GameConfig.LOW_LEVEL_XP_FACTOR,
        );
      } else {
        // 高等级经验值 = 基础值 + 当前经验值 * 系数
        hero.SetCustomDeathXP(
          GameConfig.HIGH_LEVEL_BASE_XP + hero.GetCurrentXP() * GameConfig.HIGH_LEVEL_XP_FACTOR,
        );
      }
    });
  }
}
