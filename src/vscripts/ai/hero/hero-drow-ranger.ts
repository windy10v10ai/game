import { registerModifier } from "../../utils/dota_ts_adapter";
import { ActionAbility } from "../action/action-ability";
import { BaseHeroAIModifier } from "./hero-base";

@registerModifier()
export class DrowRangerAIModifier extends BaseHeroAIModifier {
  protected override FindHeroRadius: number = 3000;

  override UseAbilityEnemy(): boolean {
    const attackRange = this.hero.Script_GetAttackRange();
    // 狂风
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, "drow_ranger_wave_of_silence")) {
      return true;
    }

    // 冰川
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, "drow_ranger_glacier", {
        target: { range: attackRange + 200 },
      })
    ) {
      return true;
    }
    // 数箭齐发
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, "drow_ranger_multishot", {
        target: { range: attackRange * 1.75 - 200 },
      })
    ) {
      return true;
    }

    return false;
  }

  override UseAbilityCreep(): boolean {
    const attackRange = this.hero.Script_GetAttackRange();
    // 数箭齐发
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, "drow_ranger_multishot", {
        target: { range: attackRange * 1.75 - 200, count: 3 },
      })
    ) {
      return true;
    }

    return false;
  }
}
