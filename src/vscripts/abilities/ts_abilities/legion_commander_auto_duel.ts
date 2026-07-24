import { registerAbility } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  getFullCastRange,
} from './shared/auto-cast-ability';

const MAX_SPELL_ABSORB_LAYERS = 16;

/** 军团指挥官 自动决斗-觉醒：复用决斗完成自动目标选择与施放。 */
@registerAbility('legion_commander_auto_duel')
export class LegionCommanderAutoDuel extends AutoCastAbility {
  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    const duel = caster.FindAbilityByName('legion_commander_duel');
    if (!duel || !duel.IsFullyCastable()) return;

    const bonusCastRange = this.GetSpecialValueFor('bonus_cast_range');
    const enemies = findEnemiesInRange(
      caster,
      getFullCastRange(caster, duel) + bonusCastRange,
      UnitTargetType.HERO,
      true, // 决斗可对魔免单位施放
    );
    const target = enemies[0];
    if (!target) return;

    for (let layer = 0; layer < MAX_SPELL_ABSORB_LAYERS; layer++) {
      if (!target.TriggerSpellAbsorb(duel)) break;
    }

    castImmediatelyOnTarget(caster, duel, target);
  }
}
