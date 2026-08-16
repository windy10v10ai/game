import {
  BaseAbility,
  BaseModifier,
  BaseModifierMotionHorizontal,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  createResidenceState,
  getTickManaCost,
  ResidenceState,
  tickResidenceWithTransition,
} from './enigma-black-hole-awaken-logic';

const NATIVE = 'enigma_black_hole';
const CONTROLLER = 'modifier_enigma_black_hole_awakened_controller';
const STATUS = 'modifier_enigma_black_hole_awakened_status';
const STATUS_PARTICLE = 'particles/enigma_black_hole_awakened_aura.vpcf';
const CONTROL_STATUS_EFFECT = 'particles/status_fx/status_effect_enigma_blackhole_tgt.vpcf';

@registerAbility('enigma_black_hole_awakened')
export class EnigmaBlackHoleAwakened extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return CONTROLLER;
  }

  GetBehavior(): AbilityBehavior {
    return AbilityBehavior.POINT + AbilityBehavior.AOE + AbilityBehavior.AUTOCAST;
  }

  GetAOERadius(): number {
    return this.getNative()?.GetSpecialValueFor('radius') ?? 0;
  }

  GetCustomCastErrorLocation(): string {
    return '#dota_hud_error_enigma_black_hole_alternate_cast_active';
  }

  CastFilterResultLocation(): UnitFilterResult {
    if (!IsServer()) return UnitFilterResult.SUCCESS;
    return this.GetAutoCastState() ? UnitFilterResult.FAIL_CUSTOM : UnitFilterResult.SUCCESS;
  }

  GetManaCost(level: number): number {
    return IsServer() ? 0 : super.GetManaCost(level);
  }

  GetCooldown(level: number): number {
    return IsServer() ? 0 : super.GetCooldown(level);
  }

  OnUpgrade(): void {
    if (IsServer()) this.ensureNative();
  }

  OnOwnerSpawned(): void {
    if (!IsServer()) return;
    const native = this.ensureNative();
    if (native) this.restoreAbilityVisibility(native);
  }

  OnSpellStart(): void {
    if (!IsServer()) return;
    const native = this.ensureNative();
    if (!native) return;
    const caster = this.GetCaster();
    const restoreDeadline = GameRules.GetGameTime() + 1;
    this.SetHidden(true);
    native.SetHidden(false);
    caster.CastAbilityOnPosition(this.GetCursorPosition(), native, caster.GetPlayerOwnerID());
    caster.SetContextThink(
      `enigma_black_hole_awakened_native_cast_${this.entindex()}`,
      () => {
        if (native.IsInAbilityPhase() || native.IsChanneling() || caster.IsChanneling())
          return 0.03;
        const remaining = native.GetCooldownTimeRemaining();
        if (remaining <= 0 && GameRules.GetGameTime() < restoreDeadline) return 0.03;
        this.restoreAbilityVisibility(native);
        if (remaining > 0) this.StartCooldown(remaining);
        return undefined;
      },
      0.03,
    );
  }

  ensureNative(): CDOTABaseAbility | undefined {
    const caster = this.GetCaster();
    let native = caster.FindAbilityByName(NATIVE);
    if (!native) {
      native = caster.AddAbility(NATIVE);
      native?.SetHidden(true);
    }
    if (native && native.GetLevel() !== this.GetLevel()) native.SetLevel(this.GetLevel());
    return native;
  }

  getNative(): CDOTABaseAbility | undefined {
    return this.GetCaster().FindAbilityByName(NATIVE);
  }

  private restoreAbilityVisibility(native: CDOTABaseAbility): void {
    native.SetHidden(true);
    this.SetHidden(false);
  }
}

@registerModifier('abilities/ts_abilities/enigma_black_hole_awakened')
export class modifier_enigma_black_hole_awakened_controller extends BaseModifier {
  private states = new Map<EntityIndex, ResidenceState>();
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  OnCreated(): void {
    if (IsServer()) this.StartIntervalThink(this.value('tick_interval', 0.25));
  }

  OnDestroy(): void {
    if (IsServer()) this.clearMode();
  }

  private value(name: string, fallback: number): number {
    const value = this.GetAbility()?.GetSpecialValueFor(name) ?? 0;
    return value > 0 ? value : fallback;
  }

  private clearMode(): void {
    this.states.clear();
    this.GetParent().RemoveModifierByName(STATUS);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const ability = this.GetAbility() as EnigmaBlackHoleAwakened;
    const caster = this.GetParent();
    if (!ability.GetAutoCastState() || !caster.IsAlive()) {
      this.clearMode();
      return;
    }
    const native = ability.getNative();
    if (!native) return;
    // Order filtering prevents the toggle in normal input; this server-side guard
    // closes the race before the first damage/mana tick if a cooldown appears later.
    if (ability.GetCooldownTimeRemaining() > 0 || native.GetCooldownTimeRemaining() > 0) {
      ability.ToggleAutoCast();
      this.clearMode();
      return;
    }
    const tick = this.value('tick_interval', 0.25);
    const nativeLevel = Math.max(0, native.GetLevel() - 1);
    const tickMana = getTickManaCost(native.GetManaCost(nativeLevel), tick);
    if (caster.GetMana() < tickMana) {
      ability.ToggleAutoCast();
      this.clearMode();
      return;
    }
    caster.SpendMana(tickMana, ability);
    if (!caster.HasModifier(STATUS)) caster.AddNewModifier(caster, ability, STATUS, {});
    const radius = native.GetSpecialValueFor('radius');
    const residence = this.value('residence_duration', 5);
    const control = this.value('control_duration', 2);
    const enemies = FindUnitsInRadius(
      caster.GetTeamNumber(),
      caster.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.CLOSEST,
      false,
    );
    for (const enemy of enemies) {
      const id = enemy.GetEntityIndex();
      const next = tickResidenceWithTransition(
        this.states.get(id) ?? createResidenceState(),
        tick,
        true,
        residence,
        control,
      );
      this.states.set(id, next);
      ApplyDamage({
        victim: enemy,
        attacker: caster,
        damage:
          native.GetSpecialValueFor('damage') *
          (this.value('alternate_damage_pct', 50) / 100) *
          tick,
        damage_type: native.GetAbilityDamageType(),
        ability,
      });
      if (next.controlStarted)
        enemy.AddNewModifier(caster, ability, 'modifier_enigma_black_hole_awakened_control', {
          duration: control,
        });
      if (caster.HasScepter())
        enemy.AddNewModifier(caster, ability, 'modifier_enigma_black_hole_awakened_pull', {
          duration: tick + 0.1,
        });
    }
    const activeIds = new Set(enemies.map((enemy) => enemy.GetEntityIndex()));
    for (const id of this.states.keys()) if (!activeIds.has(id)) this.states.delete(id);
  }
}

@registerModifier('abilities/ts_abilities/enigma_black_hole_awakened')
export class modifier_enigma_black_hole_awakened_status extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    const particle = ParticleManager.CreateParticle(
      STATUS_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      parent,
    );
    ParticleManager.SetParticleControlEnt(
      particle,
      0,
      parent,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      'attach_hitloc',
      parent.GetAbsOrigin(),
      true,
    );
    this.AddParticle(particle, false, false, -1, false, false);
  }
}

@registerModifier('abilities/ts_abilities/enigma_black_hole_awakened')
export class modifier_enigma_black_hole_awakened_control extends BaseModifier {
  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  IsStunDebuff(): boolean {
    return true;
  }

  GetStatusEffectName(): string {
    return CONTROL_STATUS_EFFECT;
  }

  OnCreated(): void {
    if (IsServer()) this.StartIntervalThink(0.1);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const caster = this.GetCaster();
    const ability = this.GetAbility() as EnigmaBlackHoleAwakened | undefined;
    if (
      !caster ||
      caster.IsNull() ||
      !caster.IsAlive() ||
      !ability ||
      ability.IsNull() ||
      !ability.GetAutoCastState()
    ) {
      this.Destroy();
    }
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.STUNNED]: true,
      [ModifierState.COMMAND_RESTRICTED]: true,
      [ModifierState.SILENCED]: true,
      [ModifierState.ROOTED]: true,
      [ModifierState.DISARMED]: true,
    };
  }
}

@registerModifier('abilities/ts_abilities/enigma_black_hole_awakened')
export class modifier_enigma_black_hole_awakened_pull extends BaseModifierMotionHorizontal {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  OnCreated(): void {
    if (IsServer() && !this.ApplyHorizontalMotionController()) this.Destroy();
  }

  UpdateHorizontalMotion(parent: CDOTA_BaseNPC, dt: number): void {
    const caster = this.GetCaster();
    const ability = this.GetAbility() as EnigmaBlackHoleAwakened | undefined;
    if (
      !caster ||
      caster.IsNull() ||
      !caster.IsAlive() ||
      !ability ||
      ability.IsNull() ||
      !ability.GetAutoCastState() ||
      !caster.HasScepter()
    ) {
      this.Destroy();
      return;
    }
    const origin = parent.GetAbsOrigin();
    const target = caster.GetAbsOrigin();
    const delta = Vector(target.x - origin.x, target.y - origin.y, target.z - origin.z);
    const direction = delta.Normalized();
    const distance = Math.min(delta.Length2D(), 250 * dt);
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
