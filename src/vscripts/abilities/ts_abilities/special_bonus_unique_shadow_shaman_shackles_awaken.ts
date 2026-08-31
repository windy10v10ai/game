import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const ETHER_SHOCK_ABILITY = 'shadow_shaman_ether_shock';
const SHACKLE_PARTICLE = 'particles/units/heroes/hero_shadowshaman/shadowshaman_shackle.vpcf';
const ETHER_SHOCK_PARTICLE =
  'particles/units/heroes/hero_shadowshaman/shadowshaman_ether_shock.vpcf';
const SHACKLE_SOUND = 'Hero_ShadowShaman.Shackles';
const DAMAGE_TICK_INTERVAL = 0.1;

interface ShackledTarget {
  unit: CDOTA_BaseNPC;
  modifier: CDOTA_Buff;
  particle: ParticleID;
  damagePerSecond: number;
  lastDamageTime: number;
  endTime: number;
}

@registerAbility('special_bonus_unique_shadow_shaman_shackles_awaken')
export class SpecialBonusUniqueShadowShamanShacklesAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_shadow_shaman_shackles_awaken_status.name;
  }

  GetAOERadius(): number {
    return this.GetSpecialValueFor('radius');
  }

  OnSpellStart(): void {
    if (!IsServer()) return;

    const caster = this.GetCaster();
    if (!caster.IsRealHero() || caster.IsIllusion()) return;

    const castPosition = this.GetCursorPosition();
    const targets = FindUnitsInRadius(
      caster.GetTeamNumber(),
      castPosition,
      undefined,
      this.GetSpecialValueFor('radius'),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );
    const validTargets = targets.filter((target) => !target.IsMagicImmune());
    if (validTargets.length === 0) return;

    const duration = this.GetSpecialValueFor('channel_time');
    if (duration <= 0) return;

    const illusions = CreateIllusions(
      caster as CDOTA_BaseNPC_Hero,
      caster as CDOTA_BaseNPC_Hero,
      {
        outgoing_damage: 0,
        incoming_damage: 0,
        bounty_base: 0,
        bounty_growth: 0,
        outgoing_damage_structure: 0,
        outgoing_damage_roshan: 0,
      },
      1,
      0,
      false,
      false,
    );
    const proxy = illusions[0];
    if (!proxy || proxy.IsNull()) return;

    const casterPosition = caster.GetAbsOrigin();
    proxy.SetAbsOrigin(casterPosition);
    proxy.SetIdleAcquire(false);
    proxy.SetAcquisitionRange(0);
    this.facePosition(proxy, castPosition);

    proxy.AddNewModifier(caster, this, 'modifier_kill', { duration: duration + 0.2 });
    const controller = proxy.AddNewModifier(
      caster,
      this,
      modifier_special_bonus_unique_shadow_shaman_shackles_awaken_proxy.name,
      { duration },
    ) as modifier_special_bonus_unique_shadow_shaman_shackles_awaken_proxy | undefined;
    if (!controller || controller.IsNull()) {
      UTIL_Remove(proxy);
      return;
    }

    controller.InitializeTargets(validTargets, duration, this.GetSpecialValueFor('total_damage'));
  }

  private facePosition(proxy: CDOTA_BaseNPC_Hero, position: Vector): void {
    const origin = proxy.GetAbsOrigin();
    const x = position.x - origin.x;
    const y = position.y - origin.y;
    const length = Math.sqrt(x * x + y * y);
    if (length <= 0) return;

    proxy.SetForwardVector(Vector(x / length, y / length, 0));
  }
}

/** 暗影萨满 枷锁替身觉醒。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_shadow_shaman_shackles_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_shadow_shaman_shackles_awaken_proxy extends BaseModifier {
  private targets: ShackledTarget[] = [];
  private nextScepterShockTime?: number;

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.ROOTED]: true,
      [ModifierState.DISARMED]: true,
      [ModifierState.SILENCED]: true,
      [ModifierState.MUTED]: true,
      [ModifierState.PASSIVES_DISABLED]: true,
      [ModifierState.COMMAND_RESTRICTED]: true,
      [ModifierState.INVULNERABLE]: true,
      [ModifierState.UNSELECTABLE]: true,
      [ModifierState.NO_HEALTH_BAR]: true,
      [ModifierState.NO_UNIT_COLLISION]: true,
      [ModifierState.NOT_ON_MINIMAP]: true,
    };
  }

  InitializeTargets(units: CDOTA_BaseNPC[], baseDuration: number, totalDamage: number): void {
    if (!IsServer()) return;

    const caster = this.GetCaster();
    const ability = this.GetAbility();
    if (!caster || !ability || caster.IsNull() || ability.IsNull()) return;

    const now = GameRules.GetGameTime();
    const damagePerSecond = totalDamage / baseDuration;
    for (const unit of units) {
      const effectiveDuration = baseDuration * (1 - unit.GetStatusResistance());
      if (effectiveDuration <= 0) continue;

      const modifier = unit.AddNewModifier(
        caster,
        ability,
        modifier_special_bonus_unique_shadow_shaman_shackles_awaken_debuff.name,
        { duration: effectiveDuration },
      );
      if (!modifier || modifier.IsNull()) continue;

      this.targets.push({
        unit,
        modifier,
        particle: this.createShackleParticle(unit),
        damagePerSecond,
        lastDamageTime: now,
        endTime: now + effectiveDuration,
      });
    }

    if (this.targets.length === 0) {
      UTIL_Remove(this.GetParent());
      return;
    }

    const shockInterval = ability.GetSpecialValueFor('scepter_shock_interval');
    if (shockInterval > 0) this.nextScepterShockTime = now + shockInterval;

    const proxy = this.GetParent();
    proxy.StartGesture(GameActivity.DOTA_CHANNEL_ABILITY_3);
    proxy.EmitSound(SHACKLE_SOUND);
    this.StartIntervalThink(DAMAGE_TICK_INTERVAL);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const caster = this.GetCaster();
    const ability = this.GetAbility();
    if (!caster || caster.IsNull() || !ability || ability.IsNull()) {
      this.Destroy();
      return;
    }

    const now = GameRules.GetGameTime();
    const activeTargets: ShackledTarget[] = [];
    for (const target of this.targets) {
      if (target.unit.IsNull() || !target.unit.IsAlive() || target.modifier.IsNull()) {
        this.destroyShackleParticle(target.particle);
        continue;
      }

      const damageEndTime = Math.min(now, target.endTime);
      const elapsed = Math.max(0, damageEndTime - target.lastDamageTime);
      if (elapsed > 0) {
        ApplyDamage({
          victim: target.unit,
          attacker: caster,
          damage: target.damagePerSecond * elapsed,
          damage_type: DamageTypes.MAGICAL,
          ability,
        });
        target.lastDamageTime = damageEndTime;
      }

      if (now >= target.endTime) {
        if (!target.modifier.IsNull()) target.modifier.Destroy();
        this.destroyShackleParticle(target.particle);
        continue;
      }
      activeTargets.push(target);
    }
    this.targets = activeTargets;

    if (this.targets.length === 0) {
      this.Destroy();
      return;
    }

    this.tryEmitScepterShocks(now);
  }

  OnDestroy(): void {
    if (!IsServer()) return;

    const proxy = this.GetParent();
    proxy.FadeGesture(GameActivity.DOTA_CHANNEL_ABILITY_3);
    StopSoundOn(SHACKLE_SOUND, proxy);

    for (const target of this.targets) {
      if (!target.modifier.IsNull()) target.modifier.Destroy();
      this.destroyShackleParticle(target.particle);
    }
    this.targets = [];
  }

  private createShackleParticle(target: CDOTA_BaseNPC): ParticleID {
    const proxy = this.GetParent();
    const particle = ParticleManager.CreateParticle(
      SHACKLE_PARTICLE,
      ParticleAttachment.CUSTOMORIGIN_FOLLOW,
      proxy,
    );
    ParticleManager.SetParticleControlEnt(
      particle,
      0,
      proxy,
      ParticleAttachment.POINT_FOLLOW,
      'attach_attack1',
      proxy.GetAbsOrigin(),
      true,
    );
    ParticleManager.SetParticleControlEnt(
      particle,
      1,
      target,
      ParticleAttachment.POINT_FOLLOW,
      'attach_hitloc',
      target.GetAbsOrigin(),
      true,
    );
    ParticleManager.SetParticleControlEnt(
      particle,
      5,
      proxy,
      ParticleAttachment.POINT_FOLLOW,
      'attach_attack2',
      proxy.GetAbsOrigin(),
      true,
    );
    ParticleManager.SetParticleControlEnt(
      particle,
      6,
      target,
      ParticleAttachment.POINT_FOLLOW,
      'attach_hitloc',
      target.GetAbsOrigin(),
      true,
    );
    return particle;
  }

  private destroyShackleParticle(particle: ParticleID): void {
    ParticleManager.DestroyParticle(particle, false);
    ParticleManager.ReleaseParticleIndex(particle);
  }

  private tryEmitScepterShocks(now: number): void {
    if (this.nextScepterShockTime === undefined || now < this.nextScepterShockTime) return;

    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    const shockInterval = ability.GetSpecialValueFor('scepter_shock_interval');
    if (shockInterval <= 0) {
      this.nextScepterShockTime = undefined;
      return;
    }
    this.nextScepterShockTime = now + shockInterval;

    const caster = this.GetCaster();
    if (!caster || caster.IsNull()) return;
    const etherShock = caster.FindAbilityByName(ETHER_SHOCK_ABILITY);
    if (!etherShock || etherShock.IsNull() || etherShock.GetLevel() <= 0) return;

    const damage =
      etherShock.GetSpecialValueFor('damage') *
      (ability.GetSpecialValueFor('scepter_shock_pct') / 100);
    const radius = ability.GetSpecialValueFor('scepter_shock_radius');
    if (damage <= 0 || radius <= 0) return;

    for (const source of this.targets) {
      if (source.unit.IsNull() || !source.unit.IsAlive()) continue;

      const victims = FindUnitsInRadius(
        caster.GetTeamNumber(),
        source.unit.GetAbsOrigin(),
        undefined,
        radius,
        UnitTargetTeam.ENEMY,
        UnitTargetType.HERO + UnitTargetType.BASIC,
        UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
        FindOrder.ANY,
        false,
      );
      for (const victim of victims) {
        if (victim === source.unit) continue;

        ApplyDamage({
          victim,
          attacker: caster,
          damage,
          damage_type: etherShock.GetAbilityDamageType(),
          ability,
        });
        this.playEtherShockParticle(source.unit, victim);
      }
    }
  }

  private playEtherShockParticle(source: CDOTA_BaseNPC, target: CDOTA_BaseNPC): void {
    const particle = ParticleManager.CreateParticle(
      ETHER_SHOCK_PARTICLE,
      ParticleAttachment.CUSTOMORIGIN,
      source,
    );
    ParticleManager.SetParticleControlEnt(
      particle,
      0,
      source,
      ParticleAttachment.POINT_FOLLOW,
      'attach_hitloc',
      source.GetAbsOrigin(),
      true,
    );
    ParticleManager.SetParticleControlEnt(
      particle,
      1,
      target,
      ParticleAttachment.POINT_FOLLOW,
      'attach_hitloc',
      target.GetAbsOrigin(),
      true,
    );
    ParticleManager.ReleaseParticleIndex(particle);
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_shadow_shaman_shackles_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_shadow_shaman_shackles_awaken_status extends BaseModifier {
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
    return 'shadow_shaman_shackles';
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_shadow_shaman_shackles_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_shadow_shaman_shackles_awaken_debuff extends BaseModifier {
  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.MULTIPLE;
  }

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsStunDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'shadow_shaman_shackles';
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.STUNNED]: true,
    };
  }
}
