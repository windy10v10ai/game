import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility()
export class item_primordial_mandate extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_primordial_mandate';
  }

  OnToggle(): void {
    const caster = this.GetCaster();
    if (caster.HasModifier('modifier_item_primordial_mandate_frenzy')) {
      caster.RemoveModifierByName('modifier_item_primordial_mandate_frenzy');
    } else {
      caster.AddNewModifier(caster, this, 'modifier_item_primordial_mandate_frenzy', {
        duration: -1,
      });
    }
  }
}

@registerModifier('items/ts_items/item_primordial_mandate.lua')
export class modifier_item_primordial_mandate extends BaseItemModifier {
  protected override statsModifierName: string = '';

  private undyingWillReady: boolean = true;
  private blockingDamage: boolean = false;

  OnCreated(): void {
    super.OnCreated();
    if (IsServer()) {
      this.undyingWillReady = true;
      this.StartIntervalThink(0.05);
    }
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (!parent.IsAlive()) return;

    if (this.undyingWillReady && parent.GetHealth() <= 1 && !this.blockingDamage) {
      this.TriggerUndyingWill();
    }
  }

  private TriggerUndyingWill(): void {
    if (!this.undyingWillReady) return;
    this.undyingWillReady = false;
    this.blockingDamage = true;

    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) return;

    parent.SetHealth(1);

    const radius = ability.GetSpecialValueFor('undying_will_radius');
    const damage = ability.GetSpecialValueFor('undying_will_damage');
    const invulnDur = ability.GetSpecialValueFor('undying_will_invis_dur');
    const cooldown = ability.GetSpecialValueFor('undying_will_cd');

    const enemies = FindUnitsInRadius(
      parent.GetTeamNumber(),
      parent.GetAbsOrigin(),
      undefined,
      radius,
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
        damage: damage,
        damage_type: DamageTypes.PURE,
        ability: ability,
      });
    }

    parent.AddNewModifier(parent, ability, 'modifier_item_primordial_mandate_invuln', {
      duration: invulnDur,
    });

    Timers.CreateTimer(cooldown, () => {
      this.undyingWillReady = true;
      return undefined;
    });

    this.blockingDamage = false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.HEALTH_BONUS,
      ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
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
    const base = this.GetAbility()?.GetSpecialValueFor('bonus_damage') ?? 0;
    return base + this.getRageBonus();
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    return this.getRageAS();
  }

  GetModifierHealthBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('bonus_health') ?? 0;
  }

  private getRageBonus(): number {
    const parent = this.GetParent();
    const maxHp = parent.GetMaxHealth();
    const curHp = parent.GetHealth();
    const missingPct = Math.max(0, ((maxHp - curHp) / maxHp) * 100);
    const ability = this.GetAbility();
    if (!ability) return 0;
    const perPct = ability.GetSpecialValueFor('rage_damage_per_pct');
    const maxBonus = ability.GetSpecialValueFor('rage_max_bonus');
    return Math.min(maxBonus, missingPct * perPct);
  }

  private getRageAS(): number {
    const parent = this.GetParent();
    const maxHp = parent.GetMaxHealth();
    const curHp = parent.GetHealth();
    const missingPct = Math.max(0, ((maxHp - curHp) / maxHp) * 100);
    const ability = this.GetAbility();
    if (!ability) return 0;
    const perPct = ability.GetSpecialValueFor('rage_as_per_pct');
    const maxBonus = ability.GetSpecialValueFor('rage_max_bonus');
    return Math.min(maxBonus, missingPct * perPct);
  }
}

@registerModifier('items/ts_items/item_primordial_mandate.lua')
export class modifier_item_primordial_mandate_frenzy extends BaseModifier {
  private attackLifestealGuard: boolean = false;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'item_primordial_mandate';
  }

  OnCreated(): void {
    if (IsServer()) {
      this.StartIntervalThink(0.1);
    }
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (!parent.IsAlive()) return;

    const ability = this.GetAbility();
    if (!ability) return;

    const drainPerTick = ability.GetSpecialValueFor('toggle_hp_drain') * 0.1;
    const newHp = parent.GetHealth() - drainPerTick;
    if (newHp <= 1) {
      parent.SetHealth(1);
    } else {
      parent.SetHealth(newHp);
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.ON_ATTACK_LANDED,
    ];
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    return this.GetAbility()?.GetSpecialValueFor('toggle_attack_speed') ?? 0;
  }

  GetModifierPhysicalArmorBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('toggle_armor') ?? 0;
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    if (event.attacker !== this.GetParent()) return;
    if (this.attackLifestealGuard) return;

    const ability = this.GetAbility();
    if (!ability) return;

    const lifestealPct = ability.GetSpecialValueFor('toggle_lifesteal') / 100;
    const healAmount = event.damage * lifestealPct;
    const parent = this.GetParent();
    const newHp = Math.min(parent.GetMaxHealth(), parent.GetHealth() + healAmount);
    parent.SetHealth(newHp);
  }
}

@registerModifier('items/ts_items/item_primordial_mandate.lua')
export class modifier_item_primordial_mandate_invuln extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'item_primordial_mandate';
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.INVULNERABLE]: true,
      [ModifierState.UNTARGETABLE]: true,
    };
  }
}
