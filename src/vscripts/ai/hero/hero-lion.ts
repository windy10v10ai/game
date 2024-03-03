import { registerModifier } from "../../utils/dota_ts_adapter";
import { ActionAbility } from "../action/action-ability";
import { BaseHeroAIModifier } from "./hero-base";

@registerModifier()
export class LionAIModifier extends BaseHeroAIModifier {
  override UseAbilityEnemy(): boolean {
    // 变羊
    if (ActionAbility.CastAbilityOnEnemyHero(this, "lion_voodoo")) {
      return true;
    }
    // 裂地尖刺
    if (ActionAbility.CastAbilityOnEnemyHero(this, "lion_impale")) {
      return true;
    }

    // 死亡一指
    if (
      ActionAbility.CastAbilityOnEnemyHero(this, "lion_finger_of_death", {
        target: { healthPercentLessThan: 95 },
      })
    ) {
      return true;
    }

    // 法力吸取
    if (ActionAbility.CastAbilityOnEnemyHero(this, "lion_mana_drain")) {
      return true;
    }
    return false;
  }

  override UseAbilityCreep(): boolean {
    // 裂地尖刺
    if (
      ActionAbility.CastAbilityOnEnemyCreep(this, "lion_impale", {
        self: { abilityLevel: 4 },
      })
    ) {
      return true;
    }

    return false;
  }
}
