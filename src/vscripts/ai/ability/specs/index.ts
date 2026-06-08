import { AbilityRegistry } from '../ability-registry';
import { SPECS as ancientApparitionChillingTouch } from './ancient_apparition_chilling_touch';
import { SPECS as axeBattleHunger } from './axe_battle_hunger';
import { SPECS as axeBerserkerSCall } from './axe_berserkers_call';
import { SPECS as axeCullingBlade } from './axe_culling_blade';
import { SPECS as doomBringerInfernalBlade } from './doom_bringer_infernal_blade';
import { SPECS as dragonKnightBreatheFire } from './dragon_knight_breathe_fire';
import { SPECS as dragonKnightDragonTail } from './dragon_knight_dragon_tail';
import { SPECS as dragonKnightFireball } from './dragon_knight_fireball';
import { SPECS as drowRangerFrostArrows } from './drow_ranger_frost_arrows';
import { SPECS as enchantressImpetus } from './enchantress_impetus';
import { SPECS as jakiroDualBreath } from './jakiro_dual_breath';
import { SPECS as lichFrostArmor } from './lich_frost_armor';
import { SPECS as lichFrostNova } from './lich_frost_nova';
import { SPECS as lichFrostShield } from './lich_frost_shield';
import { SPECS as lionFingerOfDeath } from './lion_finger_of_death';
import { SPECS as lionImpale } from './lion_impale';
import { SPECS as lionManaDrain } from './lion_mana_drain';
import { SPECS as lionVoodoo } from './lion_voodoo';
import { SPECS as medusaSplitShot } from './medusa_split_shot';
import { SPECS as omniknightHammerOfPurity } from './omniknight_hammer_of_purity';
import { SPECS as omniknightPurification } from './omniknight_purification';
import { SPECS as sandkingBurrowstrike } from './sandking_burrowstrike';
import { SPECS as sandkingScorpionStrike } from './sandking_scorpion_strike';
import { SPECS as sandkingSandStorm } from './sandking_sand_storm';
import { SPECS as shadowShamanEtherShock } from './shadow_shaman_ether_shock';
import { SPECS as shadowShamanMassSerpentWard } from './shadow_shaman_mass_serpent_ward';
import { SPECS as shadowShamanShackles } from './shadow_shaman_shackles';
import { SPECS as shadowShamanUrnaconda } from './shadow_shaman_urnaconda';
import { SPECS as shadowShamanVoodoo } from './shadow_shaman_voodoo';
import { SPECS as silencerGlaivesOfWisdom } from './silencer_glaives_of_wisdom';
import { SPECS as slarkSaltwaterShiv } from './slark_saltwater_shiv';
import { SPECS as tinkerDeployTurrets } from './tinker_deploy_turrets';
import { SPECS as tinkerLaser } from './tinker_laser';
import { SPECS as tinkerMarchOfTheMachines } from './tinker_march_of_the_machines';
import { SPECS as tinkerWarpGrenade } from './tinker_warp_grenade';
import { SPECS as tuskWalrusPunch } from './tusk_walrus_punch';
import { SPECS as viperPoisonAttack } from './viper_poison_attack';
import { SPECS as winterWyvernArcticBurn } from './winter_wyvern_arctic_burn';

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

  // Jakiro 杰奇洛
  AbilityRegistry.registerAll(jakiroDualBreath);

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

  // Tinker 修补匠
  AbilityRegistry.registerAll(tinkerLaser);
  AbilityRegistry.registerAll(tinkerMarchOfTheMachines);
  AbilityRegistry.registerAll(tinkerWarpGrenade);
  AbilityRegistry.registerAll(tinkerDeployTurrets);

  // 抽奖法球 / 开关类：bot 抽到后主动开启自动施法 / 切换开关，否则永不生效。
  // CD 制 / 0 蓝法球常开（Self autoCastOn）
  AbilityRegistry.registerAll(tuskWalrusPunch);
  AbilityRegistry.registerAll(doomBringerInfernalBlade);
  AbilityRegistry.registerAll(slarkSaltwaterShiv);
  AbilityRegistry.registerAll(omniknightHammerOfPurity);
  // 每攻击耗蓝法球，升到 2 级再开（Self autoCastOn + level.gte 2）
  AbilityRegistry.registerAll(viperPoisonAttack);
  AbilityRegistry.registerAll(silencerGlaivesOfWisdom);
  AbilityRegistry.registerAll(drowRangerFrostArrows);
  AbilityRegistry.registerAll(ancientApparitionChillingTouch);
  AbilityRegistry.registerAll(enchantressImpetus);
  // TOGGLE 类：分裂箭按敌人数量开关；严寒烧灼有 A 杖时按敌情飞行开关（持续耗蓝，无敌则关）
  AbilityRegistry.registerAll(medusaSplitShot);
  AbilityRegistry.registerAll(winterWyvernArcticBurn);
  // 友方护甲（主动释放，noModifier 防重复）
  AbilityRegistry.registerAll(lichFrostArmor);
}
