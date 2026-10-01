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
  /** 闪避率，0.3 表示 30% */
  evasion: number;
  magicImmune: boolean;
}

/**
 * 没打起来时，敌方战力超过我方这么多倍就不主动上：团队派人与英雄进场都按它，派来的人差不多到齐才一起上。
 * 跳进敌人身边的先手技能与跳刀切入也按它判断：会主动上去打的局面才允许先手。
 * 大于 1 是有意的：玩家要有挑战的战斗，勉强打不过也要打，调这一个数就能整体调交战倾向。
 */
export const AVOID_POWER_RATIO = 1.5;

/**
 * 已经交战时，敌方战力超过我方这么多倍就趁早撤，不硬打。比进场门槛略松：技能已经交了、人已经贴上，
 * 这时掉头损失更大；两个数反过来会出现冲上去一挨打又掉头跑。
 */
export const KEEP_FIGHTING_RATIO = 3;

/** 推进路过时顺手清野需要的自身战力，太弱的英雄停下来打野会耽误推进。 */
export const QUICK_CLEAR_POWER = 1500;

/** 打远古野需要的自身战力，不读野怪战力，调这一个数即可。 */
export const ANCIENT_FARM_POWER = 3000;

// 叠满闪避也有克制手段，不让有效血量无限放大
const MAX_EVASION = 0.75;

// 攻击输出算不到技能伤害，按等级补一项，否则法系英雄会被严重低估
const SPELL_DPS_PER_LEVEL = 12;
// 技能物品全在冷却时仍保留的技能输出比例，普攻之外还有被动与下一轮冷却
const SPELL_READY_FLOOR = 0.3;

/** 一个单位的战力：有效血量与输出乘积的平方根，残血自然打折。 */
export function combatPower(stats: CombatStats): number {
  return Math.sqrt(effectiveHealth(stats) * damagePerSecond(stats));
}

/** 按护甲、魔抗、闪避、魔免折算后，打死这个单位要打掉的血量。 */
export function effectiveHealth(stats: CombatStats): number {
  if (stats.health <= 0) {
    return 0;
  }
  const armorFactor = (0.06 * stats.armor) / (1 + 0.06 * Math.abs(stats.armor));
  // 承受的伤害按物理与魔法各占一半估算；闪避只躲普攻那一半，魔免时魔法那一半打不进来。
  // 暴击、吸血引擎读不出汇总值，不估
  const physicalTaken = (1 - armorFactor) * (1 - Math.min(Math.max(stats.evasion, 0), MAX_EVASION));
  const magicTaken = stats.magicImmune ? 0 : 1 - stats.magicResist;
  return stats.health / Math.max(0.1, 0.5 * physicalTaken + 0.5 * magicTaken);
}

/** 普攻加按等级估的技能输出，技能物品在冷却时打折。 */
export function damagePerSecond(stats: CombatStats): number {
  if (stats.health <= 0) {
    return 0;
  }
  const dps =
    stats.attackDamage * stats.attacksPerSecond +
    stats.level *
      SPELL_DPS_PER_LEVEL *
      (1 + stats.spellAmp) *
      (SPELL_READY_FLOOR + (1 - SPELL_READY_FLOOR) * stats.spellReady);
  return Math.max(dps, 0);
}

// 击杀威胁只微调战力：持续强势的一方稍显可怕，几分钟才回落；放大太多会变成越杀越不敢打
const THREAT_HALF_LIFE = 120;
// 击杀一个和自己一样强的英雄加的威胁分，杀弱的加得少
const THREAT_PER_EQUAL_KILL = 0.1;
const MAX_THREAT_MULTIPLIER = 1.5;
// 被击杀说明并非不可战胜，威胁打折而不是清零
const THREAT_KEEP_ON_DEATH = 0.5;

export function decayThreat(score: number, elapsed: number): number {
  return score * Math.pow(0.5, elapsed / THREAT_HALF_LIFE);
}

export function threatAfterKill(score: number, victimPower: number, killerPower: number): number {
  const ratio = killerPower > 0 ? victimPower / killerPower : 1;
  return score + THREAT_PER_EQUAL_KILL * ratio;
}

export function threatAfterDeath(score: number): number {
  return score * THREAT_KEEP_ON_DEATH;
}

/** 最近击杀过对面英雄的，实际威胁比属性体现的略大。 */
export function threatMultiplier(score: number): number {
  return Math.min(MAX_THREAT_MULTIPLIER, 1 + score);
}
