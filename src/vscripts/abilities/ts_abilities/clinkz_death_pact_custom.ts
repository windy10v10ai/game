import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { calculateDeathPactBonus, canConsumeDeathPactCreep } from './clinkz-death-pact-logic';

const DEATH_PACT_TEXTURE = 'clinkz_death_pact';
const AWAKENING = 'special_bonus_unique_clinkz_death_pact_awaken';
const SKELETON_ARCHER = 'npc_dota_clinkz_skeleton_archer';

@registerAbility('clinkz_death_pact')
export class ClinkzDeathPactCustom extends BaseAbility {
  CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
    const team = this.GetCaster().GetTeamNumber();
    const friendly = target.GetTeamNumber() === team;
    if (friendly && target.GetUnitName() !== SKELETON_ARCHER) {
      return UnitFilterResult.FAIL_FRIENDLY;
    }

    if (target.IsOutOfGame()) return UnitFilterResult.FAIL_OUT_OF_WORLD;
    if (target.IsInvulnerable()) return UnitFilterResult.FAIL_INVULNERABLE;
    if (target.IsHero()) return UnitFilterResult.FAIL_HERO;
    if (target.IsIllusion()) return UnitFilterResult.FAIL_ILLUSION;
    if (target.IsBuilding()) return UnitFilterResult.FAIL_BUILDING;
    if (target.IsBoss()) return UnitFilterResult.FAIL_OTHER;

    const canTargetAncient = this.GetSpecialValueFor('can_target_ancient') > 0;
    if (target.IsAncient() && !canTargetAncient) return UnitFilterResult.FAIL_ANCIENT;

    if (!IsServer()) {
      if (friendly || target.IsAncient()) return UnitFilterResult.SUCCESS;
      return UnitFilter(
        target,
        UnitTargetTeam.ENEMY,
        UnitTargetType.CREEP,
        UnitTargetFlags.NOT_CREEP_HERO + UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
        team,
      );
    }

    if (!target.IsAlive()) return UnitFilterResult.FAIL_DEAD;
    if (friendly) return UnitFilterResult.SUCCESS;
    if (target.IsCreepHero()) return UnitFilterResult.FAIL_CONSIDERED_HERO;
    if (target.IsBossCreature() || target.IsWard() || target.IsCourier()) {
      return UnitFilterResult.FAIL_OTHER;
    }

    if (!target.IsCreep() && !target.IsNeutralUnitType()) return UnitFilterResult.FAIL_CREEP;

    if (
      !canConsumeDeathPactCreep(target, this.GetSpecialValueFor('creep_level'), canTargetAncient)
    ) {
      return target.IsAncient() ? UnitFilterResult.FAIL_ANCIENT : UnitFilterResult.FAIL_CUSTOM;
    }
    return UnitFilterResult.SUCCESS;
  }

  GetCustomCastErrorTarget(): string {
    return '#dota_hud_error_clinkz_death_pact_creep_level';
  }

  OnSpellStart(): void {
    const target = this.GetCursorTarget();
    if (
      !target ||
      target.IsNull() ||
      this.CastFilterResultTarget(target) !== UnitFilterResult.SUCCESS
    ) {
      return;
    }

    const caster = this.GetCaster();
    const awaken = caster.FindAbilityByName(AWAKENING);
    const fixedHealth = this.GetSpecialValueFor('health_gain');
    const bonus =
      awaken && awaken.GetLevel() > 0
        ? calculateDeathPactBonus(
            target,
            awaken.GetSpecialValueFor('health_gain_pct'),
            awaken.GetSpecialValueFor('damage_gain_pct'),
            this.GetSpecialValueFor('awakening_talent_health'),
          )
        : { health: fixedHealth, damage: 0 };

    target.Kill(this, caster);
    if (!target.IsNull() && target.IsAlive()) return;

    const currentHealth = caster.GetHealth();
    caster.AddNewModifier(caster, this, modifier_clinkz_death_pact_custom.name, {
      duration: this.GetSpecialValueFor('duration'),
      health: bonus.health,
      damage: bonus.damage,
    });
    if (caster.IsRealHero()) caster.CalculateStatBonus(true);
    // Stat recalculation can rescale current health before the heal is applied.
    caster.SetHealth(math.min(caster.GetMaxHealth(), currentHealth));
    caster.Heal(bonus.health, this);
  }
}

type DeathPactBonus = { health: number; damage: number };

@registerModifier('abilities/ts_abilities/clinkz_death_pact_custom')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_clinkz_death_pact_custom extends BaseModifier {
  private health = 0;
  private damage = 0;

  GetTexture(): string {
    return DEATH_PACT_TEXTURE;
  }

  IsPurgable(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return false;
  }

  OnCreated(data: Partial<DeathPactBonus>): void {
    if (!IsServer()) return;
    this.health = data.health ?? 0;
    this.damage = data.damage ?? 0;
    this.SetHasCustomTransmitterData(true);
  }

  OnRefresh(data: Partial<DeathPactBonus>): void {
    if (!IsServer()) return;
    this.health = data.health ?? 0;
    this.damage = data.damage ?? 0;
    this.SendBuffRefreshToClients();
  }

  AddCustomTransmitterData(): DeathPactBonus {
    return { health: this.health, damage: this.damage };
  }

  HandleCustomTransmitterData(data: DeathPactBonus): void {
    this.health = data.health;
    this.damage = data.damage;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.EXTRA_HEALTH_BONUS, ModifierFunction.PREATTACK_BONUS_DAMAGE];
  }

  GetModifierExtraHealthBonus(): number {
    return this.health;
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.damage;
  }
}
