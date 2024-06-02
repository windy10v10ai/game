import { registerModifier } from "../../utils/dota_ts_adapter";
import { ActionAbility } from "../action/action-ability";
import { BaseHeroAIModifier } from "./hero-base";

@registerModifier()
export class SniperAIModifier extends BaseHeroAIModifier {
  protected override FindHeroRadius: number = 3000;

  override UseAbilityEnemy(): boolean {
    // 旧版 暗杀
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, "sniper_assassinate_upgrade", {
        self: { hasScepter: true },
      })
    ) {
      return true;
    }
    // 瞄准
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, "sniper_take_aim", { target: { range: 1000 } })
    ) {
      return true;
    }
    return false;
  }

  override UseAbilityCreep(): boolean {
    // 霰弹雨
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, "sniper_shrapnel", {
        target: { noModifier: "modifier_sniper_shrapnel_slow" },
        ability: { charges: 3 },
      })
    ) {
      return true;
    }

    return false;
  }
}
