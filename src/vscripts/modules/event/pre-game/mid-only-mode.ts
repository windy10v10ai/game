import { Analytics } from '../../../api/analytics/analytics';
import { PlayerHelper } from '../../helper/player-helper';

/**
 * 中路乱斗模式
 * PRE_GAME 阶段：移除上下路防御塔和兵营，并广播提示消息
 */
export class MidOnlyMode {
  static Apply(): void {
    print(`[MidOnlyMode] Apply`);
    this.removeTopBotBuildings();
    this.sendMessage();
  }

  /**
   * 移除上路和下路的防御塔与兵营
   */
  private static removeTopBotBuildings(): void {
    const towers = Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[];
    for (const tower of towers) {
      const unitName = tower.GetUnitName();
      if (unitName.includes('top') || unitName.includes('bot')) {
        tower.ForceKill(false);
      }
    }

    const barracks = Entities.FindAllByClassname('npc_dota_barracks') as CDOTA_BaseNPC[];
    for (const barrack of barracks) {
      const unitName = barrack.GetUnitName();
      if (unitName.includes('top') || unitName.includes('bot')) {
        barrack.ForceKill(false);
      }
    }
  }

  /**
   * 遍历所有玩家语言，中文玩家存在时发送一次中文，非中文玩家存在时发送一次英文
   */
  private static sendMessage(): void {
    const msgChinese =
      "<font color='#FFD700'>中路乱斗模式已启用：仅保留中路，小兵金钱经验更多</font>";
    const msgEnglish =
      "<font color='#FFD700'>Mid Only Mode enabled: only mid lane remains, creep gold/XP increased</font>";

    let hasChinese = false;
    let hasNonChinese = false;

    PlayerHelper.ForEachPlayer((playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      const playerLang = Analytics.PLAYER_LANGUAGES.players.find((p) => p.steamId === steamId);
      if (!playerLang) return;
      if (playerLang.language === 'schinese' || playerLang.language === 'tchinese') {
        hasChinese = true;
      } else {
        hasNonChinese = true;
      }
    });

    if (hasChinese) {
      GameRules.SendCustomMessage(msgChinese, 0, 0);
    }
    if (hasNonChinese) {
      GameRules.SendCustomMessage(msgEnglish, 0, 0);
    }
  }
}
