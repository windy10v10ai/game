import { registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { applyAwakenMagicImmunity } from './shared/awaken-magic-immunity';
import {
  AutoCastAbility,
  findEnemiesInRange,
  getFullCastRange,
  modifier_autocast_think,
  willReflect,
} from './shared/auto-cast-ability';

const NATIVE_DAGGER = 'phantom_assassin_stifling_dagger';
const PHANTOM_STRIKE = 'phantom_assassin_phantom_strike';

/**
 * 幻影刺客 窒碍短匕-觉醒：占原技能槽位提供自动施法开关，投掷效果由隐藏保留的原生技能负责；
 * 施放短匕或幻影突袭后获得短暂魔法免疫。键名带 special_bonus_ 前缀，供短匕弹道速度的觉醒加成引用。
 * autocast 开启后，对射程内随机一名敌方英雄投掷，会反弹指向性技能的目标不投。
 */
@registerAbility('special_bonus_unique_phantom_assassin_upgrade')
export class SpecialBonusUniquePhantomAssassinUpgrade extends AutoCastAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_phantom_assassin_upgrade.name;
  }

  OnUpgrade(): void {
    if (!IsServer()) return;
    this.ensureNativeAbility();
  }

  OnOwnerSpawned(): void {
    if (!IsServer()) return;
    this.ensureNativeAbility();
  }

  OnSpellStart(): void {
    if (!IsServer()) return;
    const target = this.GetCursorTarget();
    if (target === undefined || willReflect(target)) return;
    this.throwDagger(target);
  }

  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    if (!this.IsFullyCastable()) return;

    const candidates = findEnemiesInRange(
      caster,
      getFullCastRange(caster, this),
      UnitTargetType.HERO,
      UnitTargetFlags.NOT_CREEP_HERO + UnitTargetFlags.NOT_ILLUSIONS,
    ).filter((enemy) => !willReflect(enemy));
    if (candidates.length === 0) return;

    const target = candidates[RandomInt(0, candidates.length - 1)];
    // 自动触发不经过引擎原生施法管线，须用 UseResources 模拟正常施法扣蓝与启动冷却
    this.UseResources(true, false, false, true);
    this.throwDagger(target);
  }

  grantMagicImmunity(durationKey: string, playSound = true): void {
    applyAwakenMagicImmunity(
      this.GetCaster(),
      this,
      this.GetSpecialValueFor(durationKey),
      playSound,
    );
  }

  /** 原生技能只作为效果载体常驻在英雄身上，等级跟随壳技能，不占技能栏 */
  private ensureNativeAbility(): CDOTABaseAbility | undefined {
    const caster = this.GetCaster();
    const native = caster.FindAbilityByName(NATIVE_DAGGER) ?? caster.AddAbility(NATIVE_DAGGER);
    if (native === undefined) return undefined;

    native.SetLevel(Math.max(1, this.GetLevel()));
    native.SetHidden(true);
    return native;
  }

  private throwDagger(target: CDOTA_BaseNPC): void {
    const native = this.ensureNativeAbility();
    if (native === undefined) return;

    this.GetCaster().SetCursorCastTarget(target);
    native.OnSpellStart();
    // 短匕可自动连续触发，不播放黑皇杖音效
    this.grantMagicImmunity('dagger_immune_duration', false);
  }
}

/** 觉醒的 intrinsic：继承共享的 autocast 思考，额外监听幻影突袭真正释放后给自己魔法免疫。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_phantom_assassin_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_phantom_assassin_upgrade extends modifier_autocast_think {
  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    if (event.unit !== this.GetParent()) return;
    if (event.ability.GetAbilityName() !== PHANTOM_STRIKE) return;

    const awaken = this.GetAbility() as SpecialBonusUniquePhantomAssassinUpgrade | undefined;
    awaken?.grantMagicImmunity('strike_immune_duration');
  }
}
