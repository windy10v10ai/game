/**
 * 战力口径：团队层比全局强弱、英雄层比局部强弱都用这一套，保证两层判断一致。
 * 读单位当前的实际属性，玩家的抽奖技能与各种加成都已体现在里面，不靠等级与净值推算。
 */

export interface CombatStats {
  health: number;
  armor: number;
  /** 魔抗，0.25 表示 25% */
  magicResist: number;
  attackDamage: number;
  attacksPerSecond: number;
  level: number;
  /** 技能增强，0.1 表示 +10% */
  spellAmp: number;
  /** 主动技能与物品中当前能放的比例，0–1 */
  spellReady: number;
}

/** 没打起来时，敌方战力超过我方这么多倍才算「上去就是白送」，团队层与英雄层共用。 */
export const AVOID_POWER_RATIO = 3;

// 攻击输出算不到技能伤害，按等级补一项，否则法系英雄会被严重低估
const SPELL_DPS_PER_LEVEL = 12;
// 技能物品全在冷却时仍保留的技能输出比例，普攻之外还有被动与下一轮冷却
const SPELL_READY_FLOOR = 0.3;

// 威胁值按半衰期衰减，一波团战的影响大约持续两三分钟
const THREAT_HALF_LIFE = 90;
const THREAT_PER_KILL = 1;
const THREAT_MULTIPLIER_PER_POINT = 0.5;
const MAX_THREAT_MULTIPLIER = 3;
// 被击杀说明这个敌人并非不可战胜，威胁打折而不是清零
const THREAT_KEEP_ON_DEATH = 0.5;

/** 一个单位的战力：有效血量与输出乘积的平方根，残血自然打折。 */
export function combatPower(stats: CombatStats): number {
  if (stats.health <= 0) {
    return 0;
  }
  const armorFactor = (0.06 * stats.armor) / (1 + 0.06 * Math.abs(stats.armor));
  // 承受的伤害按物理与魔法各占一半估算
  const damageTaken = Math.max(0.1, 1 - 0.5 * armorFactor - 0.5 * stats.magicResist);
  const effectiveHealth = stats.health / damageTaken;
  const dps =
    stats.attackDamage * stats.attacksPerSecond +
    stats.level *
      SPELL_DPS_PER_LEVEL *
      (1 + stats.spellAmp) *
      (SPELL_READY_FLOOR + (1 - SPELL_READY_FLOOR) * stats.spellReady);
  return Math.sqrt(effectiveHealth * Math.max(dps, 0));
}

export function decayThreat(score: number, elapsed: number): number {
  return score * Math.pow(0.5, elapsed / THREAT_HALF_LIFE);
}

export function threatAfterKill(score: number): number {
  return score + THREAT_PER_KILL;
}

export function threatAfterDeath(score: number): number {
  return score * THREAT_KEEP_ON_DEATH;
}

/** 最近连续击杀我方的敌人，实际威胁比属性体现出来的更大。 */
export function threatMultiplier(score: number): number {
  return Math.min(MAX_THREAT_MULTIPLIER, 1 + score * THREAT_MULTIPLIER_PER_POINT);
}
