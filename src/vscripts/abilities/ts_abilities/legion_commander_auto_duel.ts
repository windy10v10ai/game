import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { calculateAttackDPS } from '../../utils/damage-calculation';
import { applyAwakenMagicImmunity } from './shared/awaken-magic-immunity';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  getFullCastRange,
  modifier_autocast_think,
} from './shared/auto-cast-ability';
import { isWarlockInfernalUnitName } from './warlock-awaken-math';

const MAX_SPELL_ABSORB_LAYERS = 16;
const KILL_TIME_DUEL_DURATION_RATIO = 0.8;
const MIN_SURVIVING_HEALTH_RATIO = 0.3;

// 决斗中断/外部支援等干扰无法预知，靠这两条安全余量兜底，而不是逐帧重新评估战局
function canWinDuel(
  caster: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC,
  duelDuration: number,
): boolean {
  const casterDPS = calculateAttackDPS(caster, target);
  if (casterDPS <= 0) return false;

  const timeToKill = target.GetHealth() / casterDPS;
  // 状态抗性会缩短决斗对目标一侧的强制时长，目标可能借机提前脱离
  const effectiveDuration = duelDuration * (1 - target.GetStatusResistance());
  if (timeToKill > effectiveDuration * KILL_TIME_DUEL_DURATION_RATIO) return false;

  const targetDPS = calculateAttackDPS(target, caster);
  const survivingHealth = caster.GetHealth() - targetDPS * timeToKill;
  return survivingHealth >= caster.GetMaxHealth() * MIN_SURVIVING_HEALTH_RATIO;
}

/** 军团指挥官 自动决斗-觉醒：复用决斗完成自动目标选择与施放。 */
@registerAbility('legion_commander_auto_duel')
export class LegionCommanderAutoDuel extends AutoCastAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_legion_commander_auto_duel_intrinsic';
  }

  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    const duel = caster.FindAbilityByName('legion_commander_duel');
    if (!duel || !duel.IsFullyCastable()) return;
    // 自身已残血时必然打不满足 canWinDuel 的余量要求，提前跳过避免无谓的目标搜索
    if (caster.GetHealthPercent() < MIN_SURVIVING_HEALTH_RATIO * 100) return;

    const duration = duel.GetSpecialValueFor('duration');
    const bonusCastRange = this.GetSpecialValueFor('bonus_cast_range');
    const enemies = findEnemiesInRange(
      caster,
      getFullCastRange(caster, duel) + bonusCastRange,
      UnitTargetType.HERO,
      // 决斗可对魔免单位施放，排除幻象
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES + UnitTargetFlags.NOT_ILLUSIONS,
    );
    const target = enemies.find(
      (enemy) =>
        !enemy.IsIllusion() &&
        !isWarlockInfernalUnitName(enemy.GetUnitName()) &&
        canWinDuel(caster, enemy, duration),
    );
    if (!target) return;

    for (let layer = 0; layer < MAX_SPELL_ABSORB_LAYERS; layer++) {
      if (!target.TriggerSpellAbsorb(duel)) break;
    }

    castImmediatelyOnTarget(caster, duel, target);

    target.AddNewModifier(
      caster,
      this,
      modifier_legion_commander_auto_duel_target_unselectable.name,
      { duration },
    );
  }
}

/** 自动决斗-觉醒的 intrinsic：继承共享的 autocast 思考，额外监听决斗（含手动施放）真正释放后追加真实 BKB。 */
@registerModifier('abilities/ts_abilities/legion_commander_auto_duel')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_legion_commander_auto_duel_intrinsic extends modifier_autocast_think {
  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (event.unit !== parent) return;
    if (event.ability.GetAbilityName() !== 'legion_commander_duel') return;

    const ability = this.GetAbility();
    if (!ability) return;

    applyAwakenMagicImmunity(parent, ability, event.ability.GetSpecialValueFor('duration'));
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
