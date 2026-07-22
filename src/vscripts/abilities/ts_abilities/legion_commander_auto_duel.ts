import { registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  modifier_autocast_think,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  getFullCastRange,
} from './shared/auto-cast-ability';

const MAX_SPELL_ABSORB_LAYERS = 16;

/** 军团指挥官 自动决斗-觉醒：复用决斗完成自动目标选择与施放。 */
@registerAbility('legion_commander_auto_duel')
export class LegionCommanderAutoDuel extends AutoCastAbility {
  private trackedAutoDuelTarget?: CDOTA_BaseNPC;

  GetIntrinsicModifierName(): string {
    return 'modifier_legion_commander_auto_duel_think';
  }

  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    const duel = caster.FindAbilityByName('legion_commander_duel');
    if (!duel || !duel.IsFullyCastable()) return;

    const bonusCastRange = this.GetSpecialValueFor('bonus_cast_range');
    const enemies = findEnemiesInRange(
      caster,
      getFullCastRange(caster, duel) + bonusCastRange,
      UnitTargetType.HERO,
    );
    const target = enemies[0];
    if (!target) return;

    for (let layer = 0; layer < MAX_SPELL_ABSORB_LAYERS; layer++) {
      if (!target.TriggerSpellAbsorb(duel)) break;
    }

    castImmediatelyOnTarget(caster, duel, target);
    this.trackedAutoDuelTarget = target;
  }

  /**
   * The native level 25 talent refresh is unreliable through the immediate auto-cast path.
   * Mirror it only when the tracked auto-duel opponent dies during that Duel.
   */
  OnTrackedUnitDeath(unit: CDOTA_BaseNPC): void {
    const trackedTarget = this.trackedAutoDuelTarget;
    if (!trackedTarget || unit !== trackedTarget) return;
    this.trackedAutoDuelTarget = undefined;

    const caster = this.GetCaster();
    if (!caster || caster.IsNull() || !caster.IsAlive()) return;
    if (
      !unit.HasModifier('modifier_legion_commander_duel') &&
      !caster.HasModifier('modifier_legion_commander_duel')
    ) {
      return;
    }

    const duel = caster.FindAbilityByName('legion_commander_duel');
    if (!duel || duel.GetSpecialValueFor('duel_refresh_on_victory') <= 0) return;

    duel.EndCooldown();
  }
}

@registerModifier('abilities/ts_abilities/legion_commander_auto_duel')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_legion_commander_auto_duel_think extends modifier_autocast_think {
  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_DEATH];
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;
    const ability = this.GetAbility() as LegionCommanderAutoDuel | undefined;
    ability?.OnTrackedUnitDeath(event.unit);
  }
}
