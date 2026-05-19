import { CastCoindition } from '../action/cast-condition';

/**
 * 技能目标方向，对应 Dota KV 中 AbilityUnitTargetTeam / AbilityUnitTargetType 的常见组合。
 *  - EnemyHero / EnemyCreep: 复用 bot-base 预搜的 aroundEnemyHeroes / aroundEnemyCreeps
 *  - FriendlyHero:           复用 bot-base 预搜的 aroundFriendlyHeroes（含自己）
 *  - Self:                   直接以施法者为目标
 *
 * 使用 const object + 字面量联合，TSTL 编译为零开销字符串常量。
 */
export const TargetSide = {
  EnemyHero: 'enemyHero',
  EnemyCreep: 'enemyCreep',
  FriendlyHero: 'friendlyHero',
  Self: 'self',
} as const;
export type TargetSide = (typeof TargetSide)[keyof typeof TargetSide];

/**
 * 技能 AI 规格 —— 描述某个技能在何种条件下、对何种目标施放。
 *
 * 同一个 abilityName 可注册多条 spec（例如 medusa_split_shot 对英雄/小兵的判定不同），
 * 由 AbilityRegistry 以 Map<abilityName, AbilitySpec[]> 维护，dispatcher 按注册顺序逐条尝试。
 */
export interface AbilitySpec {
  abilityName: string;
  targetSide: TargetSide;
  condition?: CastCoindition;
}
