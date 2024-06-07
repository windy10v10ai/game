import { registerModifier } from "../../utils/dota_ts_adapter";
import { ActionAbility } from "../action/action-ability";
import { BaseHeroAIModifier } from "./hero-base";

@registerModifier()
export class LunaAIModifier extends BaseHeroAIModifier {
  override UseAbilityEnemy(): boolean {
    // 环绕月刃
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, "luna_moon_glaive", {
        target: { range: 200 },
        self: { healthPercentLessThan: 95 },
      })
    ) {
      return true;
    }
    return false;
  }
}
