import { ItemRegistry } from '../item-registry';
import { SPECS as abyssalBladeV2 } from './item_abyssal_blade_v2';
import { SPECS as adiKing } from './item_adi_king';
import { SPECS as armlet } from './item_armlet';
import { SPECS as beastArmor } from './item_beast_armor';
import { SPECS as beastShield } from './item_beast_shield';
import { SPECS as bladeMail2 } from './item_blade_mail_2';
import { SPECS as blackKingBar2 } from './item_black_king_bar_2';
import { SPECS as blueFantasy } from './item_blue_fantasy';
import { SPECS as dagon } from './item_dagon';
import { SPECS as draculaMask } from './item_dracula_mask';
import { SPECS as etherealBlade } from './item_ethereal_blade';
import { SPECS as forbiddenBlade } from './item_forbidden_blade';
import { SPECS as forbiddenStaff } from './item_forbidden_staff';
import { SPECS as forceFieldUltra } from './item_force_field_ultra';
import { SPECS as gungir2 } from './item_gungir_2';
import { SPECS as handOfGroup } from './item_hand_of_group';
import { SPECS as hawkeyeFighter } from './item_hawkeye_fighter';
import { SPECS as hawkeyeTurret } from './item_hawkeye_turret';
import { SPECS as heavensHalberdV2 } from './item_heavens_halberd_v2';
import { SPECS as holyLocket } from './item_holy_locket';
import { SPECS as hurricanePike2 } from './item_hurricane_pike_2';
import { SPECS as insightArmor } from './item_insight_armor';
import { SPECS as jumpJumpJump } from './item_jump_jump_jump';
import { SPECS as magicScepter } from './item_magic_scepter';
import { SPECS as magicSword } from './item_magic_sword';
import { SPECS as refresher } from './item_refresher';
import { SPECS as saintOrb } from './item_saint_orb';
import { SPECS as satanic2 } from './item_satanic_2';
import { SPECS as shadowImpact } from './item_shadow_impact';
import { SPECS as shadowJudgment } from './item_shadow_judgment';
import { SPECS as sheepstick } from './item_sheepstick';
import { SPECS as shivasGuard2 } from './item_shivas_guard_2';
import { SPECS as sixPathsReincarnationGun } from './item_six_paths_reincarnation_gun';
import { SPECS as smokeOfDeceit } from './item_smoke_of_deceit';
import { SPECS as undyingHeart } from './item_undying_heart';
import { SPECS as waspCallous } from './item_wasp_callous';

/**
 * 物品 AI spec 聚合注册入口，结构对齐 ability/specs/index.ts。
 *
 * 一个物品一个文件（同名多档位共用同一逻辑时合并为一个文件，如达贡 1~5 级、
 * 阿迪王/阿迪王plus、大核荣耀系列、法杖系列、刷新球系列、羊刀系列、圣物系列、不朽之心系列、团队之手系列
 * 这些有明确升级链且施法逻辑相同的装备）。
 * 注册顺序即 ItemDispatcher 遍历到该物品时的 spec 尝试顺序。
 */
export function registerItemSpecs(): void {
  // Phase 1：对小兵 / 拾取物
  ItemRegistry.registerAll(handOfGroup);
  ItemRegistry.registerAll(smokeOfDeceit);

  // B1：无条件常驻 buff（不受距离限制）
  ItemRegistry.registerAll(adiKing);
  ItemRegistry.registerAll(armlet);
  ItemRegistry.registerAll(hawkeyeFighter);

  // B1：NO_TARGET buff + 敌人检测
  ItemRegistry.registerAll(magicScepter);
  ItemRegistry.registerAll(magicSword);
  ItemRegistry.registerAll(waspCallous);
  ItemRegistry.registerAll(hawkeyeTurret);
  ItemRegistry.registerAll(shivasGuard2);
  ItemRegistry.registerAll(sixPathsReincarnationGun);

  // B2：战斗 buff（激进/保守 OR）
  ItemRegistry.registerAll(bladeMail2);
  ItemRegistry.registerAll(forceFieldUltra);
  ItemRegistry.registerAll(beastArmor);
  ItemRegistry.registerAll(insightArmor);
  ItemRegistry.registerAll(blackKingBar2);
  ItemRegistry.registerAll(beastShield);

  // B3：治疗/吸血类
  ItemRegistry.registerAll(satanic2);
  ItemRegistry.registerAll(draculaMask);
  ItemRegistry.registerAll(undyingHeart);

  // B4：特殊条件
  ItemRegistry.registerAll(heavensHalberdV2);

  // C：对敌英雄控制类（跳过已被控目标）
  ItemRegistry.registerAll(sheepstick);
  ItemRegistry.registerAll(abyssalBladeV2);

  // D：对敌英雄伤害类（不检控制）
  ItemRegistry.registerAll(blueFantasy);
  ItemRegistry.registerAll(dagon);
  ItemRegistry.registerAll(etherealBlade);
  ItemRegistry.registerAll(shadowJudgment);
  ItemRegistry.registerAll(shadowImpact);
  ItemRegistry.registerAll(forbiddenBlade);
  ItemRegistry.registerAll(hurricanePike2);

  // E：对友方治疗
  ItemRegistry.registerAll(holyLocket);
  ItemRegistry.registerAll(saintOrb);

  // F：POINT 施法
  ItemRegistry.registerAll(forbiddenStaff);
  ItemRegistry.registerAll(gungir2);
  ItemRegistry.registerAll(jumpJumpJump);

  // G：刷新类
  ItemRegistry.registerAll(refresher);
}
