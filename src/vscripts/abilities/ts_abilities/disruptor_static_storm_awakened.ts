import {
  BaseAbility,
  BaseModifier,
  BaseModifierMotionHorizontal,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  calculateTickDamage,
  calculateGravitySpeed,
  selectNearestSource,
  StormSource,
} from './disruptor-static-storm-awakened-logic';

const KINETIC_FIELD_ABILITY = 'disruptor_kinetic_field';
const THUNDER_STRIKE_ABILITY = 'disruptor_thunder_strike';
const STATIC_STORM_PARTICLE = 'particles/units/heroes/hero_disruptor/disruptor_static_storm.vpcf';
interface StormRuntimeSource extends StormSource {
  sourceIndex: EntityIndex;
  casterTeam: number;
  caster: CDOTA_BaseNPC;
  ability: CDOTABaseAbility;
  radius: number;
  gravityRadius: number;
  elapsed: number;
  duration: number;
  damageInterval: number;
  damageStart: number;
  damageMax: number;
  healthStart: number;
  healthEnd: number;
  gravityDeadZone: number;
  gravityStart: number;
  gravityEnd: number;
  gravityMax: number;
  thunderStrike?: CDOTABaseAbility;
}
interface PullParams {
  sourceIndex?: EntityIndex;
}
const registry: Record<string, StormRuntimeSource> = {};
const thunderStruckTargets: Record<string, Record<string, boolean>> = {};
function valid(unit: CDOTA_BaseNPC | undefined): boolean {
  return !!unit && !unit.IsNull();
}
function validAbility(ability: CDOTABaseAbility | undefined): boolean {
  return !!ability && !ability.IsNull();
}

function applyThunderStrike(
  caster: CDOTA_BaseNPC,
  thunderStrike: CDOTABaseAbility,
  target: CDOTA_BaseNPC,
): void {
  const previousTarget = caster.GetCursorCastTarget();
  caster.SetCursorCastTarget(target);
  thunderStrike.OnSpellStart();
  thunderStrike.UseResources(false, false, false, false);
  caster.SetCursorCastTarget(previousTarget);
}

@registerAbility('disruptor_static_storm_awakened')
export class DisruptorStaticStormAwakened extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_disruptor_static_storm_awakened_marker.name;
  }

  GetAOERadius(): number {
    return this.GetSpecialValueFor('radius');
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const position = this.GetCursorPosition();
    const kineticField = caster.FindAbilityByName(KINETIC_FIELD_ABILITY);
    if (kineticField && !kineticField.IsNull()) {
      const previousCursorPosition = caster.GetCursorPosition();
      caster.SetCursorPosition(position);
      kineticField.OnSpellStart();
      caster.SetCursorPosition(previousCursorPosition);
    }

    CreateModifierThinker(
      caster,
      this,
      modifier_disruptor_static_storm_awakened_thinker.name,
      { duration: this.GetSpecialValueFor('duration') },
      position,
      caster.GetTeamNumber(),
      false,
    );
    caster.EmitSound('Hero_Disruptor.StaticStorm');
  }
}
@registerModifier('abilities/ts_abilities/disruptor_static_storm_awakened')
export class modifier_disruptor_static_storm_awakened_marker extends BaseModifier {
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
    return 'disruptor_static_storm';
  }
}
@registerModifier('abilities/ts_abilities/disruptor_static_storm_awakened')
export class modifier_disruptor_static_storm_awakened_thinker extends BaseModifier {
  private source?: StormRuntimeSource;
  private particle?: ParticleID;
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    const a = this.GetAbility();
    const c = this.GetCaster();
    const p = this.GetParent();
    if (!a || !c) return;
    const radius = a.GetSpecialValueFor('radius');
    const id = String(p.GetEntityIndex());
    const thunderStrike = c.FindAbilityByName(THUNDER_STRIKE_ABILITY);
    this.source = {
      id,
      sourceIndex: p.GetEntityIndex(),
      casterTeam: c.GetTeamNumber(),
      caster: c,
      ability: a,
      position: p.GetAbsOrigin(),
      radius,
      gravityRadius: radius * a.GetSpecialValueFor('gravity_radius_multiplier'),
      elapsed: 0,
      duration: a.GetSpecialValueFor('duration'),
      damageInterval: a.GetSpecialValueFor('damage_interval'),
      damageStart: a.GetSpecialValueFor('base_damage_start_pct'),
      damageMax: a.GetSpecialValueFor('damage_max'),
      healthStart: a.GetSpecialValueFor('max_health_damage_start_pct'),
      healthEnd: a.GetSpecialValueFor('max_health_damage_end_pct'),
      gravityDeadZone: a.GetSpecialValueFor('gravity_dead_zone'),
      gravityStart: a.GetSpecialValueFor('gravity_start_speed'),
      gravityEnd: a.GetSpecialValueFor('gravity_end_speed'),
      gravityMax: a.GetSpecialValueFor('gravity_max_speed'),
      thunderStrike:
        thunderStrike && !thunderStrike.IsNull() && thunderStrike.GetLevel() > 0
          ? thunderStrike
          : undefined,
    };
    registry[id] = this.source;
    thunderStruckTargets[id] = {};
    this.particle = ParticleManager.CreateParticle(
      STATIC_STORM_PARTICLE,
      ParticleAttachment.WORLDORIGIN,
      p,
    );
    ParticleManager.SetParticleControl(this.particle, 0, p.GetAbsOrigin());
    ParticleManager.SetParticleControl(this.particle, 1, Vector(radius, 0, 0));
    ParticleManager.SetParticleControl(this.particle, 2, Vector(this.source.duration, 0, 0));
    this.AddParticle(this.particle, false, false, -1, false, false);
    this.StartIntervalThink(this.source.damageInterval);
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    if (this.source) {
      delete registry[this.source.id];
      delete thunderStruckTargets[this.source.id];
    }
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const s = this.source;
    if (!s || !valid(s.caster) || !validAbility(s.ability)) return;
    const p = this.GetParent();
    const progress = s.elapsed / Math.max(0.01, s.duration);
    const damageTargets = FindUnitsInRadius(
      s.casterTeam,
      p.GetAbsOrigin(),
      undefined,
      s.radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );
    for (const t of damageTargets) {
      if (t.IsMagicImmune()) continue;
      const targetKey = String(t.GetEntityIndex());
      const thunderStrike = s.thunderStrike;
      if (thunderStrike && !thunderStrike.IsNull() && !thunderStruckTargets[s.id]?.[targetKey]) {
        applyThunderStrike(s.caster, thunderStrike, t);
        if (!thunderStruckTargets[s.id]) thunderStruckTargets[s.id] = {};
        thunderStruckTargets[s.id][targetKey] = true;
      }
      const d = calculateTickDamage(
        {
          progress,
          baseMaxDps: s.damageMax,
          baseStartPct: s.damageStart,
          maxHealth: t.GetMaxHealth(),
          healthPctStart: s.healthStart,
          healthPctEnd: s.healthEnd,
        },
        s.damageInterval,
      );
      ApplyDamage({
        victim: t,
        attacker: s.caster,
        ability: s.ability,
        damage: d,
        damage_type: DamageTypes.MAGICAL,
      });
      t.AddNewModifier(s.caster, s.ability, 'modifier_silence', { duration: s.damageInterval });
      if (s.caster.HasScepter())
        t.AddNewModifier(s.caster, s.ability, modifier_disruptor_static_storm_awakened_mute.name, {
          duration: s.damageInterval,
        });
    }
    const movement = FindUnitsInRadius(
      s.casterTeam,
      p.GetAbsOrigin(),
      undefined,
      s.gravityRadius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );
    for (const t of movement) {
      if (!valid(t) || t.GetTeamNumber() === s.casterTeam) continue;
      const cur = t.GetAbsOrigin();
      const nearest = selectNearestSource(
        cur,
        Object.keys(registry)
          .map((key) => registry[key])
          .filter(
            (source) =>
              valid(source.caster) &&
              validAbility(source.ability) &&
              source.casterTeam !== t.GetTeamNumber() &&
              (cur.x - source.position.x) ** 2 + (cur.y - source.position.y) ** 2 <=
                source.gravityRadius * source.gravityRadius,
          ),
      );
      if (!nearest || nearest.id !== s.id) continue;
      t.AddNewModifier(s.caster, s.ability, modifier_disruptor_static_storm_awakened_pull.name, {
        duration: s.damageInterval + 0.1,
        sourceIndex: s.sourceIndex,
      });
    }
    s.elapsed += s.damageInterval;
  }
}
@registerModifier('abilities/ts_abilities/disruptor_static_storm_awakened')
export class modifier_disruptor_static_storm_awakened_pull extends BaseModifierMotionHorizontal {
  private sourceId?: string;

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  OnCreated(params: PullParams): void {
    if (!IsServer()) return;
    this.sourceId = params.sourceIndex ? String(params.sourceIndex) : undefined;
    if (!this.ApplyHorizontalMotionController()) this.Destroy();
  }

  OnRefresh(params: PullParams): void {
    if (!IsServer()) return;
    if (params.sourceIndex) this.sourceId = String(params.sourceIndex);
  }

  UpdateHorizontalMotion(parent: CDOTA_BaseNPC, dt: number): void {
    const source = this.sourceId ? registry[this.sourceId] : undefined;
    if (!source || !valid(source.caster) || !validAbility(source.ability)) {
      this.Destroy();
      return;
    }
    const origin = parent.GetAbsOrigin();
    const delta = Vector(source.position.x - origin.x, source.position.y - origin.y, 0);
    const distanceToCenter = delta.Length2D();
    const speed = calculateGravitySpeed({
      distance: distanceToCenter,
      radius: source.gravityRadius,
      progress: source.elapsed / source.duration,
      deadZone: source.gravityDeadZone,
      startSpeed: source.gravityStart,
      endSpeed: source.gravityEnd,
      maxSpeed: source.gravityMax,
    });
    const distance = Math.min(distanceToCenter, speed * dt);
    if (distance <= 0) return;
    const direction = delta.Normalized();
    parent.SetAbsOrigin(
      Vector(origin.x + direction.x * distance, origin.y + direction.y * distance, origin.z),
    );
  }

  OnHorizontalMotionInterrupted(): void {
    this.Destroy();
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    parent.RemoveHorizontalMotionController(this);
    ResolveNPCPositions(parent.GetAbsOrigin(), 128);
  }
}
@registerModifier('abilities/ts_abilities/disruptor_static_storm_awakened')
export class modifier_disruptor_static_storm_awakened_mute extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return true;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return { [ModifierState.MUTED]: true };
  }
}
