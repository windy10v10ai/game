import { AbilityRegistry } from '../ability-registry';
import { SPECS as axeBattleHunger } from './axe_battle_hunger';
import { SPECS as axeBerserkerSCall } from './axe_berserkers_call';
import { SPECS as axeCullingBlade } from './axe_culling_blade';
import { SPECS as dragonKnightBreatheFire } from './dragon_knight_breathe_fire';
import { SPECS as dragonKnightDragonTail } from './dragon_knight_dragon_tail';
import { SPECS as dragonKnightFireball } from './dragon_knight_fireball';
import { SPECS as lichFrostNova } from './lich_frost_nova';
import { SPECS as lichFrostShield } from './lich_frost_shield';
import { SPECS as lionFingerOfDeath } from './lion_finger_of_death';
import { SPECS as lionImpale } from './lion_impale';
import { SPECS as lionManaDrain } from './lion_mana_drain';
import { SPECS as lionVoodoo } from './lion_voodoo';
import { SPECS as omniknightPurification } from './omniknight_purification';
import { SPECS as sandkingBurrowstrike } from './sandking_burrowstrike';
import { SPECS as sandkingScorpionStrike } from './sandking_scorpion_strike';
import { SPECS as sandkingSandStorm } from './sandking_sand_storm';
import { SPECS as shadowShamanEtherShock } from './shadow_shaman_ether_shock';
import { SPECS as shadowShamanMassSerpentWard } from './shadow_shaman_mass_serpent_ward';
import { SPECS as shadowShamanShackles } from './shadow_shaman_shackles';
import { SPECS as shadowShamanUrnaconda } from './shadow_shaman_urnaconda';
import { SPECS as shadowShamanVoodoo } from './shadow_shaman_voodoo';

/**
 * 技能 AI spec 聚合注册入口。
 *
 * 一个技能一个文件，不区分原生/lottery —— 技能就是技能，spec 跟着技能走。
 * 注册顺序即同一 tick 内多个技能可用时的尝试顺序：
 *   - 同一英雄的多个有 spec 的技能，dispatcher 按 hero.GetAbilityByIndex 槽位顺序遍历，
 *     spec 优先级实际由"该技能在该英雄上挂在第几槽"决定
 *   - 同名技能多条 spec 仍按各 SPECS 数组内顺序逐条尝试
 *
 * 当未来 spec 之间出现真正需要"全局优先级"的取舍时，再扩展机制。当前保持简单。
 */
export function registerAbilitySpecs(): void {
  // Dragon Knight 龙骑士
  AbilityRegistry.registerAll(dragonKnightBreatheFire);
  AbilityRegistry.registerAll(dragonKnightDragonTail);
  AbilityRegistry.registerAll(dragonKnightFireball);

  // Omniknight 全能骑士
  AbilityRegistry.registerAll(omniknightPurification);

  // Lich 巫妖
  AbilityRegistry.registerAll(lichFrostNova);
  AbilityRegistry.registerAll(lichFrostShield);

  // Lion 莱恩
  AbilityRegistry.registerAll(lionVoodoo);
  AbilityRegistry.registerAll(lionImpale);
  AbilityRegistry.registerAll(lionManaDrain);
  AbilityRegistry.registerAll(lionFingerOfDeath);

  // Axe 斧王
  AbilityRegistry.registerAll(axeBerserkerSCall);
  AbilityRegistry.registerAll(axeBattleHunger);
  AbilityRegistry.registerAll(axeCullingBlade);

  // Sand King 沙王
  AbilityRegistry.registerAll(sandkingBurrowstrike);
  AbilityRegistry.registerAll(sandkingSandStorm);
  AbilityRegistry.registerAll(sandkingScorpionStrike);

  // Shadow Shaman 暗影萨满
  AbilityRegistry.registerAll(shadowShamanEtherShock);
  AbilityRegistry.registerAll(shadowShamanVoodoo);
  AbilityRegistry.registerAll(shadowShamanShackles);
  AbilityRegistry.registerAll(shadowShamanUrnaconda);
  AbilityRegistry.registerAll(shadowShamanMassSerpentWard);
}
