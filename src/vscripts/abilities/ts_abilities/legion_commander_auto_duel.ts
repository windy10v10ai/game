import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { applyAwakenMagicImmunity } from './shared/awaken-magic-immunity';
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
      // 决斗可对魔免单位施放，排除幻象
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES + UnitTargetFlags.NOT_ILLUSIONS,
    );
    const target = enemies.find((enemy) => !enemy.IsIllusion());
    if (!target) return;

    for (let layer = 0; layer < MAX_SPELL_ABSORB_LAYERS; layer++) {
      if (!target.TriggerSpellAbsorb(duel)) break;
    }

    castImmediatelyOnTarget(caster, duel, target);

    const duration = duel.GetSpecialValueFor('duration');
    applyAwakenMagicImmunity(caster, this, duration);
    target.AddNewModifier(
      caster,
      this,
      modifier_legion_commander_auto_duel_target_unselectable.name,
      { duration },
    );
  }
}

/** 自动决斗目标在决斗持续时间内不可被玩家选中。 */
@registerModifier('abilities/ts_abilities/legion_commander_auto_duel')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_legion_commander_auto_duel_target_unselectable extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'legion_commander_duel';
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.UNSELECTABLE]: true,
    };
  }
}
