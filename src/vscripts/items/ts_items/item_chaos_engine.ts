import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility()
export class item_chaos_engine extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_chaos_engine';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const mod = caster.FindModifierByName('modifier_item_chaos_engine') as
      | modifier_item_chaos_engine
      | undefined;
    if (mod) {
      mod.AdvanceCycle();
    }
  }
}

@registerModifier('items/ts_items/item_chaos_engine.lua')
export class modifier_item_chaos_engine extends BaseItemModifier {
  protected override statsModifierName: string = '';

  OnCreated(): void {
    super.OnCreated();
    if (IsServer()) {
      this.SetStackCount(0);
      this.GetParent().AddNewModifier(
        this.GetParent(),
        this.GetAbility(),
        'modifier_chaos_engine_indicator',
        { duration: -1 },
      );
    }
  }

  OnDestroy(): void {
    super.OnDestroy();
    if (IsServer()) {
      this.GetParent().RemoveModifierByName('modifier_chaos_engine_indicator');
    }
  }

  AdvanceCycle(): void {
    const next = (this.GetStackCount() + 1) % 8;
    this.SetStackCount(next);
    this.SyncIndicator(next);
  }

  private SyncIndicator(index: number): void {
    const indicator = this.GetParent().FindModifierByName('modifier_chaos_engine_indicator');
    if (indicator) {
      indicator.SetStackCount(index);
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
      ModifierFunction.MANA_BONUS,
      ModifierFunction.ON_ABILITY_FULLY_CAST,
    ];
  }

  GetModifierBonusStats_Strength(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_strength') ?? 0;
  }

  GetModifierBonusStats_Agility(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_agility') ?? 0;
  }

  GetModifierBonusStats_Intellect(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_intellect') ?? 0;
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_damage') ?? 0;
  }

  GetModifierSpellAmplify_Percentage(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_spell_amp') ?? 0;
  }

  GetModifierManaBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_mana') ?? 0;
  }

  OnAbilityFullyCast(event?: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    if (!event) return;
    if (event.unit !== this.GetParent()) return;
    if (event.ability === this.GetAbility()) return;

    const effectIndex = this.GetStackCount();
    const nextIndex = (effectIndex + 1) % 8;
    this.SetStackCount(nextIndex);
    this.SyncIndicator(nextIndex);
    this.TriggerEffect(effectIndex);
  }

  private TriggerEffect(index: number): void {
    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) return;

    const nukeRadius = ability.GetSpecialValueFor('nuke_radius');

    switch (index) {
      case 0: {
        // AOE nuke
        const nukeDamage = ability.GetSpecialValueFor('nuke_damage');
        const enemies = FindUnitsInRadius(
          parent.GetTeamNumber(),
          parent.GetAbsOrigin(),
          undefined,
          nukeRadius,
          UnitTargetTeam.ENEMY,
          UnitTargetType.HERO | UnitTargetType.BASIC,
          UnitTargetFlags.NONE,
          FindOrder.ANY,
          false,
        );
        for (const enemy of enemies) {
          ApplyDamage({
            victim: enemy,
            attacker: parent,
            damage: nukeDamage,
            damage_type: DamageTypes.MAGICAL,
            ability: ability,
          });
        }
        break;
      }
      case 1: {
        // AOE stun
        const stunDuration = ability.GetSpecialValueFor('stun_duration');
        const enemies = FindUnitsInRadius(
          parent.GetTeamNumber(),
          parent.GetAbsOrigin(),
          undefined,
          nukeRadius,
          UnitTargetTeam.ENEMY,
          UnitTargetType.HERO | UnitTargetType.BASIC,
          UnitTargetFlags.NONE,
          FindOrder.ANY,
          false,
        );
        for (const enemy of enemies) {
          enemy.AddNewModifier(parent, ability, 'modifier_chaos_engine_stun', {
            duration: stunDuration,
          });
        }
        break;
      }
      case 2: {
        // Polymorph nearest enemy
        const polymorphDuration = ability.GetSpecialValueFor('polymorph_duration');
        const enemies = FindUnitsInRadius(
          parent.GetTeamNumber(),
          parent.GetAbsOrigin(),
          undefined,
          nukeRadius,
          UnitTargetTeam.ENEMY,
          UnitTargetType.HERO,
          UnitTargetFlags.NONE,
          FindOrder.CLOSEST,
          false,
        );
        if (enemies.length > 0) {
          enemies[0].AddNewModifier(parent, ability, 'modifier_sheepstick_debuff', {
            duration: polymorphDuration,
          });
        }
        break;
      }
      case 3: {
        // Global silence
        const silenceDuration = ability.GetSpecialValueFor('silence_duration');
        const allHeroes = HeroList.GetAllHeroes();
        for (const hero of allHeroes) {
          if (hero.GetTeamNumber() !== parent.GetTeamNumber()) {
            hero.AddNewModifier(parent, ability, 'modifier_chaos_engine_silence', {
              duration: silenceDuration,
            });
          }
        }
        break;
      }
      case 4: {
        // Meteor — delayed AOE pure damage with visual
        const meteorDamage = ability.GetSpecialValueFor('meteor_damage');
        const impactPos = parent.GetAbsOrigin();

        const warningFx = ParticleManager.CreateParticle(
          'particles/items3_fx/meteor_hammer.vpcf',
          ParticleAttachment.WORLDORIGIN,
          undefined,
        );
        ParticleManager.SetParticleControl(warningFx, 0, impactPos);
        ParticleManager.SetParticleControl(warningFx, 1, impactPos);
        ParticleManager.ReleaseParticleIndex(warningFx);

        const teamNumber = parent.GetTeamNumber();
        Timers.CreateTimer(0.8, () => {
          const impactFx = ParticleManager.CreateParticle(
            'particles/items3_fx/meteor_hammer_impact.vpcf',
            ParticleAttachment.WORLDORIGIN,
            undefined,
          );
          ParticleManager.SetParticleControl(impactFx, 0, impactPos);
          ParticleManager.ReleaseParticleIndex(impactFx);

          const targets = FindUnitsInRadius(
            teamNumber,
            impactPos,
            undefined,
            nukeRadius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO | UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false,
          );
          for (const enemy of targets) {
            ApplyDamage({
              victim: enemy,
              attacker: parent,
              damage: meteorDamage,
              damage_type: DamageTypes.PURE,
              ability: ability,
            });
          }
          return undefined;
        });
        break;
      }
      case 5: {
        // Mass slow
        const slowDuration = ability.GetSpecialValueFor('slow_duration');
        const enemies = FindUnitsInRadius(
          parent.GetTeamNumber(),
          parent.GetAbsOrigin(),
          undefined,
          nukeRadius,
          UnitTargetTeam.ENEMY,
          UnitTargetType.HERO | UnitTargetType.BASIC,
          UnitTargetFlags.NONE,
          FindOrder.ANY,
          false,
        );
        for (const enemy of enemies) {
          enemy.AddNewModifier(parent, ability, 'modifier_chaos_engine_slow', {
            duration: slowDuration,
          });
        }
        break;
      }
      case 6: {
        // Spell resist shred on nearest enemy
        const shredDuration = ability.GetSpecialValueFor('spell_resist_duration');
        const enemies = FindUnitsInRadius(
          parent.GetTeamNumber(),
          parent.GetAbsOrigin(),
          undefined,
          nukeRadius,
          UnitTargetTeam.ENEMY,
          UnitTargetType.HERO,
          UnitTargetFlags.NONE,
          FindOrder.CLOSEST,
          false,
        );
        if (enemies.length > 0) {
          enemies[0].AddNewModifier(parent, ability, 'modifier_chaos_engine_spell_resist_debuff', {
            duration: shredDuration,
          });
        }
        break;
      }
      case 7: {
        // Refresh a random non-item ability on cooldown
        const abilities: CDOTABaseAbility[] = [];
        for (let i = 0; i < 24; i++) {
          const ab = parent.GetAbilityByIndex(i);
          if (ab && !ab.IsItem() && ab.IsCooldownReady() === false && ab.GetCooldown(0) > 0) {
            abilities.push(ab);
          }
        }
        if (abilities.length > 0) {
          const pick = abilities[RandomInt(0, abilities.length - 1)];
          pick.EndCooldown();
        }
        break;
      }
    }
  }
}

@registerModifier('items/ts_items/item_chaos_engine.lua')
export class modifier_chaos_engine_indicator extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.PERMANENT;
  }

  GetTexture(): string {
    return 'item_chaos_engine';
  }

  GetModifierStackCount(): number {
    return this.GetStackCount();
  }
}

@registerModifier('items/ts_items/item_chaos_engine.lua')
export class modifier_chaos_engine_stun extends BaseModifier {
  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return { [ModifierState.STUNNED]: true };
  }
}

@registerModifier('items/ts_items/item_chaos_engine.lua')
export class modifier_chaos_engine_silence extends BaseModifier {
  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return { [ModifierState.SILENCED]: true };
  }
}

@registerModifier('items/ts_items/item_chaos_engine.lua')
export class modifier_chaos_engine_slow extends BaseModifier {
  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
  }

  GetModifierMoveSpeedBonus_Percentage(): number {
    return -(this.GetAbility()?.GetSpecialValueFor('slow_pct') ?? 80);
  }
}

@registerModifier('items/ts_items/item_chaos_engine.lua')
export class modifier_chaos_engine_spell_resist_debuff extends BaseModifier {
  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.MAGICAL_RESISTANCE_BONUS];
  }

  GetModifierMagicalResistanceBonus(): number {
    return -(this.GetAbility()?.GetSpecialValueFor('spell_resist_reduction') ?? 50);
  }
}
