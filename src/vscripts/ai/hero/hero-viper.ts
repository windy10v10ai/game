import { registerModifier } from "../../utils/dota_ts_adapter";
import { ActionAbility } from "../action/action-ability";
import { BaseHeroAIModifier } from "./hero-base";

@registerModifier()
export class ViperAIModifier extends BaseHeroAIModifier {
  override UseAbilityEnemy(): boolean {
    // 幽冥剧毒
    if (
      ActionAbility.CastAbilityOnEnemyHero(this, "viper_nethertoxin", {
        target: { noModifier: "modifier_viper_nethertoxin" },
      })
    ) {
      return true;
    }
    // 蝮蛇突袭
    if (
      ActionAbility.CastAbilityOnEnemyHero(this, "viper_viper_strike", {
        target: { noModifier: "modifier_viper_viper_strike" },
      })
    ) {
      return true;
    }
    // 极恶俯冲
    if (
      ActionAbility.CastAbilityOnEnemyHero(this, "viper_nose_dive", {
        self: { healthPercentMoreThan: 50, hasScepter: true },
      })
    ) {
      return true;
    }
    return false;
  }

  override UseAbilityCreep(): boolean {
    // 幽冥剧毒
    if (
      ActionAbility.CastAbilityOnEnemyCreep(this, "viper_nethertoxin", {
        target: { noModifier: "modifier_viper_nethertoxin" },
      })
    ) {
      return true;
    }

    return false;
  }
}
