import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  calculateSlarkPermanentAttributeLoss,
  PERMANENT_ATTRIBUTE_LOSS_SCALE,
} from './slark-permanent-essence-awaken-math';

const ESSENCE_SHIFT_COUNTER = 'modifier_slark_essence_shift_debuff_counter';
const ESSENCE_SHIFT_DEBUFF = 'modifier_slark_essence_shift_debuff';
const ESSENCE_SHIFT_ICON = 'slark_essence_shift';
const PENDING_APPLY_INTERVAL = 0.5;

interface PermanentEssenceDebuff extends CDOTA_Modifier_Lua {
  AddPermanentLoss(loss: number): void;
}

interface PendingPermanentLoss {
  victim: CDOTA_BaseNPC_Hero;
  playerId: PlayerID;
  loss: number;
}

@registerAbility('special_bonus_unique_slark_permanent_essence_awaken')
export class SpecialBonusUniqueSlarkPermanentEssenceAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_slark_permanent_essence_awaken.name;
  }
}

/** Slark awakening: converts a directly killed hero's temporary Essence Shift loss into permanent loss. */
@registerModifier('abilities/ts_abilities/special_bonus_unique_slark_permanent_essence_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_slark_permanent_essence_awaken extends BaseModifier {
  private pendingPermanentLossByVictim: Record<number, PendingPermanentLoss> = {};

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
    return [
      ModifierFunction.ON_DEATH,
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.TOOLTIP,
    ];
  }

  OnCreated(): void {
    if (!IsServer()) return;

    this.pendingPermanentLossByVictim = {};
  }

  OnIntervalThink(): void {
    this.applyPendingPermanentLosses();
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
      victim.GetTeamNumber() === slark.GetTeamNumber()
    ) {
      return;
    }

    if (
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

    const permanentLoss = calculateSlarkPermanentAttributeLoss(
      stolenAttributes,
      ability.GetSpecialValueFor('base_loss_attribute_pct'),
      ability.GetSpecialValueFor('extra_loss_attribute_pct'),
    );
    if (permanentLoss <= 0) return;

    this.queuePermanentLoss(victim as CDOTA_BaseNPC_Hero, permanentLoss);
    this.addPermanentAllStats(slark, ability);
  }

  GetModifierBonusStats_Strength(): number {
    return this.GetStackCount();
  }

  GetModifierBonusStats_Agility(): number {
    return this.GetStackCount();
  }

  GetModifierBonusStats_Intellect(): number {
    return this.GetStackCount();
  }

  OnTooltip(): number {
    const ability = this.GetAbility();
    return ability && !ability.IsNull()
      ? ability.GetSpecialValueFor('permanent_all_stats_per_kill')
      : 0;
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

  private queuePermanentLoss(victim: CDOTA_BaseNPC_Hero, permanentLoss: number): void {
    const victimIndex = victim.GetEntityIndex();
    const existing = this.pendingPermanentLossByVictim[victimIndex];
    this.pendingPermanentLossByVictim[victimIndex] = {
      victim,
      playerId: victim.GetPlayerOwnerID(),
      loss: permanentLoss + (existing?.loss ?? 0),
    };
    // 只在有待处理项时开表，清空后立即停，避免空转
    this.StartIntervalThink(PENDING_APPLY_INTERVAL);
  }

  private applyPendingPermanentLosses(): void {
    const slark = this.GetParent() as CDOTA_BaseNPC_Hero;
    const ability = this.GetAbility();
    if (!ability || ability.IsNull() || slark.IsNull()) return;

    let remaining = 0;
    for (const victimIndex in this.pendingPermanentLossByVictim) {
      const pending = this.pendingPermanentLossByVictim[victimIndex];
      let victim: CDOTA_BaseNPC_Hero | undefined = pending.victim;
      if (victim.IsNull() && pending.playerId >= 0) {
        victim = PlayerResource.GetSelectedHeroEntity(pending.playerId);
      }
      if (!victim || victim.IsNull() || !victim.IsAlive()) {
        remaining++;
        continue;
      }

      if (!this.applyPermanentLoss(victim, slark, ability, pending.loss)) {
        remaining++;
        continue;
      }
      delete this.pendingPermanentLossByVictim[victimIndex];
    }

    if (remaining === 0) this.StartIntervalThink(-1);
  }

  private applyPermanentLoss(
    victim: CDOTA_BaseNPC,
    slark: CDOTA_BaseNPC,
    ability: CDOTABaseAbility,
    permanentLoss: number,
  ): boolean {
    const existing = victim.FindModifierByNameAndCaster(
      modifier_special_bonus_unique_slark_permanent_essence_awaken_debuff.name,
      slark,
    ) as PermanentEssenceDebuff | undefined;
    if (existing && !existing.IsNull()) {
      existing.AddPermanentLoss(permanentLoss);
      return true;
    }

    const created = victim.AddNewModifier(
      slark,
      ability,
      modifier_special_bonus_unique_slark_permanent_essence_awaken_debuff.name,
      { permanentLoss },
    );
    return !!created && !created.IsNull();
  }

  private addPermanentAllStats(slark: CDOTA_BaseNPC_Hero, ability: CDOTABaseAbility): void {
    const allStatsPerKill = ability.GetSpecialValueFor('permanent_all_stats_per_kill');
    if (allStatsPerKill <= 0) return;

    this.SetStackCount(this.GetStackCount() + allStatsPerKill);
    slark.CalculateStatBonus(true);
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_slark_permanent_essence_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_slark_permanent_essence_awaken_debuff extends BaseModifier {
  private permanentLoss = 0;

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.MULTIPLE;
  }

  GetTexture(): string {
    return ESSENCE_SHIFT_ICON;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.TOOLTIP,
    ];
  }

  OnCreated(kv: { permanentLoss?: number }): void {
    if (!IsServer()) return;

    this.permanentLoss = Math.max(kv.permanentLoss ?? 0, 0);
    this.SetHasCustomTransmitterData(true);
    this.SendBuffRefreshToClients();
    (this.GetParent() as CDOTA_BaseNPC_Hero).CalculateStatBonus(true);
  }

  AddCustomTransmitterData(): { permanentLoss: number } {
    return { permanentLoss: this.permanentLoss };
  }

  HandleCustomTransmitterData(data: { permanentLoss: number }): void {
    this.permanentLoss = data.permanentLoss;
  }

  AddPermanentLoss(loss: number): void {
    if (!IsServer() || loss <= 0) return;

    this.permanentLoss += loss;
    this.SendBuffRefreshToClients();
    (this.GetParent() as CDOTA_BaseNPC_Hero).CalculateStatBonus(true);
  }

  GetModifierBonusStats_Strength(): number {
    return -this.getPermanentLoss();
  }

  GetModifierBonusStats_Agility(): number {
    return -this.getPermanentLoss();
  }

  GetModifierBonusStats_Intellect(): number {
    return -this.getPermanentLoss();
  }

  OnTooltip(): number {
    return this.getPermanentLoss();
  }

  private getPermanentLoss(): number {
    return this.permanentLoss / PERMANENT_ATTRIBUTE_LOSS_SCALE;
  }
}
