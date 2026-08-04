import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { StormSpiritVortexTriggerCooldowns } from './storm_spirit_vortex_trigger_cooldown';

const BALL_LIGHTNING_ABILITY = 'storm_spirit_ball_lightning';
const ELECTRIC_VORTEX_ABILITY = 'storm_spirit_electric_vortex';
const BALL_LIGHTNING_MOVE_SPEED = 'ball_lightning_move_speed';
const ELECTRIC_VORTEX_DURATION = 'AbilityDuration';
const VORTEX_TRIGGER_COOLDOWN = 'vortex_trigger_cooldown';

/** Storm Spirit awakening. */
@registerAbility('special_bonus_unique_storm_spirit_upgrade')
export class SpecialBonusUniqueStormSpiritUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_storm_spirit_upgrade.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_storm_spirit_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_storm_spirit_upgrade extends BaseModifier {
  private resolvingVortex = false;
  private shortenVortexDuration = false;
  private readonly vortexTriggerCooldowns = new StormSpiritVortexTriggerCooldowns();

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
    return BALL_LIGHTNING_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL_VALUE,
    ];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer() || this.resolvingVortex) return;

    const stormSpirit = this.GetParent();
    const awaken = this.GetAbility();
    const target = event.unit;
    const inflictor = event.inflictor;
    if (
      !awaken ||
      awaken.IsNull() ||
      awaken.GetLevel() <= 0 ||
      !awaken.IsActivated() ||
      stormSpirit.PassivesDisabled() ||
      !stormSpirit.IsRealHero() ||
      stormSpirit.IsIllusion() ||
      event.attacker !== stormSpirit ||
      event.damage <= 0 ||
      !inflictor ||
      inflictor.IsNull() ||
      inflictor.GetAbilityName() !== BALL_LIGHTNING_ABILITY ||
      !target ||
      target.IsNull() ||
      !target.IsAlive() ||
      target.GetTeamNumber() === stormSpirit.GetTeamNumber()
    ) {
      return;
    }

    const vortex = stormSpirit.FindAbilityByName(ELECTRIC_VORTEX_ABILITY);
    if (!vortex || vortex.IsNull() || vortex.GetLevel() <= 0) return;

    const triggerCooldown = awaken.GetSpecialValueFor(VORTEX_TRIGGER_COOLDOWN);
    if (
      triggerCooldown <= 0 ||
      !this.vortexTriggerCooldowns.tryAcquire(
        target.GetEntityIndex(),
        GameRules.GetGameTime(),
        triggerCooldown,
      )
    ) {
      return;
    }

    const previousCursorPosition = stormSpirit.GetCursorPosition();
    stormSpirit.SetCursorCastTarget(target);
    stormSpirit.SetCursorPosition(target.GetAbsOrigin());
    this.resolvingVortex = true;
    this.shortenVortexDuration = true;
    vortex.OnSpellStart();
    this.shortenVortexDuration = false;
    this.resolvingVortex = false;
    stormSpirit.SetCursorCastTarget(undefined);
    stormSpirit.SetCursorPosition(previousCursorPosition);
  }

  OnDestroy(): void {
    this.vortexTriggerCooldowns.clear();
  }

  GetModifierOverrideAbilitySpecial(event: ModifierOverrideAbilitySpecialEvent): 0 | 1 {
    if (!IsServer()) return 0;

    return this.shouldShortenVortex(event) || this.shouldAccelerateBallLightning(event) ? 1 : 0;
  }

  GetModifierOverrideAbilitySpecialValue(event: ModifierOverrideAbilitySpecialEvent): number {
    const baseValue = event.ability.GetLevelSpecialValueNoOverride(
      event.ability_special_value,
      event.ability_special_level,
    );

    const awaken = this.GetAbility();
    if (!awaken || awaken.IsNull()) return baseValue;

    if (this.shouldShortenVortex(event)) {
      return baseValue * awaken.GetSpecialValueFor('vortex_duration_multiplier');
    }

    if (this.shouldAccelerateBallLightning(event)) {
      return baseValue * awaken.GetSpecialValueFor('multicast_move_speed_multiplier');
    }

    return baseValue;
  }

  private shouldShortenVortex(event: ModifierOverrideAbilitySpecialEvent): boolean {
    return (
      this.shortenVortexDuration &&
      event.ability.GetAbilityName() === ELECTRIC_VORTEX_ABILITY &&
      event.ability_special_value === ELECTRIC_VORTEX_DURATION
    );
  }

  private shouldAccelerateBallLightning(event: ModifierOverrideAbilitySpecialEvent): boolean {
    if (!IsServer()) return false;

    const ability = event.ability;
    if (
      ability.GetAbilityName() !== BALL_LIGHTNING_ABILITY ||
      event.ability_special_value !== BALL_LIGHTNING_MOVE_SPEED
    ) {
      return false;
    }

    const multicast = (ability as unknown as { multicast?: number }).multicast;
    const awaken = this.GetAbility();
    return (
      multicast !== undefined &&
      multicast > 1 &&
      awaken !== undefined &&
      !awaken.IsNull() &&
      awaken.GetLevel() > 0 &&
      awaken.IsActivated() &&
      !this.GetParent().PassivesDisabled()
    );
  }
}
