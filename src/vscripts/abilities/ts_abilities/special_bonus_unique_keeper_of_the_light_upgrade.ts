import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  calculateAwakenedIlluminateDamage,
  calculateFocusTotalDamagePct,
  calculateIlluminateMaxChannelTime,
  calculateIlluminateRadius,
  calculateIlluminateRange,
  clampFocusStacks,
  getFocusDuration,
  isEligibleFocusHit,
  isKeeperIlluminateSpecial,
  resolveFocusStacksForOverride,
  resolveSpellAmplificationForOverride,
  shouldCastIlluminateEnd,
} from './keeper-of-the-light-awaken-math';

const ILLUMINATE_ABILITY = 'keeper_of_the_light_illuminate';
const ILLUMINATE_END_ABILITY = 'keeper_of_the_light_illuminate_end';
const SPIRIT_FORM_ABILITY = 'keeper_of_the_light_spirit_form';
const CONTROLLER_MODIFIER = 'modifier_special_bonus_unique_keeper_of_the_light_upgrade';
const FOCUS_MODIFIER = 'modifier_special_bonus_unique_keeper_of_the_light_upgrade_focus';
const SPELL_AMP_SYNC_INTERVAL = 0.2;
const SPELL_AMP_SYNC_EPSILON = 0.0001;

interface SpellAmplificationTransmitterData {
  spellAmplification: number;
}

@registerAbility('special_bonus_unique_keeper_of_the_light_upgrade')
export class SpecialBonusUniqueKeeperOfTheLightUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return CONTROLLER_MODIFIER;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_keeper_of_the_light_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_keeper_of_the_light_upgrade extends BaseModifier {
  private castToken = 0;

  private isIlluminateCharging = false;

  private snapshotActive = false;

  private snapshotStacks = 0;

  private hitHeroEntityIndexes: EntityIndex[] = [];

  private transmittedSpellAmplification = 0;

  OnCreated(): void {
    if (!IsServer()) return;

    this.transmittedSpellAmplification = this.GetParent().GetSpellAmplification(false);
    this.SetHasCustomTransmitterData(true);
    this.StartIntervalThink(SPELL_AMP_SYNC_INTERVAL);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    this.syncSpellAmplificationToClients();
  }

  AddCustomTransmitterData(): SpellAmplificationTransmitterData {
    return { spellAmplification: this.transmittedSpellAmplification };
  }

  HandleCustomTransmitterData(data: SpellAmplificationTransmitterData): void {
    this.transmittedSpellAmplification = data.spellAmplification;
  }

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_ABILITY_START,
      ModifierFunction.ON_ABILITY_END_CHANNEL,
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.ON_DEATH,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL_VALUE,
    ];
  }

  OnAbilityStart(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent) return;

    const abilityName = event.ability.GetAbilityName();
    if (abilityName === ILLUMINATE_END_ABILITY) {
      this.isIlluminateCharging = false;
      return;
    }
    if (abilityName !== ILLUMINATE_ABILITY) return;

    this.castToken += 1;
    const currentToken = this.castToken;
    this.isIlluminateCharging = true;
    this.snapshotActive = true;
    this.snapshotStacks = this.getCurrentFocusStacks();
    this.hitHeroEntityIndexes = [];

    const maxChannelTime = calculateIlluminateMaxChannelTime(
      event.ability.GetLevelSpecialValueNoOverride(
        'max_channel_time',
        Math.max(0, event.ability.GetLevel() - 1),
      ),
      this.snapshotStacks,
      this.getUpgradeSpecialValue('channel_reduction_per_stack'),
    );
    const snapshotLingerDuration = this.getUpgradeSpecialValue('snapshot_linger_duration');

    Timers.CreateTimer(maxChannelTime, () => {
      if (this.IsNull() || currentToken !== this.castToken || !this.isIlluminateCharging) return;

      const caster = this.GetParent();
      if (caster.IsNull() || !caster.IsAlive()) return;

      const illuminateEnd = caster.FindAbilityByName(ILLUMINATE_END_ABILITY);
      const castIlluminateEnd = shouldCastIlluminateEnd(
        illuminateEnd !== undefined,
        illuminateEnd?.IsActivated() ?? false,
      );
      if (castIlluminateEnd && illuminateEnd) {
        caster.CastAbilityImmediately(illuminateEnd, caster.GetPlayerOwnerID());
      } else if (!event.ability.IsNull()) {
        event.ability.EndChannel(false);
      }
      this.isIlluminateCharging = false;
    });

    Timers.CreateTimer(maxChannelTime + snapshotLingerDuration, () => {
      if (this.IsNull() || currentToken !== this.castToken) return;
      this.snapshotActive = false;
    });
  }

  OnAbilityEndChannel(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    if (event.ability.GetAbilityName() !== ILLUMINATE_ABILITY) return;

    const parent = this.GetParent();
    const caster = event.ability.GetCaster();
    if (event.unit === parent || caster === parent) {
      this.isIlluminateCharging = false;
    }
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const inflictor = event.inflictor;
    if (!inflictor || inflictor.GetAbilityName() !== ILLUMINATE_ABILITY) return;

    const parent = this.GetParent();
    const attacker = event.attacker;
    const sourceBelongsToParent =
      inflictor.GetCaster() === parent ||
      attacker === parent ||
      attacker.GetOwnerEntity() === parent;
    if (!sourceBelongsToParent) return;

    const target = event.unit;
    const targetIndex = target.GetEntityIndex();
    const alreadyHit = this.hitHeroEntityIndexes.indexOf(targetIndex) !== -1;
    if (
      !isEligibleFocusHit({
        isEnemy: target.GetTeamNumber() !== parent.GetTeamNumber(),
        isRealHero: target.IsRealHero(),
        isIllusion: target.IsIllusion(),
        isClone: target.IsClone(),
        alreadyHit,
      })
    ) {
      return;
    }

    const spiritForm = parent.FindAbilityByName(SPIRIT_FORM_ABILITY);
    const spiritFormLevel = spiritForm?.GetLevel() ?? 0;
    const duration = getFocusDuration(spiritFormLevel, [
      this.getUpgradeSpecialValue('focus_duration_1'),
      this.getUpgradeSpecialValue('focus_duration_2'),
      this.getUpgradeSpecialValue('focus_duration_3'),
      this.getUpgradeSpecialValue('focus_duration_4'),
    ]);
    if (duration <= 0) return;

    this.hitHeroEntityIndexes.push(targetIndex);
    const upgradeAbility = this.GetAbility();
    if (!upgradeAbility) return;

    let focus = parent.FindModifierByName(FOCUS_MODIFIER) as
      | modifier_special_bonus_unique_keeper_of_the_light_upgrade_focus
      | undefined;
    if (!focus) {
      focus = parent.AddNewModifier(parent, upgradeAbility, FOCUS_MODIFIER, {
        duration,
      }) as modifier_special_bonus_unique_keeper_of_the_light_upgrade_focus | undefined;
    }
    if (!focus) return;

    const maxStacks = this.getUpgradeSpecialValue('max_focus_stacks');
    const nextStacks = Math.min(maxStacks, focus.GetStackCount() + 1);
    focus.SetStackCount(nextStacks);
    this.SetStackCount(nextStacks);
    focus.SetDuration(duration, true);
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (event.unit !== parent) return;

    parent.RemoveModifierByName(FOCUS_MODIFIER);
    this.castToken += 1;
    this.isIlluminateCharging = false;
    this.snapshotActive = false;
    this.snapshotStacks = 0;
    this.SetStackCount(0);
    this.hitHeroEntityIndexes = [];
  }

  GetModifierOverrideAbilitySpecial(event: ModifierOverrideAbilitySpecialEvent): 0 | 1 {
    return isKeeperIlluminateSpecial(event.ability.GetAbilityName(), event.ability_special_value)
      ? 1
      : 0;
  }

  GetModifierOverrideAbilitySpecialValue(event: ModifierOverrideAbilitySpecialEvent): number {
    const baseValue = event.ability.GetLevelSpecialValueNoOverride(
      event.ability_special_value,
      event.ability_special_level,
    );
    const stacks = this.getStacksForOverride();

    switch (event.ability_special_value) {
      case 'total_damage':
        return calculateAwakenedIlluminateDamage(
          baseValue,
          stacks,
          this.getUpgradeSpecialValue('base_damage_bonus'),
          this.getUpgradeSpecialValue('damage_pct_per_stack'),
          this.getSpellAmplificationForOverride(),
          this.getUpgradeSpecialValue('spell_amp_scaling_per_stack'),
          this.getUpgradeSpecialValue('spell_amp_scaling_cap'),
        );
      case 'max_channel_time':
        return calculateIlluminateMaxChannelTime(
          baseValue,
          stacks,
          this.getUpgradeSpecialValue('channel_reduction_per_stack'),
        );
      case 'range':
        return calculateIlluminateRange(
          baseValue,
          stacks,
          this.getUpgradeSpecialValue('range_per_stack'),
        );
      case 'radius':
        return calculateIlluminateRadius(
          baseValue,
          stacks,
          this.getUpgradeSpecialValue('radius_per_stack'),
        );
      default:
        return baseValue;
    }
  }

  private syncSpellAmplificationToClients(): void {
    const spellAmplification = this.GetParent().GetSpellAmplification(false);
    if (
      Math.abs(spellAmplification - this.transmittedSpellAmplification) <= SPELL_AMP_SYNC_EPSILON
    ) {
      return;
    }

    this.transmittedSpellAmplification = spellAmplification;
    this.SendBuffRefreshToClients();

    const focus = this.GetParent().FindModifierByName(FOCUS_MODIFIER) as
      | modifier_special_bonus_unique_keeper_of_the_light_upgrade_focus
      | undefined;
    focus?.SetTransmittedSpellAmplification(spellAmplification);
  }

  private getSpellAmplificationForOverride(): number {
    return resolveSpellAmplificationForOverride({
      isServer: IsServer(),
      serverSpellAmplification: IsServer()
        ? this.GetParent().GetSpellAmplification(false)
        : undefined,
      replicatedSpellAmplification: this.transmittedSpellAmplification,
    });
  }

  private getCurrentFocusStacks(): number {
    return clampFocusStacks(this.GetStackCount());
  }

  private getStacksForOverride(): number {
    return resolveFocusStacksForOverride({
      isServer: IsServer(),
      snapshotActive: this.snapshotActive,
      replicatedStacks: this.GetStackCount(),
      snapshotStacks: this.snapshotStacks,
    });
  }

  private getUpgradeSpecialValue(name: string): number {
    return this.GetAbility()?.GetSpecialValueFor(name) ?? 0;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_keeper_of_the_light_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_keeper_of_the_light_upgrade_focus extends BaseModifier {
  private transmittedSpellAmplification = 0;

  OnCreated(): void {
    if (!IsServer()) return;

    this.transmittedSpellAmplification = this.GetParent().GetSpellAmplification(false);
    this.SetHasCustomTransmitterData(true);
  }

  AddCustomTransmitterData(): SpellAmplificationTransmitterData {
    return { spellAmplification: this.transmittedSpellAmplification };
  }

  HandleCustomTransmitterData(data: SpellAmplificationTransmitterData): void {
    this.transmittedSpellAmplification = data.spellAmplification;
  }

  SetTransmittedSpellAmplification(spellAmplification: number): void {
    if (!IsServer()) return;
    if (
      Math.abs(spellAmplification - this.transmittedSpellAmplification) <= SPELL_AMP_SYNC_EPSILON
    ) {
      return;
    }

    this.transmittedSpellAmplification = spellAmplification;
    this.SendBuffRefreshToClients();
  }

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  IsBuff(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'keeper_of_the_light/kotl_ti7_immortal/keeper_of_the_light_illuminate_alt';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.TOOLTIP, ModifierFunction.TOOLTIP2];
  }

  OnTooltip(): number {
    const ability = this.GetAbility();
    if (!ability) return 0;

    return Math.round(
      calculateFocusTotalDamagePct(
        this.GetStackCount(),
        ability.GetSpecialValueFor('damage_pct_per_stack'),
        resolveSpellAmplificationForOverride({
          isServer: IsServer(),
          serverSpellAmplification: IsServer()
            ? this.GetParent().GetSpellAmplification(false)
            : undefined,
          replicatedSpellAmplification: this.transmittedSpellAmplification,
        }),
        ability.GetSpecialValueFor('spell_amp_scaling_per_stack'),
        ability.GetSpecialValueFor('spell_amp_scaling_cap'),
      ),
    );
  }

  OnTooltip2(): number {
    const ability = this.GetAbility();
    if (!ability) return 0;
    return this.GetStackCount() * ability.GetSpecialValueFor('channel_reduction_per_stack');
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    const controller = this.GetParent().FindModifierByName(CONTROLLER_MODIFIER);
    controller?.SetStackCount(0);
  }
}
