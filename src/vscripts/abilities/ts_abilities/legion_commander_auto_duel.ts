import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import {
  AutoCastAbility,
  castImmediatelyOnTarget,
  findEnemiesInRange,
  getFullCastRange,
} from './shared/auto-cast-ability';

const MAX_SPELL_ABSORB_LAYERS = 16;
const DUEL_MODIFIER_NAME = 'modifier_legion_commander_duel';
const DEBUFF_IMMUNITY_MODIFIER_NAME = 'modifier_legion_commander_auto_duel_debuff_immunity';
const TARGET_UNSELECTABLE_MODIFIER_NAME = 'modifier_legion_commander_auto_duel_target_unselectable';
const BKB_AVATAR_PARTICLE = 'particles/items_fx/black_king_bar_avatar.vpcf';
const DUEL_STATE_CHECK_INTERVAL = 0.03;
const DUEL_DURATION_REFRESH_BUFFER = 1;
const DUEL_END_DURATION = 0.01;

type FixedDuelControllerParams = {
  fixedDuration?: number;
  targetEntIndex?: EntityIndex;
};

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
    if (!this.applyFixedDuelState(caster, target, duration)) {
      // CastAbilityImmediately 通常同步创建原生 modifier；若引擎延迟到下一帧，则补一次。
      Timers.CreateTimer(0, () => {
        this.applyFixedDuelState(caster, target, duration);
      });
    }
  }

  private applyFixedDuelState(
    caster: CDOTA_BaseNPC_Hero,
    target: CDOTA_BaseNPC,
    duration: number,
  ): boolean {
    const casterDuel = caster.FindModifierByName(DUEL_MODIFIER_NAME);
    const targetDuel = target.FindModifierByName(DUEL_MODIFIER_NAME);
    if (!casterDuel || !targetDuel) return false;

    // 原生决斗添加 modifier 时已经结算过状态抗性，先统一重设，再由服务器绝对时间持续锁定。
    casterDuel.SetDuration(duration, true);
    targetDuel.SetDuration(duration, true);
    caster.AddNewModifier(caster, this, DEBUFF_IMMUNITY_MODIFIER_NAME, {
      fixedDuration: duration,
      targetEntIndex: target.entindex(),
    });
    // 不设置 duration，避免目标之后获得状态抗性时缩短这个保护状态。
    target.AddNewModifier(caster, this, TARGET_UNSELECTABLE_MODIFIER_NAME, {});
    return true;
  }
}

/** 自动决斗期间只给军团提供 Debuff Immunity，并用服务器时间锁定原版决斗时长。 */
@registerModifier('abilities/ts_abilities/legion_commander_auto_duel')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_legion_commander_auto_duel_debuff_immunity extends BaseModifier {
  private target?: CDOTA_BaseNPC;
  private duelEndTime = 0;

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
      [ModifierState.DEBUFF_IMMUNE]: true,
    };
  }

  OnCreated(params: FixedDuelControllerParams): void {
    if (!IsServer()) return;

    this.initializeController(params);
    const particle = ParticleManager.CreateParticle(
      BKB_AVATAR_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      this.GetParent(),
    );
    this.AddParticle(particle, false, false, -1, false, false);
    this.StartIntervalThink(DUEL_STATE_CHECK_INTERVAL);
  }

  OnRefresh(params: FixedDuelControllerParams): void {
    if (!IsServer()) return;

    this.target?.RemoveModifierByName(TARGET_UNSELECTABLE_MODIFIER_NAME);
    this.initializeController(params);
    this.StartIntervalThink(DUEL_STATE_CHECK_INTERVAL);
  }

  private initializeController(params: FixedDuelControllerParams): void {
    const fixedDuration = Number(params.fixedDuration ?? 0);
    const targetEntIndex = Number(params.targetEntIndex ?? -1) as EntityIndex;
    this.duelEndTime = GameRules.GetGameTime() + fixedDuration;
    this.target = EntIndexToHScript(targetEntIndex) as CDOTA_BaseNPC | undefined;
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const caster = this.GetParent();
    const target = this.target;
    if (!target) {
      this.Destroy();
      return;
    }

    const casterDuel = caster.FindModifierByName(DUEL_MODIFIER_NAME);
    const targetDuel = target.FindModifierByName(DUEL_MODIFIER_NAME);
    if (!casterDuel || !targetDuel) {
      this.Destroy();
      return;
    }

    const remaining = this.duelEndTime - GameRules.GetGameTime();
    if (remaining <= 0) {
      casterDuel.SetDuration(DUEL_END_DURATION, true);
      targetDuel.SetDuration(DUEL_END_DURATION, true);
      this.Destroy();
      return;
    }

    // Only correct the server timer so the client taunt bar can keep counting down.
    // The absolute deadline still protects Duel from temporary status resistance spikes.
    const refreshedDuration = Math.max(remaining, DUEL_DURATION_REFRESH_BUFFER);
    casterDuel.SetDuration(refreshedDuration, false);
    targetDuel.SetDuration(refreshedDuration, false);

    if (!target.HasModifier(TARGET_UNSELECTABLE_MODIFIER_NAME)) {
      target.AddNewModifier(caster, this.GetAbility(), TARGET_UNSELECTABLE_MODIFIER_NAME, {});
    }
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    this.target?.RemoveModifierByName(TARGET_UNSELECTABLE_MODIFIER_NAME);
  }
}

/** 自动决斗目标在决斗结束前不可被玩家选中。 */
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

  OnCreated(): void {
    if (!IsServer()) return;
    this.StartIntervalThink(DUEL_STATE_CHECK_INTERVAL);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    if (!this.GetParent().HasModifier(DUEL_MODIFIER_NAME)) {
      this.Destroy();
    }
  }
}
