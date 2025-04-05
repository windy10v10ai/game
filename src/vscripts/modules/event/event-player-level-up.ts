import { Player } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';
import { BotPower } from '../helper/bot-power';
import { PlayerHelper } from '../helper/player-helper';

@reloadable
export class EventPlayerLevelUp {
  /** 低等级经验系数 */
  private static readonly LOW_LEVEL_XP_FACTOR = 0.075;
  /** 高等级经验系数 */
  private static readonly HIGH_LEVEL_XP_FACTOR = 0.03;
  /** 低等级基础经验值 */
  private static readonly LOW_LEVEL_BASE_XP = 60;
  /** 高等级基础经验值 */
  private static readonly HIGH_LEVEL_BASE_XP = 3000;
  /** 等级阈值，用于区分高低等级 */
  private static readonly LEVEL_THRESHOLD = 30;

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
      if (level <= EventPlayerLevelUp.LEVEL_THRESHOLD) {
        // 低等级经验值 = 基础值 + 当前经验值 * 系数
        hero.SetCustomDeathXP(
          EventPlayerLevelUp.LOW_LEVEL_BASE_XP +
            hero.GetCurrentXP() * EventPlayerLevelUp.LOW_LEVEL_XP_FACTOR,
        );
      } else {
        // 高等级经验值 = 基础值 + 当前经验值 * 系数
        hero.SetCustomDeathXP(
          EventPlayerLevelUp.HIGH_LEVEL_BASE_XP +
            hero.GetCurrentXP() * EventPlayerLevelUp.HIGH_LEVEL_XP_FACTOR,
        );
      }
    });
  }
}
