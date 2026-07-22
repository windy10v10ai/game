import { BaseAbility, registerAbility } from '../../utils/dota_ts_adapter';
import {
  ChainFrostTargetCandidate,
  selectChainFrostNextTarget,
} from './lich-chain-frost-targeting';

const ICE_SPIRE_UNIT = 'npc_dota_lich_ice_spire';
const CHAIN_FROST_PROJECTILE = 'particles/units/heroes/hero_lich/lich_chain_frost.vpcf';
const CHAIN_FROST_SLOW = 'modifier_lich_chainfrost_slow';
const CHAIN_FROST_FROSTBOUND = 'modifier_lich_chainfrost_frostbound';

export interface LichChainFrostState {
  damage: number;
  remainingJumps: number;
}

interface LichChainFrostProjectileData {
  castId: number;
}

interface RuntimeTargetCandidate extends ChainFrostTargetCandidate {
  unit: CDOTA_BaseNPC;
}

export function createLichChainFrostState(baseDamage: number, jumps: number): LichChainFrostState {
  return {
    damage: baseDamage,
    remainingJumps: jumps,
  };
}

export function advanceLichChainFrostState(
  state: LichChainFrostState,
  bonusDamage: number,
  killBonus: number,
): LichChainFrostState {
  return {
    damage: state.damage + bonusDamage,
    remainingJumps: state.remainingJumps - 1 + killBonus,
  };
}

export function isLichIceSpire(unitName: string): boolean {
  return unitName === ICE_SPIRE_UNIT;
}

/** 觉醒连环霜冻：自行控制下一跳，确保英雄和寒冰尖柱优先级不被普通单位抢占。 */
@registerAbility('lich_chain_frost_awakened')
export class LichChainFrostAwakened extends BaseAbility {
  private nextCastId = 1;
  private castStates: Record<number, LichChainFrostState> = {};

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const target = this.GetCursorTarget();
    if (!target || target.IsNull() || target.TriggerSpellAbsorb(this)) return;

    const castId = this.nextCastId;
    this.nextCastId += 1;
    this.castStates[castId] = createLichChainFrostState(
      this.GetSpecialValueFor('damage'),
      this.GetSpecialValueFor('jumps'),
    );

    caster.EmitSound('Hero_Lich.ChainFrost');
    this.fireProjectile(
      caster,
      target,
      this.GetSpecialValueFor('initial_projectile_speed'),
      castId,
    );
  }

  OnProjectileHit_ExtraData(
    target: CDOTA_BaseNPC | undefined,
    _location: Vector,
    extraData: LichChainFrostProjectileData,
  ): boolean {
    const castId = extraData.castId;
    const state = this.castStates[castId];
    if (!state) return true;

    if (!target || target.IsNull() || !target.IsAlive()) {
      this.clearCast(castId);
      return true;
    }

    const caster = this.GetCaster();
    const hitIceSpire = isLichIceSpire(target.GetUnitName());
    let killBonus = 0;

    if (!hitIceSpire) {
      this.applyHit(caster, target, state.damage);
      if (!target.IsAlive()) {
        killBonus =
          target.IsRealHero() && !target.IsIllusion()
            ? this.GetSpecialValueFor('bonus_jumps_per_hero_killed')
            : this.GetSpecialValueFor('bonus_jumps_per_creep_killed');
      }
    }

    const nextState = advanceLichChainFrostState(
      state,
      this.GetSpecialValueFor('bonus_jump_damage'),
      killBonus,
    );
    if (nextState.remainingJumps < 0) {
      this.clearFrostbound(caster, target);
      this.clearCast(castId);
      return true;
    }

    const nextTarget = this.findNextTarget(caster, target);
    if (!nextTarget) {
      this.clearCast(castId);
      return true;
    }

    this.castStates[castId] = nextState;
    this.fireProjectile(target, nextTarget, this.GetSpecialValueFor('projectile_speed'), castId);
    return true;
  }

  private applyHit(caster: CDOTA_BaseNPC, target: CDOTA_BaseNPC, damage: number): void {
    this.refreshOrAddModifier(
      caster,
      target,
      CHAIN_FROST_SLOW,
      this.GetSpecialValueFor('slow_duration'),
    );
    this.refreshOrAddModifier(
      caster,
      target,
      CHAIN_FROST_FROSTBOUND,
      this.GetSpecialValueFor('frostbound_duration'),
    );

    ApplyDamage({
      victim: target,
      attacker: caster,
      damage,
      damage_type: DamageTypes.MAGICAL,
      ability: this,
    });
  }

  private refreshOrAddModifier(
    caster: CDOTA_BaseNPC,
    target: CDOTA_BaseNPC,
    modifierName: string,
    duration: number,
  ): void {
    const existing = target.FindModifierByNameAndCaster(modifierName, caster);
    if (existing && !existing.IsNull()) {
      existing.SetDuration(duration, true);
      return;
    }

    target.AddNewModifier(caster, this, modifierName, { duration });
  }

  private findNextTarget(caster: CDOTA_BaseNPC, current: CDOTA_BaseNPC): CDOTA_BaseNPC | undefined {
    const candidates = this.collectCandidates(caster, current);
    const selected = selectChainFrostNextTarget(candidates);
    return selected?.unit;
  }

  private collectCandidates(
    caster: CDOTA_BaseNPC,
    current: CDOTA_BaseNPC,
  ): RuntimeTargetCandidate[] {
    const jumpRange = this.GetSpecialValueFor('jump_range');
    const units: CDOTA_BaseNPC[] = [];

    for (const enemy of FindUnitsInRadius(
      caster.GetTeamNumber(),
      current.GetAbsOrigin(),
      undefined,
      jumpRange,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.CLOSEST,
      false,
    )) {
      this.addUniqueUnit(units, enemy);
    }

    for (const ally of FindUnitsInRadius(
      caster.GetTeamNumber(),
      current.GetAbsOrigin(),
      undefined,
      jumpRange,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.ALL,
      UnitTargetFlags.INVULNERABLE,
      FindOrder.CLOSEST,
      false,
    )) {
      if (isLichIceSpire(ally.GetUnitName())) {
        this.addUniqueUnit(units, ally);
      }
    }

    this.addUniqueUnit(units, current);

    return units.map((unit) => {
      const iceSpire = isLichIceSpire(unit.GetUnitName());
      const illusion = unit.IsIllusion();
      const realHero = unit.IsRealHero() && !illusion;
      return {
        id: unit.entindex(),
        distance: current.GetRangeToUnit(unit),
        current: unit === current,
        valid: !unit.IsNull() && unit.IsAlive(),
        realHero,
        illusion,
        iceSpire,
        ordinary: !realHero && !iceSpire,
        unit,
      };
    });
  }

  private addUniqueUnit(units: CDOTA_BaseNPC[], unit: CDOTA_BaseNPC): void {
    if (!units.includes(unit)) {
      units.push(unit);
    }
  }

  private fireProjectile(
    source: CDOTA_BaseNPC,
    target: CDOTA_BaseNPC,
    speed: number,
    castId: number,
  ): void {
    ProjectileManager.CreateTrackingProjectile({
      Target: target,
      Source: source,
      Ability: this,
      EffectName: CHAIN_FROST_PROJECTILE,
      iMoveSpeed: speed,
      bDodgeable: true,
      bProvidesVision: true,
      iVisionRadius: 100,
      iVisionTeamNumber: this.GetCaster().GetTeamNumber(),
      ExtraData: { castId },
    });
  }

  private clearFrostbound(caster: CDOTA_BaseNPC, target: CDOTA_BaseNPC): void {
    target.RemoveModifierByNameAndCaster(CHAIN_FROST_FROSTBOUND, caster);
  }

  private clearCast(castId: number): void {
    delete this.castStates[castId];
  }
}
