import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

interface AftershockCenter {
  entityIndex: EntityIndex;
  position: Vector;
}

const EARTHSHAKER_HERO = 'npc_dota_hero_earthshaker';
const ORIGINAL_AFTERSHOCK = 'earthshaker_aftershock';
const AWAKEN_MODIFIER = 'modifier_special_bonus_unique_earthshaker_upgrade';
const AFTERSHOCK_PARTICLE = 'particles/units/heroes/hero_earthshaker/earthshaker_aftershock.vpcf';

@registerAbility('special_bonus_unique_earthshaker_upgrade')
export class SpecialBonusUniqueEarthshakerUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return AWAKEN_MODIFIER;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_earthshaker_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_earthshaker_upgrade extends BaseModifier {
  private pendingCenters: AftershockCenter[] = [];
  private flushScheduled = false;

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
    return ORIGINAL_AFTERSHOCK;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_TAKEDAMAGE];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const earthshaker = this.GetParent() as CDOTA_BaseNPC_Hero;
    if (event.attacker !== earthshaker || event.damage <= 0) return;

    const inflictor = event.inflictor;
    if (!inflictor || inflictor.IsNull() || inflictor.GetAbilityName() !== ORIGINAL_AFTERSHOCK) {
      return;
    }

    const awaken = this.GetAbility();
    const target = event.unit;
    if (
      earthshaker.GetUnitName() !== EARTHSHAKER_HERO ||
      !earthshaker.IsRealHero() ||
      earthshaker.IsIllusion() ||
      !awaken ||
      awaken.IsNull() ||
      awaken.GetLevel() <= 0 ||
      !awaken.IsActivated() ||
      !target ||
      target.IsNull()
    ) {
      return;
    }

    const entityIndex = target.GetEntityIndex();
    if (this.pendingCenters.some((center) => center.entityIndex === entityIndex)) return;

    const origin = target.GetAbsOrigin();
    this.pendingCenters.push({
      entityIndex,
      position: Vector(origin.x, origin.y, origin.z),
    });

    if (this.flushScheduled) return;
    this.flushScheduled = true;
    Timers.CreateTimer(0, () => this.flushPendingCenters());
  }

  private flushPendingCenters(): void {
    if (this.IsNull()) return;

    const centers = this.pendingCenters;
    this.pendingCenters = [];
    this.flushScheduled = false;
    if (centers.length === 0) return;

    const earthshaker = this.GetParent() as CDOTA_BaseNPC_Hero;
    const awaken = this.GetAbility();
    const aftershock = earthshaker.FindAbilityByName(ORIGINAL_AFTERSHOCK);
    if (
      earthshaker.IsNull() ||
      !awaken ||
      awaken.IsNull() ||
      awaken.GetLevel() <= 0 ||
      !awaken.IsActivated() ||
      !aftershock ||
      aftershock.IsNull() ||
      aftershock.GetLevel() <= 0
    ) {
      return;
    }

    const damage =
      (aftershock.GetSpecialValueFor('aftershock_damage') *
        awaken.GetSpecialValueFor('small_aftershock_damage_pct')) /
      100;
    const radius =
      (aftershock.GetSpecialValueFor('aftershock_range') *
        awaken.GetSpecialValueFor('small_aftershock_radius_pct')) /
      100;
    const baseStunDuration =
      (aftershock.GetDuration() * awaken.GetSpecialValueFor('small_aftershock_stun_pct')) / 100;
    if (radius <= 0 || (damage <= 0 && baseStunDuration <= 0)) return;

    const stunnedTargets: EntityIndex[] = [];
    for (const center of centers) {
      this.createAftershockParticle(center.position);

      const enemies = FindUnitsInRadius(
        earthshaker.GetTeamNumber(),
        center.position,
        undefined,
        radius,
        UnitTargetTeam.ENEMY,
        UnitTargetType.HERO | UnitTargetType.BASIC,
        UnitTargetFlags.NONE,
        FindOrder.ANY,
        false,
      );

      for (const enemy of enemies) {
        if (damage > 0) {
          ApplyDamage({
            victim: enemy,
            attacker: earthshaker,
            damage,
            damage_type: aftershock.GetAbilityDamageType(),
            ability: awaken,
          });
        }

        const enemyIndex = enemy.GetEntityIndex();
        if (!enemy.IsAlive() || stunnedTargets.indexOf(enemyIndex) !== -1) continue;

        const stunDuration = baseStunDuration * (1 - enemy.GetStatusResistance());
        if (stunDuration <= 0) continue;

        enemy.AddNewModifier(earthshaker, awaken, 'modifier_stunned', { duration: stunDuration });
        stunnedTargets.push(enemyIndex);
      }
    }
  }

  private createAftershockParticle(position: Vector): void {
    const particle = ParticleManager.CreateParticle(
      AFTERSHOCK_PARTICLE,
      ParticleAttachment.WORLDORIGIN,
      undefined,
    );
    ParticleManager.SetParticleControl(particle, 0, position);
    ParticleManager.ReleaseParticleIndex(particle);
  }
}
