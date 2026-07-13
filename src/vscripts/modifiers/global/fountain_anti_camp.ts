import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { PlayerHelper } from '../../modules/helper/player-helper';

@registerModifier('modifiers/global/fountain_anti_camp')
export class modifier_fountain_outer_zone extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'fountain_hp_aura';
  }
}

@registerModifier('modifiers/global/fountain_anti_camp')
export class modifier_fountain_intrusion extends BaseModifier {
  private maximumAllowedHealth?: number;
  private maximumAllowedMana?: number;
  private lockEffectsCleared = false;

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'fountain_hp_aura';
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.StartIntervalThink(FrameTime());
  }

  OnIntervalThink(): void {
    if (!IsServer() || !this.isLocked()) return;

    const parent = this.GetParent();
    if (!parent.IsAlive()) return;

    if (!this.lockEffectsCleared) {
      parent.RemoveModifierByName('modifier_black_king_bar_immune');
      parent.RemoveModifierByName('modifier_item_beast_shield_active');
      parent.RemoveModifierByName('modifier_item_withered_spring_active');
      this.lockEffectsCleared = true;
    }

    const currentHealth = parent.GetHealth();
    if (this.maximumAllowedHealth === undefined) {
      this.maximumAllowedHealth = currentHealth;
    } else if (currentHealth > this.maximumAllowedHealth) {
      parent.SetHealth(this.maximumAllowedHealth);
    } else {
      this.maximumAllowedHealth = currentHealth;
    }

    const currentMana = parent.GetMana();
    if (this.maximumAllowedMana === undefined) {
      this.maximumAllowedMana = currentMana;
    } else if (currentMana > this.maximumAllowedMana) {
      parent.SetMana(this.maximumAllowedMana);
    } else {
      this.maximumAllowedMana = currentMana;
    }
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    if (!this.isLocked()) return {};

    return {
      [ModifierState.MUTED]: true,
      [ModifierState.SILENCED]: true,
      [ModifierState.PASSIVES_DISABLED]: true,
    };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.DISABLE_HEALING,
      ModifierFunction.DISABLE_MANA_GAIN,
      ModifierFunction.HEALTH_REGEN_PERCENTAGE,
      ModifierFunction.MANA_REGEN_TOTAL_PERCENTAGE,
      ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
      ModifierFunction.MP_REGEN_AMPLIFY_PERCENTAGE,
      ModifierFunction.HEAL_AMPLIFY_PERCENTAGE_TARGET,
      ModifierFunction.LIFESTEAL_AMPLIFY_PERCENTAGE,
      ModifierFunction.SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
    ];
  }

  GetDisableHealing(): 0 | 1 {
    return this.isLocked() ? 1 : 0;
  }

  GetDisableManaGain(): number {
    return this.isLocked() ? 1 : 0;
  }

  GetModifierHealthRegenPercentage(): number {
    return this.getRegenReduction();
  }

  GetModifierTotalPercentageManaRegen(): number {
    return this.getRegenReduction();
  }

  GetModifierHPRegenAmplify_Percentage(): number {
    return this.getRegenReduction();
  }

  GetModifierMPRegenAmplify_Percentage(): number {
    return this.getRegenReduction();
  }

  GetModifierHealAmplify_PercentageTarget(): number {
    return this.getRegenReduction();
  }

  GetModifierLifestealRegenAmplify_Percentage(): number {
    return this.getRegenReduction();
  }

  GetModifierSpellLifestealRegenAmplify_Percentage(): number {
    return this.getRegenReduction();
  }

  private getRegenReduction(): number {
    return this.isLocked() ? -100 : 0;
  }

  private isLocked(): boolean {
    return this.GetElapsedTime() >= 5;
  }
}

@registerModifier('modifiers/global/fountain_anti_camp')
export class modifier_fountain_attack_percent_damage extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ATTACK_LANDED];
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer()) return;

    const fountain = this.GetParent();
    const target = event.target;
    if (
      GameRules.FountainAntiCamp.IsFountainDestroyed(fountain.GetTeamNumber() as DotaTeam) ||
      event.attacker !== fountain ||
      !target ||
      !target.IsRealHero() ||
      target.GetTeamNumber() === fountain.GetTeamNumber() ||
      !PlayerHelper.IsHumanPlayer(target)
    ) {
      return;
    }

    const percent = GameRules.FountainAntiCamp.IsUnitLocked(target) ? 0.05 : 0.01;
    ApplyDamage({
      victim: target,
      attacker: fountain,
      damage: target.GetMaxHealth() * percent,
      damage_type: DamageTypes.PURE,
      damage_flags:
        DamageFlag.HPLOSS +
        DamageFlag.NO_DAMAGE_MULTIPLIERS +
        DamageFlag.NO_SPELL_AMPLIFICATION +
        DamageFlag.NO_SPELL_LIFESTEAL +
        DamageFlag.NO_REFLECTION,
    });
  }
}

@registerModifier('modifiers/global/fountain_anti_camp')
export class modifier_fountain_damage_proxy extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetDisableHealthBar(): boolean {
    return true;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.NO_HEALTH_BAR]: true,
      [ModifierState.UNSELECTABLE]: true,
      [ModifierState.NOT_ON_MINIMAP]: true,
      [ModifierState.NO_UNIT_COLLISION]: true,
    };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.MIN_HEALTH];
  }

  GetMinHealth(): number {
    return 1;
  }
}

@registerModifier('modifiers/global/fountain_anti_camp')
export class modifier_fountain_destructible extends BaseModifier {
  private destroyed = false;

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetDisableHealthBar(): boolean {
    return true;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.NO_HEALTH_BAR]: true,
      [ModifierState.UNSELECTABLE]: true,
      [ModifierState.INVULNERABLE]: true,
    };
  }

  DestroyFountain(): void {
    if (!IsServer() || this.destroyed) return;

    this.destroyed = true;
    const fountain = this.GetParent();

    fountain.Stop();
    fountain.SetAttackCapability(UnitAttackCapability.NO_ATTACK);
    fountain.SetIdleAcquire(false);
    fountain.SetAcquisitionRange(0);

    const abilityNames: string[] = [];
    for (let i = 0; i < fountain.GetAbilityCount(); i++) {
      const ability = fountain.GetAbilityByIndex(i);
      if (ability) {
        ability.SetActivated(false);
        abilityNames.push(ability.GetAbilityName());
      }
    }
    for (const abilityName of abilityNames) {
      fountain.RemoveAbility(abilityName);
    }

    GameRules.FountainAntiCamp.OnFountainDestroyed(fountain.GetTeamNumber() as DotaTeam);
  }
}

@registerModifier('modifiers/global/fountain_anti_camp')
export class modifier_fountain_damage_statistics extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_TAKEDAMAGE];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer() || event.unit !== this.GetParent() || !event.attacker) return;
    GameRules.FountainAntiCamp.RecordDamageTaken(this.GetParent(), event.attacker, event.damage);
  }
}

@registerModifier('modifiers/global/fountain_anti_camp')
export class modifier_fountain_reward_tracker extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_TAKEDAMAGE, ModifierFunction.ON_DEATH];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer() || event.unit !== this.GetParent()) return;

    const victim = this.GetParent();
    if (victim.GetHealth() <= 0 || !victim.IsAlive()) {
      GameRules.FountainAntiCamp.RecordDireBotDeath(victim, event.attacker);
    }
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer() || event.unit !== this.GetParent()) return;
    GameRules.FountainAntiCamp.RecordDireBotDeath(this.GetParent(), event.attacker);
  }
}
