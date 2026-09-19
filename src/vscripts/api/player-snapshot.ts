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
const META_FILE = 'scripts/kv/player_snapshot_meta.kv';

type SnapshotRow = Record<string, unknown>;

export class PlayerSnapshot {
  /** 把快照中当前对局玩家的数据合并进玩家数据表，返回快照导出日期，无快照时为空串 */
  public static Load(): string {
    const memberRows = PlayerSnapshot.ReadFile(MEMBER_FILE);
    const playerRows = PlayerSnapshot.ReadFile(PLAYER_FILE);
    const awakenRows = PlayerSnapshot.ReadFile(AWAKEN_FILE);
    const settingRows = PlayerSnapshot.ReadFile(SETTING_FILE);

    const today = PlayerSnapshot.Today();
    print(`[PlayerSnapshot] system date "${GetSystemDate()}" parsed as ${today}`);

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
        Player.MergePlayerInfo({
          id: key,
          member: PlayerSnapshot.ToMember(steamId, memberRow, today),
        });
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
    return PlayerSnapshot.ReadExportedDate();
  }

  private static ReadExportedDate(): string {
    const meta = LoadKeyValues(META_FILE) as SnapshotRow | undefined;
    const exportedAt = PlayerSnapshot.ToNumber(meta?.exportedAt);
    return exportedAt > 0
      ? PlayerSnapshot.FormatDay(PlayerSnapshot.DayFromTimestamp(exportedAt))
      : '';
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

  private static ToMember(steamId: number, row: SnapshotRow, today: number): MemberDto {
    // 快照存的是到期时间戳，有效期在开局时现算，避免导出后过期仍显示有效
    const expireDate = PlayerSnapshot.ToNumber(row.expireDate);
    const expireDay = expireDate > 0 ? PlayerSnapshot.DayFromTimestamp(expireDate) : 0;
    return {
      steamId,
      level: PlayerSnapshot.ToNumber(row.level) as MemberLevel,
      enable: expireDay > today,
      expireDateString: expireDay > 0 ? PlayerSnapshot.FormatDay(expireDay) : '',
    };
  }

  /**
   * 把 unix 时间戳换算成 UTC 的 `年*10000 + 月*100 + 日`，该形式可直接比较大小。
   * Dota 的 Lua 沙箱没有 os 表，日历换算只能自己做（Howard Hinnant 的 civil_from_days）。
   */
  private static DayFromTimestamp(unixSeconds: number): number {
    const shifted = Math.floor(unixSeconds / 86400) + 719468;
    const era = Math.floor(shifted / 146097);
    const dayOfEra = shifted - era * 146097;
    const yearOfEra = Math.floor(
      (dayOfEra -
        Math.floor(dayOfEra / 1460) +
        Math.floor(dayOfEra / 36524) -
        Math.floor(dayOfEra / 146096)) /
        365,
    );
    const dayOfYear =
      dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
    // 以 3 月为起点编号，闰日落在年末，换算才不用分闰年讨论
    const monthIndex = Math.floor((5 * dayOfYear + 2) / 153);
    const day = dayOfYear - Math.floor((153 * monthIndex + 2) / 5) + 1;
    const month = monthIndex < 10 ? monthIndex + 3 : monthIndex - 9;
    const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
    return year * 10000 + month * 100 + day;
  }

  private static FormatDay(day: number): string {
    const year = Math.floor(day / 10000);
    const month = Math.floor(day / 100) % 100;
    const dayOfMonth = day % 100;
    return `${year}-${PlayerSnapshot.Pad2(month)}-${PlayerSnapshot.Pad2(dayOfMonth)}`;
  }

  private static Pad2(value: number): string {
    return value < 10 ? `0${value}` : tostring(value);
  }

  /**
   * 今天的日期，与 DayFromTimestamp 同一种可比较形式。
   * 引擎返回 MM/DD/YY，中文系统下同样如此，与系统区域设置无关。
   */
  private static Today(): number {
    const raw = GetSystemDate();
    const parts = PlayerSnapshot.ExtractNumbers(raw);
    if (parts.length < 3) {
      print(`[PlayerSnapshot] unrecognized system date "${raw}", member expiry not checked`);
      return 0;
    }
    const [month, day, shortYear] = parts;
    const year = shortYear < 100 ? 2000 + shortYear : shortYear;
    return year * 10000 + month * 100 + day;
  }

  private static ExtractNumbers(text: string): number[] {
    const numbers: number[] = [];
    let current = '';
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (char >= '0' && char <= '9') {
        current += char;
      } else if (current !== '') {
        numbers.push(tonumber(current) ?? 0);
        current = '';
      }
    }
    if (current !== '') {
      numbers.push(tonumber(current) ?? 0);
    }
    return numbers;
  }

  private static ToPlayerPartial(steamId: number, row: SnapshotRow): Partial<PlayerInfoDto> {
    const seasonLevel = PlayerSnapshot.ToNumber(row.seasonLevel);
    const memberLevel = PlayerSnapshot.ToNumber(row.memberLevel);
    const properties = PlayerSnapshot.ToProperties(row.properties);
    // 属性点只是等级与加点的加减，游戏侧现算可省去导出；等级本身涉及档位公式，仍以导出值为准
    const totalLevel = seasonLevel + memberLevel;
    const usedLevel = properties.reduce((sum, property) => sum + property.level, 0);
    return {
      id: steamId.toString(),
      seasonPointTotal: PlayerSnapshot.ToNumber(row.seasonPointTotal),
      memberPointTotal: PlayerSnapshot.ToNumber(row.memberPointTotal),
      useableSeasonPoint: PlayerSnapshot.ToNumber(row.useableSeasonPoint),
      useableMemberPoint: PlayerSnapshot.ToNumber(row.useableMemberPoint),
      seasonLevel,
      memberLevel,
      totalLevel,
      useableLevel: Math.max(0, totalLevel - usedLevel),
      properties,
    };
  }

  private static ToProperties(raw: unknown): PlayerProperty[] {
    const properties: PlayerProperty[] = [];
    // 玩家没花过属性点时整个子表不存在
    if (!raw) {
      return properties;
    }
    const levelByName = raw as Record<string, unknown>;
    for (const name in levelByName) {
      properties.push({ name, level: PlayerSnapshot.ToNumber(levelByName[name]) });
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
