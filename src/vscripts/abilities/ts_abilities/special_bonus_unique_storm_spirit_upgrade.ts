import { ModifierEventHub } from '../../modules/modifier-event/modifier-event-hub';
import { calculateStatusResistedDuration } from '../../utils/damage-calculation';
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { StormSpiritVortexTriggerCooldowns } from './storm_spirit_vortex_trigger_cooldown';

const BALL_LIGHTNING_ABILITY = 'storm_spirit_ball_lightning';
const ELECTRIC_VORTEX_ABILITY = 'storm_spirit_electric_vortex';
const VORTEX_PULL_MODIFIER = 'modifier_storm_spirit_electric_vortex_pull';

/** 蓝猫 觉醒 */
@registerAbility('special_bonus_unique_storm_spirit_upgrade')
export class SpecialBonusUniqueStormSpiritUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_storm_spirit_upgrade.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_storm_spirit_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_storm_spirit_upgrade extends BaseModifier {
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

  OnCreated(): void {
    if (!IsServer()) return;
    ModifierEventHub.RegisterDamageByAttacker(this.GetParent(), this, (event) =>
      this.OnParentDealDamage(event),
    );
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    ModifierEventHub.UnregisterDamageByAttacker(this.GetParent(), this);
    this.vortexTriggerCooldowns.clear();
  }

  private OnParentDealDamage(event: ModifierInstanceEvent): void {
    const stormSpirit = this.GetParent();
    const awaken = this.GetAbility();
    const target = event.unit;
    const inflictor = event.inflictor;
    if (
      !awaken ||
      awaken.IsNull() ||
      stormSpirit.PassivesDisabled() ||
      !stormSpirit.IsRealHero() ||
      !inflictor ||
      inflictor.IsNull() ||
      inflictor.GetAbilityName() !== BALL_LIGHTNING_ABILITY ||
      !target ||
      target.IsNull() ||
      !target.IsAlive() ||
      !target.IsRealHero() ||
      target.GetTeamNumber() === stormSpirit.GetTeamNumber() ||
      target.IsDebuffImmune()
    ) {
      return;
    }

    const vortex = stormSpirit.FindAbilityByName(ELECTRIC_VORTEX_ABILITY);
    if (!vortex || vortex.IsNull() || vortex.GetLevel() <= 0) return;

    const triggerCooldown = awaken.GetSpecialValueFor('vortex_trigger_cooldown');
    if (
      !this.vortexTriggerCooldowns.tryAcquire(
        target.GetEntityIndex(),
        GameRules.GetGameTime(),
        triggerCooldown,
      )
    ) {
      return;
    }

    const duration = calculateStatusResistedDuration(
      vortex.GetSpecialValueFor('AbilityDuration') *
        awaken.GetSpecialValueFor('vortex_duration_multiplier'),
      target,
    );
    target.AddNewModifier(stormSpirit, vortex, VORTEX_PULL_MODIFIER, { duration });
  }
}
