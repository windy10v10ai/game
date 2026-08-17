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
const SNAPSHOT_INTERVAL = 0.1;

interface PermanentEssenceDebuff extends CDOTA_Modifier_Lua {
  AddPermanentLoss(loss: number): void;
}

interface EssenceShiftSnapshot {
  statLoss: number;
  expiresAt: number;
  snapshotAt: number;
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
  private cachedStatLossByVictim: Record<number, EssenceShiftSnapshot> = {};
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

    this.cachedStatLossByVictim = {};
    this.pendingPermanentLossByVictim = {};
    this.snapshotEnemyHeroes();
    this.StartIntervalThink(SNAPSHOT_INTERVAL);
  }

  OnRefresh(): void {
    if (!IsServer()) return;
    this.snapshotEnemyHeroes();
  }

  OnIntervalThink(): void {
    this.snapshotEnemyHeroes();
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

    const victimIndex = victim.GetEntityIndex();
    const currentStatLoss = this.getEssenceShiftSnapshot(victim, slark).statLoss;
    const cachedSnapshot = this.cachedStatLossByVictim[victimIndex];
    const gameTime = GameRules.GetGameTime();
    const cachedStatLoss =
      cachedSnapshot &&
      (cachedSnapshot.expiresAt >= gameTime ||
        (cachedSnapshot.expiresAt < 0 &&
          cachedSnapshot.snapshotAt + SNAPSHOT_INTERVAL * 2 >= gameTime))
        ? cachedSnapshot.statLoss
        : 0;
    delete this.cachedStatLossByVictim[victimIndex];

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

    // Prefer the live native counter so independently expiring stacks are not over-counted.
    // The snapshot is only a fallback when death cleanup has already removed the counter.
    const stolenAttributes = currentStatLoss > 0 ? currentStatLoss : cachedStatLoss;
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

  private snapshotEnemyHeroes(): void {
    if (!IsServer()) return;

    const slark = this.GetParent() as CDOTA_BaseNPC_Hero;
    if (slark.IsNull()) return;

    for (const hero of HeroList.GetAllHeroes()) {
      if (
        hero.IsNull() ||
        !hero.IsAlive() ||
        !hero.IsRealHero() ||
        hero.IsIllusion() ||
        hero.GetTeamNumber() === slark.GetTeamNumber()
      ) {
        continue;
      }

      const snapshot = this.getEssenceShiftSnapshot(hero, slark);
      const heroIndex = hero.GetEntityIndex();
      if (snapshot.statLoss > 0) {
        this.cachedStatLossByVictim[heroIndex] = snapshot;
      } else {
        delete this.cachedStatLossByVictim[heroIndex];
      }
    }
  }

  private getEssenceShiftSnapshot(
    victim: CDOTA_BaseNPC,
    slark: CDOTA_BaseNPC,
  ): EssenceShiftSnapshot {
    let statLoss = 0;
    let expiresAt = 0;
    const snapshotAt = GameRules.GetGameTime();
    const counters = victim.FindAllModifiersByName(ESSENCE_SHIFT_COUNTER);
    const mayUseUnattributedCounter = counters.length === 1 && this.isOnlyRealSlark(slark);

    for (const modifier of counters) {
      if (
        modifier.IsNull() ||
        (!mayUseUnattributedCounter && !this.isModifierFromSlark(modifier, slark))
      ) {
        continue;
      }

      const modifierStatLoss = modifier.GetStackCount();
      if (modifierStatLoss < statLoss) continue;

      statLoss = modifierStatLoss;
      expiresAt = this.getModifierExpiry(modifier, snapshotAt);
    }

    if (statLoss > 0) return { statLoss, expiresAt, snapshotAt };

    // Native Essence Shift also creates one debuff instance per stolen attribute.
    // Use those source-attributed instances when the UI counter is absent or unattributed.
    for (const modifier of victim.FindAllModifiersByName(ESSENCE_SHIFT_DEBUFF)) {
      if (modifier.IsNull() || !this.isModifierFromSlark(modifier, slark)) continue;

      statLoss += Math.max(modifier.GetStackCount(), 1);
      const modifierExpiry = this.getModifierExpiry(modifier, snapshotAt);
      expiresAt = modifierExpiry < 0 ? -1 : Math.max(expiresAt, modifierExpiry);
    }
    return { statLoss, expiresAt, snapshotAt };
  }

  private isOnlyRealSlark(slark: CDOTA_BaseNPC): boolean {
    let slarkCount = 0;
    for (const hero of HeroList.GetAllHeroes()) {
      if (hero.IsRealHero() && !hero.IsIllusion() && hero.GetUnitName() === slark.GetUnitName()) {
        slarkCount++;
        if (slarkCount > 1) return false;
      }
    }
    return slarkCount === 1;
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

  private getModifierExpiry(modifier: CDOTA_Buff, snapshotAt: number): number {
    const remainingTime = modifier.GetRemainingTime();
    return remainingTime < 0 ? -1 : snapshotAt + remainingTime;
  }

  private queuePermanentLoss(victim: CDOTA_BaseNPC_Hero, permanentLoss: number): void {
    const victimIndex = victim.GetEntityIndex();
    const existing = this.pendingPermanentLossByVictim[victimIndex];
    this.pendingPermanentLossByVictim[victimIndex] = {
      victim,
      playerId: victim.GetPlayerOwnerID(),
      loss: permanentLoss + (existing?.loss ?? 0),
    };
  }

  private applyPendingPermanentLosses(): void {
    const slark = this.GetParent() as CDOTA_BaseNPC_Hero;
    const ability = this.GetAbility();
    if (!ability || ability.IsNull() || slark.IsNull()) return;

    for (const victimIndex in this.pendingPermanentLossByVictim) {
      const pending = this.pendingPermanentLossByVictim[victimIndex];
      let victim: CDOTA_BaseNPC_Hero | undefined = pending.victim;
      if (victim.IsNull() && pending.playerId >= 0) {
        victim = PlayerResource.GetSelectedHeroEntity(pending.playerId);
      }
      if (!victim || victim.IsNull() || !victim.IsAlive()) continue;

      if (this.applyPermanentLoss(victim, slark, ability, pending.loss)) {
        delete this.pendingPermanentLossByVictim[victimIndex];
      }
    }
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
