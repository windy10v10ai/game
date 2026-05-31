export enum MemberLevel {
  NORMAL = 1,
  PREMIUM = 2,
}
export class MemberDto {
  steamId!: number;
  enable!: boolean;
  expireDateString!: string;
  level!: MemberLevel;
}

export class PlayerProperty {
  steamId!: number;
  name!: string;
  level!: number;
}
export class PlayerSetting {
  isRememberAbilityKey: boolean;
  activeAbilityKey: string;
  passiveAbilityKey: string;
  passiveAbilityKey2?: string;
  activeAbilityQuickCast: boolean;
  passiveAbilityQuickCast: boolean;
  passiveAbilityQuickCast2?: boolean;
}

export class PlayerInfoDto {
  id!: string;
  matchCount!: number;
  winCount!: number;
  disconnectCount!: number;
  conductPoint!: number;
  commendCount!: number;
  reportCount!: number;

  seasonPointTotal!: number;
  seasonLevel!: number;
  seasonNextLevelPoint!: number;
  useableSeasonPoint!: number;

  memberPointTotal!: number;
  memberLevel!: number;
  memberNextLevelPoint!: number;
  useableMemberPoint!: number;

  totalLevel!: number;
  useableLevel!: number;

  // partial 响应可能不带，按 endpoint 不同可缺失
  properties?: PlayerProperty[];
  playerSetting?: PlayerSetting;
  member?: MemberDto;
}

// Backward-compatible alias for existing imports.
export type PlayerDto = PlayerInfoDto;
export const PlayerDto = PlayerInfoDto;

export class PointInfoDto {
  steamId!: number;
  title!: {
    cn: string;
    en: string;
  };

  seasonPoint?: number;
  memberPoint?: number;
}

/**
 * Player 数据层：只负责 PlayerInfoDto 的存储、合并写入、以及只读 getter。
 * Property / Setting 相关的事件监听与 API 调用拆到 player-property.ts / player-setting.ts。
 */
export class Player {
  // 单一数据源：steamId -> PlayerInfoDto，会员、属性、setting 全部嵌套于此。
  public static playerInfoMap: Map<string, PlayerInfoDto> = new Map();
  public static playerCount = 0;

  public static GetPlayerCount(): number {
    return Player.playerCount;
  }

  /**
   * 字段级浅 merge：
   * - partial 中未出现的 key 保留 existing 的值（不同 endpoint 字段集合不同时不会被清空）
   * - partial 中出现的 key（包括空数组 []、null）覆盖 existing
   * 例：reset 回包 properties:[] 会清空属性；levelup 不带 member 会保留 member。
   * 所有写入只走此入口，class map 与 net table 通过同一份 merged 数据保证一致。
   */
  public static MergePlayerInfo(partial: Partial<PlayerInfoDto>) {
    if (!partial.id) {
      print('[Player] MergePlayerInfo: missing id, skipped');
      return;
    }
    const id = partial.id;
    // fallback 占位仅在 game/start 之前的异常调用路径出现；正常路径首次写入即为完整 PlayerInfoDto
    const existing = Player.playerInfoMap.get(id) ?? ({ id } as PlayerInfoDto);
    const merged: PlayerInfoDto = { ...existing, ...partial };
    Player.playerInfoMap.set(id, merged);
    CustomNetTables.SetTableValue('player_table', id, merged);
  }

  public static IsMemberStatic(steamId: number) {
    const player = Player.playerInfoMap.get(steamId.toString());
    return player?.member?.enable ?? false;
  }

  public static GetMemberLevel(steamId: number) {
    const player = Player.playerInfoMap.get(steamId.toString());
    if (!player?.member?.enable) {
      return 0;
    }
    return player.member.level;
  }

  public static GetSeasonLevel(steamId: number) {
    const player = Player.playerInfoMap.get(steamId.toString());
    return player?.seasonLevel ?? 0;
  }
}
