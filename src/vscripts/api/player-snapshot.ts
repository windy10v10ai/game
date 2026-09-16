import { PlayerHelper } from '../modules/helper/player-helper';
import {
  AwakenedHeroDto,
  GamePresetCustomOptions,
  MemberDto,
  MemberLevel,
  Player,
  PlayerInfoDto,
  PlayerProperty,
  PlayerSetting,
} from './player';

/**
 * 离线快照：随地图发布的玩家数据 KV，在服务端不可达时作为只读兜底。
 * 文件由 firebase 仓库的导出脚本生成，不进版本控制，缺失时按「无快照」处理。
 */

const MEMBER_FILE = 'scripts/kv/player_snapshot_member.kv';
const PLAYER_FILE = 'scripts/kv/player_snapshot_player.kv';
const AWAKEN_FILE = 'scripts/kv/player_snapshot_awaken.kv';
const SETTING_FILE = 'scripts/kv/player_snapshot_setting.kv';

type SnapshotRow = Record<string, unknown>;

export class PlayerSnapshot {
  /** 把快照中当前对局玩家的数据合并进玩家数据表 */
  public static Load() {
    const memberRows = PlayerSnapshot.ReadFile(MEMBER_FILE);
    const playerRows = PlayerSnapshot.ReadFile(PLAYER_FILE);
    const awakenRows = PlayerSnapshot.ReadFile(AWAKEN_FILE);
    const settingRows = PlayerSnapshot.ReadFile(SETTING_FILE);

    let member = 0;
    let player = 0;
    let awaken = 0;
    let setting = 0;
    PlayerHelper.ForEachPlayer((playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      const key = steamId.toString();

      const memberRow = memberRows?.get(key);
      if (memberRow) {
        member++;
        Player.MergePlayerInfo({ id: key, member: PlayerSnapshot.ToMember(steamId, memberRow) });
      }
      const playerRow = playerRows?.get(key);
      if (playerRow) {
        player++;
        Player.MergePlayerInfo(PlayerSnapshot.ToPlayerPartial(steamId, playerRow));
      }
      const awakenRow = awakenRows?.get(key);
      if (awakenRow) {
        awaken++;
        Player.MergePlayerInfo({
          id: key,
          awakenedHeroes: PlayerSnapshot.ToAwakenedHeroes(awakenRow),
        });
      }
      const settingRow = settingRows?.get(key);
      if (settingRow) {
        setting++;
        Player.MergePlayerInfo({ id: key, playerSetting: PlayerSnapshot.ToSetting(settingRow) });
      }
    });
    print(
      `[PlayerSnapshot] matched member ${member} player ${player} awaken ${awaken} setting ${setting}`,
    );
  }

  private static ReadFile(path: string): Map<string, SnapshotRow> | undefined {
    const raw = LoadKeyValues(path) as Record<string, SnapshotRow> | undefined;
    if (!raw) {
      print(`[PlayerSnapshot] ${path} not found`);
      return undefined;
    }
    // 引擎对纯数字 key 返回 string 还是 number 不确定，统一成字符串再查表
    const rows = new Map<string, SnapshotRow>();
    for (const steamId in raw) {
      rows.set(tostring(steamId), raw[steamId]);
    }
    return rows;
  }

  private static ToMember(steamId: number, row: SnapshotRow): MemberDto {
    // 快照存的是到期时间戳，有效期在开局时现算，避免导出后过期仍显示有效
    const expireDate = PlayerSnapshot.ToNumber(row.expireDate);
    return {
      steamId,
      level: PlayerSnapshot.ToNumber(row.level) as MemberLevel,
      enable: expireDate > os.time(),
      expireDateString: expireDate > 0 ? (os.date('!%Y-%m-%d', expireDate) as string) : '',
    };
  }

  private static ToPlayerPartial(steamId: number, row: SnapshotRow): Partial<PlayerInfoDto> {
    return {
      id: steamId.toString(),
      seasonPointTotal: PlayerSnapshot.ToNumber(row.seasonPointTotal),
      memberPointTotal: PlayerSnapshot.ToNumber(row.memberPointTotal),
      useableSeasonPoint: PlayerSnapshot.ToNumber(row.useableSeasonPoint),
      useableMemberPoint: PlayerSnapshot.ToNumber(row.useableMemberPoint),
      seasonLevel: PlayerSnapshot.ToNumber(row.seasonLevel),
      memberLevel: PlayerSnapshot.ToNumber(row.memberLevel),
      properties: PlayerSnapshot.ToProperties(steamId, row.properties),
    };
  }

  private static ToProperties(steamId: number, raw: unknown): PlayerProperty[] {
    const properties: PlayerProperty[] = [];
    // 玩家没花过属性点时整个子表不存在
    if (!raw) {
      return properties;
    }
    const levelByName = raw as Record<string, unknown>;
    for (const name in levelByName) {
      properties.push({ steamId, name, level: PlayerSnapshot.ToNumber(levelByName[name]) });
    }
    return properties;
  }

  private static ToAwakenedHeroes(row: SnapshotRow): AwakenedHeroDto[] {
    const heroes: AwakenedHeroDto[] = [];
    // 数字 key 只是 KV 表示数组的占位，取值即可
    for (const index in row) {
      heroes.push({ heroName: tostring(row[index]) });
    }
    return heroes;
  }

  private static ToSetting(row: SnapshotRow): PlayerSetting {
    const setting: PlayerSetting = {
      isRememberAbilityKey: PlayerSnapshot.ToBoolean(row.isRememberAbilityKey),
      activeAbilityKey: PlayerSnapshot.ToText(row.activeAbilityKey),
      passiveAbilityKey: PlayerSnapshot.ToText(row.passiveAbilityKey),
      passiveAbilityKey2: PlayerSnapshot.ToText(row.passiveAbilityKey2),
      activeAbilityQuickCast: PlayerSnapshot.ToBoolean(row.activeAbilityQuickCast),
      passiveAbilityQuickCast: PlayerSnapshot.ToBoolean(row.passiveAbilityQuickCast),
      passiveAbilityQuickCast2: PlayerSnapshot.ToBoolean(row.passiveAbilityQuickCast2),
      wardObserverKey: PlayerSnapshot.ToText(row.wardObserverKey),
      wardObserverQuickCast: PlayerSnapshot.ToBoolean(row.wardObserverQuickCast),
      wardSentryKey: PlayerSnapshot.ToText(row.wardSentryKey),
      wardSentryQuickCast: PlayerSnapshot.ToBoolean(row.wardSentryQuickCast),
      inventorySlot7Key: PlayerSnapshot.ToText(row.inventorySlot7Key),
      inventorySlot7QuickCast: PlayerSnapshot.ToBoolean(row.inventorySlot7QuickCast),
      inventorySlot8Key: PlayerSnapshot.ToText(row.inventorySlot8Key),
      inventorySlot8QuickCast: PlayerSnapshot.ToBoolean(row.inventorySlot8QuickCast),
      inventorySlot9Key: PlayerSnapshot.ToText(row.inventorySlot9Key),
      inventorySlot9QuickCast: PlayerSnapshot.ToBoolean(row.inventorySlot9QuickCast),
    };

    // 槽位存在即「该地图记住了预设」，因此缺省的不能补默认值
    if (row.gamePresetDota !== undefined) {
      setting.gamePresetDota = { difficulty: PlayerSnapshot.ToNumber(row.gamePresetDota) };
    }
    if (row.gamePresetHard !== undefined) {
      setting.gamePresetHard = { difficulty: PlayerSnapshot.ToNumber(row.gamePresetHard) };
    }
    if (row.gamePresetCustom !== undefined) {
      setting.gamePresetCustom = {
        gameOptions: PlayerSnapshot.ToCustomOptions(row.gamePresetCustom as SnapshotRow),
      };
    }
    return setting;
  }

  private static ToCustomOptions(row: SnapshotRow): GamePresetCustomOptions {
    return {
      multiplierRadiant: PlayerSnapshot.ToNumber(row.multiplierRadiant),
      multiplierDire: PlayerSnapshot.ToNumber(row.multiplierDire),
      playerNumberRadiant: PlayerSnapshot.ToNumber(row.playerNumberRadiant),
      playerNumberDire: PlayerSnapshot.ToNumber(row.playerNumberDire),
      towerPowerPct: PlayerSnapshot.ToNumber(row.towerPowerPct),
      respawnTimePct: PlayerSnapshot.ToNumber(row.respawnTimePct),
      startingGoldPlayer: PlayerSnapshot.ToNumber(row.startingGoldPlayer),
      startingGoldBot: PlayerSnapshot.ToNumber(row.startingGoldBot),
      maxLevel: PlayerSnapshot.ToNumber(row.maxLevel),
      fixedAbility: PlayerSnapshot.ToText(row.fixedAbility),
      forceRandomHero: PlayerSnapshot.ToNumber(row.forceRandomHero),
      enablePlayerAttribute: PlayerSnapshot.ToNumber(row.enablePlayerAttribute),
      midOnlyMode: PlayerSnapshot.ToNumber(row.midOnlyMode),
    };
  }

  private static ToNumber(raw: unknown): number {
    return tonumber(tostring(raw)) ?? 0;
  }

  // 布尔只在为真时导出，缺省即 false
  private static ToBoolean(raw: unknown): boolean {
    return PlayerSnapshot.ToNumber(raw) === 1;
  }

  // 字符串只在非默认时导出，缺省即空串
  private static ToText(raw: unknown): string {
    return raw === undefined ? '' : tostring(raw);
  }
}
