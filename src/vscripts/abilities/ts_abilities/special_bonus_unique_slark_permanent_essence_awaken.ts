import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const ESSENCE_SHIFT_COUNTER = 'modifier_slark_essence_shift_debuff_counter';
const ESSENCE_SHIFT_DEBUFF = 'modifier_slark_essence_shift_debuff';
const ESSENCE_SHIFT_ICON = 'slark_essence_shift';
const MIN_BASE_ATTRIBUTE = 1;
const GAIN_POPUP_PARTICLE = 'particles/msg_fx/msg_gold.vpcf';

@registerAbility('special_bonus_unique_slark_permanent_essence_awaken')
export class SpecialBonusUniqueSlarkPermanentEssenceAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_slark_permanent_essence_awaken.name;
  }
}

/** 斯拉克 精华侵蚀觉醒：亲手击杀被能量转移偷过属性的英雄时，把偷取量按比例转成双方的永久基础属性变化。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_slark_permanent_essence_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_slark_permanent_essence_awaken extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return ESSENCE_SHIFT_ICON;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_DEATH, ModifierFunction.TOOLTIP, ModifierFunction.TOOLTIP2];
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const slark = this.GetParent() as CDOTA_BaseNPC_Hero;
    const victim = event.unit;
    if (
      !victim ||
      victim.IsNull() ||
      !victim.IsRealHero() ||
      victim.IsIllusion() ||
      victim.GetTeamNumber() === slark.GetTeamNumber() ||
      event.attacker !== slark ||
      slark.IsIllusion() ||
      slark.PassivesDisabled() ||
      victim.IsReincarnating()
    ) {
      return;
    }

    const ability = this.GetAbility();
    if (!ability || ability.IsNull() || ability.GetLevel() <= 0 || !ability.IsActivated()) return;

    const stolenAttributes = this.getEssenceShiftStatLoss(victim, slark);
    if (stolenAttributes <= 0) return;

    // 比例偏低时向下取整常得 0，保底 1 点才不会出现「杀了等于没杀」
    const amount = Math.max(1, Math.floor((stolenAttributes * this.getStealPct()) / 100));

    this.drainBaseAttributes(victim as CDOTA_BaseNPC_Hero, amount);
    this.gainBaseAttributes(slark, amount);
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  OnTooltip2(): number {
    return this.getStealPct();
  }

  private getStealPct(): number {
    const ability = this.GetAbility();
    return ability && !ability.IsNull() ? ability.GetSpecialValueFor('permanent_steal_pct') : 0;
  }

  private getEssenceShiftStatLoss(victim: CDOTA_BaseNPC, slark: CDOTA_BaseNPC): number {
    let statLoss = 0;
    for (const modifier of victim.FindAllModifiersByName(ESSENCE_SHIFT_COUNTER)) {
      if (modifier.IsNull() || !this.isModifierFromSlark(modifier, slark)) continue;
      statLoss = Math.max(statLoss, modifier.GetStackCount());
    }
    if (statLoss > 0) return statLoss;

    // 计数器缺失时回退到每层一个的原生实例
    for (const modifier of victim.FindAllModifiersByName(ESSENCE_SHIFT_DEBUFF)) {
      if (modifier.IsNull() || !this.isModifierFromSlark(modifier, slark)) continue;
      statLoss += Math.max(modifier.GetStackCount(), 1);
    }
    return statLoss;
  }

  private isModifierFromSlark(modifier: CDOTA_Buff, slark: CDOTA_BaseNPC): boolean {
    const slarkIndex = slark.GetEntityIndex();
    const caster = modifier.GetCaster();
    if (caster && !caster.IsNull() && caster.GetEntityIndex() === slarkIndex) return true;

    const sourceAbility = modifier.GetAbility();
    if (!sourceAbility || sourceAbility.IsNull()) return false;

    const abilityCaster = sourceAbility.GetCaster();
    return (
      !!abilityCaster && !abilityCaster.IsNull() && abilityCaster.GetEntityIndex() === slarkIndex
    );
  }

  private drainBaseAttributes(victim: CDOTA_BaseNPC_Hero, amount: number): void {
    const strength = this.drainableAmount(victim.GetBaseStrength(), amount);
    if (strength > 0) victim.ModifyStrength(-strength);

    const agility = this.drainableAmount(victim.GetBaseAgility(), amount);
    if (agility > 0) victim.ModifyAgility(-agility);

    const intellect = this.drainableAmount(victim.GetBaseIntellect(), amount);
    if (intellect > 0) victim.ModifyIntellect(-intellect);
  }

  private drainableAmount(baseAttribute: number, amount: number): number {
    return Math.max(0, Math.min(amount, baseAttribute - MIN_BASE_ATTRIBUTE));
  }

  private gainBaseAttributes(slark: CDOTA_BaseNPC_Hero, amount: number): void {
    slark.ModifyStrength(amount);
    slark.ModifyAgility(amount);
    slark.ModifyIntellect(amount);
    this.SetStackCount(this.GetStackCount() + amount);

    PopupNumbers(slark, GAIN_POPUP_PARTICLE, Vector(208, 0, 255), 2, amount, POPUP_SYMBOL_PRE_PLUS);
  }
}
