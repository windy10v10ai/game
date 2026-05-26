import { PlayerInfoDto } from '../../../../vscripts/api/player';

/**
 * 会员等级（保持与 src/vscripts/api/player.ts MemberLevel 一致）。
 * 复制一份是为了不让前端 shared util 反向引用 vscripts 的 enum 运行时（const enum 跨包不可靠）。
 */
export const enum MemberLevel {
  NORMAL = 1,
  PREMIUM = 2,
}

/** 是否启用了任意级别会员（普通或高级）。 */
export function isMemberActive(player: PlayerInfoDto | null | undefined): boolean {
  return Boolean(player?.member?.enable);
}

/** 是否高级会员（PREMIUM）。普通会员和未开通都返回 false。 */
export function isPremiumMember(player: PlayerInfoDto | null | undefined): boolean {
  if (!player?.member?.enable) return false;
  return Number(player.member.level ?? 0) >= MemberLevel.PREMIUM;
}
