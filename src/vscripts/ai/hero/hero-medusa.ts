import { registerModifier } from "../../utils/dota_ts_adapter";
import { ActionAbility } from "../action/action-ability";
import { BaseHeroAIModifier } from "./hero-base";

@registerModifier()
export class MedusaAIModifier extends BaseHeroAIModifier {
  override UseAbilityEnemy(): boolean {
    // 秘术异蛇
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, "medusa_mystic_snake")) {
      return true;
    }

    // 罗网箭阵
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, "medusa_gorgon_grasp")) {
      return true;
    }

    // 石化凝视
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, "medusa_stone_gaze", { target: { count: 2 } })
    ) {
      return true;
    }

    // 分裂箭 开启
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, "medusa_split_shot", {
        target: { count: 2, range: 900 },
        action: { toggleOn: true },
      })
    ) {
      return true;
    }
    // 分裂箭 关闭
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, "medusa_split_shot", {
        target: { countLessThan: 1, range: 900 },
        ability: { levelLessThan: 3 },
        action: { toggleOff: true },
      })
    ) {
      return true;
    }

    return false;
  }

  override UseAbilityCreep(): boolean {
    // 秘术异蛇
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, "medusa_mystic_snake", {
        target: { count: 2 },
      })
    ) {
      return true;
    }

    // 罗网箭阵
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, "medusa_gorgon_grasp", {
        target: { count: 2 },
      })
    ) {
      return true;
    }

    // 分裂箭 开启
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, "medusa_split_shot", {
        target: { count: 2, range: 900 },
        action: { toggleOn: true },
      })
    ) {
      return true;
    }
    // 分裂箭 关闭
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, "medusa_split_shot", {
        target: { countLessThan: 1, range: 900 },
        ability: { levelLessThan: 3 },
        action: { toggleOff: true },
      })
    ) {
      return true;
    }

    return false;
  }
}
