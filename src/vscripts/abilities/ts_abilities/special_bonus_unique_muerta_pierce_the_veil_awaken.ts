import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const PIERCE_THE_VEIL_BUFF = 'modifier_muerta_pierce_the_veil_buff';
const PIERCE_THE_VEIL_ABILITY = 'muerta_pierce_the_veil';
const DEBUFF_IMMUNITY_BUFF = 'modifier_black_king_bar_immune';
const BEAST_SHIELD_ACTIVE_BUFF = 'modifier_item_beast_shield_active';
const PIERCE_THE_VEIL_ICON = 'muerta_pierce_the_veil';
const DEBUFF_IMMUNITY_RESISTANCE_SPECIALS: Record<string, string> = {
  item_black_king_bar: 'spell_reduce',
  item_black_king_bar_2: 'spell_reduce',
  item_beast_shield: 'magic_resist',
};
const FULL_MAGIC_RESISTANCE_THRESHOLD = 0.999;
let damageFilterRegistered = false;
let replayingDebuffImmunityDamage = false;

function getDebuffImmunityResistanceFromAbility(
  ability: CDOTABaseAbility | undefined,
): number | undefined {
  if (!ability || ability.IsNull()) return undefined;

  const specialName = DEBUFF_IMMUNITY_RESISTANCE_SPECIALS[ability.GetAbilityName()];
  if (!specialName) return undefined;
  return ability.GetSpecialValueFor(specialName);
}

function getActiveDebuffImmunityResistance(target: CDOTA_BaseNPC): number | undefined {
  const immunityModifiers = target.FindAllModifiersByName(DEBUFF_IMMUNITY_BUFF);
  if (immunityModifiers.length === 0) return undefined;

  let effectiveResistance: number | undefined;
  for (const modifier of immunityModifiers) {
    const resistance = getDebuffImmunityResistanceFromAbility(modifier.GetAbility());
    if (resistance !== undefined) {
      effectiveResistance = Math.max(effectiveResistance ?? resistance, resistance);
    }
  }

  // 同名减益免疫 modifier 刷新时不保证保留生效来源，因此用独立主动 modifier 补充解析。
  const beastShieldActive = target.FindModifierByName(BEAST_SHIELD_ACTIVE_BUFF);
  if (beastShieldActive && !beastShieldActive.IsNull()) {
    const resistance = getDebuffImmunityResistanceFromAbility(beastShieldActive.GetAbility());
    if (resistance !== undefined) {
      effectiveResistance = Math.max(effectiveResistance ?? resistance, resistance);
    }
  }

  return effectiveResistance;
}

function hasActiveMuertaAwaken(attacker: CDOTA_BaseNPC): boolean {
  const modifier = attacker.FindModifierByName(
    modifier_special_bonus_unique_muerta_pierce_the_veil_awaken.name,
  );
  if (!modifier || modifier.IsNull()) return false;

  const ability = modifier.GetAbility();
  return !!ability && !ability.IsNull() && ability.GetLevel() > 0 && ability.IsActivated();
}

function isPierceTheVeilMagicAttack(event: DamageFilterEvent): boolean {
  if (event.damagetype_const !== DamageTypes.MAGICAL) return false;

  const inflictorIndex = event.entindex_inflictor_const;
  if (inflictorIndex === undefined || inflictorIndex <= 0) return true;

  const inflictor = EntIndexToHScript(inflictorIndex) as CDOTABaseAbility | undefined;
  return isPierceTheVeilInflictor(inflictor);
}

function isPierceTheVeilInflictor(inflictor: CDOTABaseAbility | undefined): boolean {
  return (
    !inflictor || (!inflictor.IsNull() && inflictor.GetAbilityName() === PIERCE_THE_VEIL_ABILITY)
  );
}

function filterMuertaPierceTheVeilDamage(event: DamageFilterEvent): boolean {
  if (replayingDebuffImmunityDamage) return true;

  if (!isPierceTheVeilMagicAttack(event)) return true;

  const attacker = EntIndexToHScript(event.entindex_attacker_const) as CDOTA_BaseNPC | undefined;
  const victim = EntIndexToHScript(event.entindex_victim_const) as CDOTA_BaseNPC | undefined;
  if (
    !attacker ||
    attacker.IsNull() ||
    attacker.IsIllusion() ||
    !victim ||
    victim.IsNull() ||
    victim.GetTeamNumber() === attacker.GetTeamNumber() ||
    !hasActiveMuertaAwaken(attacker) ||
    !attacker.HasModifier(PIERCE_THE_VEIL_BUFF)
  ) {
    return true;
  }

  const immunityResistance = getActiveDebuffImmunityResistance(victim);
  if (immunityResistance === undefined || immunityResistance <= 0) return true;

  // 满魔抗无法通过除法反算，因此交由攻击落地事件重放；其余只抵消识别到的免疫来源。
  const resistance = Math.min(immunityResistance / 100, 1);
  if (resistance >= FULL_MAGIC_RESISTANCE_THRESHOLD) return false;

  event.damage /= Math.max(1 - resistance, 0.001);
  return true;
}

function registerMuertaDamageFilter(): void {
  if (damageFilterRegistered) return;

  const gameMode = GameRules.GetGameModeEntity();
  gameMode.SetDamageFilter((event) => filterMuertaPierceTheVeilDamage(event), gameMode);
  damageFilterRegistered = true;
}

@registerAbility('special_bonus_unique_muerta_pierce_the_veil_awaken')
export class SpecialBonusUniqueMuertaPierceTheVeilAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_muerta_pierce_the_veil_awaken.name;
  }
}

/** 琼英碧灵“越界”觉醒控制器。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_muerta_pierce_the_veil_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_muerta_pierce_the_veil_awaken extends BaseModifier {
  private spellLifesteal = 30;
  private spellAmpPerKill = 2;
  private stackCollectionRange = 925;

  OnCreated(): void {
    this.refreshValues();
    if (IsServer()) registerMuertaDamageFilter();
  }

  OnRefresh(): void {
    this.refreshValues();
  }

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsBuff(): boolean {
    return true;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return false;
  }

  GetTexture(): string {
    return PIERCE_THE_VEIL_ICON;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_DEATH,
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.ON_ATTACK_LANDED,
      ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  GetModifierSpellAmplify_Percentage(): number {
    return this.GetStackCount() * this.spellAmpPerKill;
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer() || !this.isFullyImmuneDebuffAttack(event)) return;

    const parent = this.GetParent();
    const ability = this.GetAbility();
    const target = event.target;
    if (!ability || ability.IsNull()) return;

    const attackDamage = Math.max(event.original_damage, 0);
    if (attackDamage <= 0) return;

    // 满魔抗路径需绕过魔抗并预乘正常抗性，避免重复触发攻击或攻击方增幅。
    const normalMagicMultiplier = 1 - this.getMagicResistanceWithoutBkb(target);
    const replacementDamage = attackDamage * Math.max(normalMagicMultiplier, 0);
    if (replacementDamage <= 0) return;

    replayingDebuffImmunityDamage = true;
    try {
      ApplyDamage({
        victim: target,
        attacker: parent,
        damage: replacementDamage,
        damage_type: DamageTypes.MAGICAL,
        damage_flags:
          DamageFlag.IGNORES_MAGIC_ARMOR +
          DamageFlag.NO_SPELL_AMPLIFICATION +
          DamageFlag.MAGIC_AUTO_ATTACK +
          DamageFlag.NO_REFLECTION,
        ability,
      });
    } finally {
      replayingDebuffImmunityDamage = false;
    }
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer() || !this.isAwakenActive()) return;

    const parent = this.GetParent();
    if (parent.IsIllusion() || !parent.HasModifier(PIERCE_THE_VEIL_BUFF)) return;

    TsSpellLifeSteal(event, this.spellLifesteal, parent, true);
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer() || !this.isAwakenActive()) return;

    const parent = this.GetParent();
    const victim = event.unit;
    if (
      parent.IsIllusion() ||
      !parent.HasModifier(PIERCE_THE_VEIL_BUFF) ||
      !victim ||
      victim.IsNull() ||
      !victim.IsRealHero() ||
      victim.IsIllusion() ||
      victim.IsReincarnating() ||
      victim.GetTeamNumber() === parent.GetTeamNumber()
    ) {
      return;
    }

    const personallyKilled = event.attacker === parent;
    const diedNearby =
      victim.GetAbsOrigin().__sub(parent.GetAbsOrigin()).Length2D() <= this.stackCollectionRange;
    if (!personallyKilled && !diedNearby) return;

    this.SetStackCount(this.GetStackCount() + 1);
  }

  OnTooltip(): number {
    return this.spellAmpPerKill;
  }

  OnTooltip2(): number {
    return this.spellLifesteal;
  }

  private refreshValues(): void {
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    this.spellLifesteal = ability.GetSpecialValueFor('spell_lifesteal');
    this.spellAmpPerKill = ability.GetSpecialValueFor('spell_amp_per_kill');
    this.stackCollectionRange = ability.GetSpecialValueFor('stack_collection_range');
  }

  private isAwakenActive(): boolean {
    const ability = this.GetAbility();
    return !!ability && !ability.IsNull() && ability.GetLevel() > 0 && ability.IsActivated();
  }

  private isFullyImmuneDebuffAttack(event: ModifierAttackEvent): boolean {
    if (!this.isAwakenActive() || event.attacker !== this.GetParent()) return false;

    const parent = this.GetParent();
    const target = event.target;
    if (!target || target.IsNull()) return false;

    const immunityResistance = getActiveDebuffImmunityResistance(target);
    return (
      !parent.IsIllusion() &&
      parent.HasModifier(PIERCE_THE_VEIL_BUFF) &&
      isPierceTheVeilInflictor(event.inflictor) &&
      target.GetTeamNumber() !== parent.GetTeamNumber() &&
      immunityResistance !== undefined &&
      immunityResistance / 100 >= FULL_MAGIC_RESISTANCE_THRESHOLD
    );
  }

  private getMagicResistanceWithoutBkb(target: CDOTA_BaseNPC): number {
    const totalResistance = this.normalizeResistance(
      target.Script_GetMagicalArmorValue(this.GetAbility() ?? {}),
    );

    // 穿透来源能排除满免疫时直接采用；饱和值不可逆，只能回退到基础魔抗。
    if (totalResistance < FULL_MAGIC_RESISTANCE_THRESHOLD) {
      return this.clampResistance(totalResistance);
    }
    return this.clampResistance(target.GetBaseMagicalResistanceValue() / 100);
  }

  private normalizeResistance(value: number): number {
    return Math.abs(value) > 1.5 ? value / 100 : value;
  }

  private clampResistance(value: number): number {
    return Math.max(-1, Math.min(value, FULL_MAGIC_RESISTANCE_THRESHOLD));
  }
}

// DamageFilter 是全局入口。模块重载时也重新注册，不能只依赖已有 intrinsic modifier 的 OnCreated。
if (IsServer()) registerMuertaDamageFilter();
