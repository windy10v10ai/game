import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const ILLUMINATE_ABILITY = 'keeper_of_the_light_illuminate';
const ILLUMINATE_END_ABILITY = 'keeper_of_the_light_illuminate_end';
const ILLUMINATE_TEXTURE =
  'keeper_of_the_light/kotl_ti7_immortal/keeper_of_the_light_illuminate_alt';

/** 光之守卫 冲击波觉醒：命中敌方英雄攒聚光，每层提升后续冲击波伤害 */
@registerAbility('special_bonus_unique_keeper_of_the_light_upgrade')
export class SpecialBonusUniqueKeeperOfTheLightUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_keeper_of_the_light_upgrade.name;
  }
}

/** 技能本身是 HIDDEN behavior 不进技能栏，故常驻展示为 buff 图标承载觉醒说明 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_keeper_of_the_light_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_keeper_of_the_light_upgrade extends BaseModifier {
  private hitHeroes: EntityIndex[] = [];

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  IsBuff(): boolean {
    return true;
  }

  GetTexture(): string {
    return ILLUMINATE_TEXTURE;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_ABILITY_START,
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL_VALUE,
    ];
  }

  // 顶层 KV 的 AbilityChannelTime 无法被 special_bonus 覆盖，引导条始终走原版 3 秒，
  // 只能到点替玩家松手才能兑现 KV 里缩短后的 max_channel_time
  OnAbilityStart(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const ability = event.ability;
    if (event.unit !== parent || ability.GetAbilityName() !== ILLUMINATE_ABILITY) return;

    this.hitHeroes = [];

    Timers.CreateTimer(ability.GetSpecialValueFor('max_channel_time'), () => {
      if (this.IsNull() || ability.IsNull() || !ability.IsChanneling()) return;

      const caster = this.GetParent();
      if (caster.IsNull() || !caster.IsAlive()) return;

      const illuminateEnd = caster.FindAbilityByName(ILLUMINATE_END_ABILITY);
      if (illuminateEnd && illuminateEnd.IsActivated()) {
        caster.CastAbilityImmediately(illuminateEnd, caster.GetPlayerOwnerID());
      } else {
        ability.EndChannel(false);
      }
    });
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const inflictor = event.inflictor;
    const parent = this.GetParent();
    if (!inflictor || inflictor.GetAbilityName() !== ILLUMINATE_ABILITY) return;
    if (inflictor.GetCaster() !== parent) return;

    const target = event.unit;
    if (target.GetTeamNumber() === parent.GetTeamNumber()) return;
    if (!target.IsRealHero() || target.IsIllusion()) return;

    const targetIndex = target.GetEntityIndex();
    if (this.hitHeroes.indexOf(targetIndex) !== -1) return;
    this.hitHeroes.push(targetIndex);

    // 同一发冲击波里先命中的目标不应抬高后命中目标的伤害，故推迟到本次伤害全部结算后再加层
    Timers.CreateTimer(0, () => {
      if (this.IsNull()) return;
      this.addFocusStack();
    });
  }

  GetModifierOverrideAbilitySpecial(event: ModifierOverrideAbilitySpecialEvent): 0 | 1 {
    // 客户端只会问「要不要覆盖」却从不回调取值，答「要」会让 tooltip 拿不到数字而整行空白，
    // 故客户端一律不覆盖、显示原版基数，觉醒加成改由觉醒/聚光两个 modifier 的 tooltip 说明
    if (!IsServer()) return 0;

    return event.ability.GetAbilityName() === ILLUMINATE_ABILITY &&
      event.ability_special_value === 'total_damage'
      ? 1
      : 0;
  }

  GetModifierOverrideAbilitySpecialValue(event: ModifierOverrideAbilitySpecialEvent): number {
    // 不能在此调用 GetSpecialValueFor(total_damage)，那会再次触发本回调造成无限递归
    const baseDamage = event.ability.GetLevelSpecialValueNoOverride(
      event.ability_special_value,
      event.ability_special_level,
    );

    const ability = this.GetAbility();
    if (!ability) return baseDamage;

    const bonusPct = this.getFocusStacks() * ability.GetSpecialValueFor('damage_pct_per_stack');
    return (baseDamage + ability.GetSpecialValueFor('base_damage_bonus')) * (1 + bonusPct / 100);
  }

  private getFocusStacks(): number {
    const focus = this.GetParent().FindModifierByName(
      modifier_special_bonus_unique_keeper_of_the_light_upgrade_focus.name,
    );
    return focus?.GetStackCount() ?? 0;
  }

  private addFocusStack(): void {
    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) return;

    const duration = ability.GetSpecialValueFor('focus_duration');
    const focusName = modifier_special_bonus_unique_keeper_of_the_light_upgrade_focus.name;
    const focus =
      parent.FindModifierByName(focusName) ??
      parent.AddNewModifier(parent, ability, focusName, { duration });
    if (!focus) return;

    focus.SetStackCount(
      Math.min(ability.GetSpecialValueFor('max_focus_stacks'), focus.GetStackCount() + 1),
    );
    focus.SetDuration(duration, true);
  }
}

/** 聚光：带层数与剩余时间的独立图标，命中刷新，到期整体消失 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_keeper_of_the_light_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_keeper_of_the_light_upgrade_focus extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsBuff(): boolean {
    return true;
  }

  GetTexture(): string {
    return ILLUMINATE_TEXTURE;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.TOOLTIP];
  }

  OnTooltip(): number {
    const ability = this.GetAbility();
    if (!ability) return 0;
    return this.GetStackCount() * ability.GetSpecialValueFor('damage_pct_per_stack');
  }
}
