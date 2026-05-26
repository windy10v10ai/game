/**
 * 会员等级（保持与 src/vscripts/api/player.ts MemberLevel 一致）。
 * 复制一份是为了不让前端 shared util 反向引用 vscripts 的 enum 运行时（const enum 跨包不可靠）。
 */
export const enum MemberLevel {
  NORMAL = 1,
  PREMIUM = 2,
}

// 接受 net table transformer 输出的 member 子结构，level 字段为可选数字。
interface MemberLike {
  enable?: boolean;
  level?: number;
}

/** 是否启用了任意级别会员（普通或高级）。 */
export function isMemberActive(member: MemberLike | null | undefined): boolean {
  return Boolean(member?.enable);
}

/** 是否高级会员（PREMIUM）。普通会员和未开通都返回 false。 */
export function isPremiumMember(member: MemberLike | null | undefined): boolean {
  if (!member?.enable) return false;
  return Number(member.level ?? 0) >= MemberLevel.PREMIUM;
}
