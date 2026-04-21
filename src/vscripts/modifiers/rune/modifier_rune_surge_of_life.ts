import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

LinkLuaModifier('modifier_rune_surge_of_life', 'modifiers/rune/modifier_rune_surge_of_life', LuaModifierMotionType.NONE);

export const SURGE_OF_LIFE_DURATION = 12;
export const SURGE_DAMAGE_REDUCTION_PCT = -50;
export const SURGE_PERSONAL_REGEN = 150;
export const SURGE_ALLY_HEAL_PER_TICK = 150;
export const SURGE_ALLY_HEAL_RADIUS = 600;
export const SURGE_THINK_INTERVAL = 1.0;

@registerModifier('modifiers/rune/modifier_rune_surge_of_life')
export class modifier_rune_surge_of_life extends BaseModifier {
  IsHidden(): boolean { return false; }
  IsPurgable(): boolean { return false; }
  IsDebuff(): boolean { return false; }

  GetEffectName(): string { return 'particles/items2_fx/regeneration.vpcf'; }

  OnCreated(): void {
    if (IsServer()) {
      const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
      parent.SetHealth(parent.GetMaxHealth());
      parent.SetMana(parent.GetMaxMana());
    }
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.INCOMING_DAMAGE_PERCENTAGE,
      ModifierFunction.HEALTH_REGEN_CONSTANT,
    ];
  }

  GetModifierIncomingDamage_Percentage(): number { return SURGE_DAMAGE_REDUCTION_PCT; }
  GetModifierConstantHealthRegen(): number { return SURGE_PERSONAL_REGEN; }

  GetModifierInterval(): number { return SURGE_THINK_INTERVAL; }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    const allies = FindUnitsInRadius(
      parent.GetTeamNumber(),
      parent.GetAbsOrigin(),
      undefined,
      SURGE_ALLY_HEAL_RADIUS,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );
    for (const ally of allies) {
      if (ally !== parent) {
        ally.Heal(SURGE_ALLY_HEAL_PER_TICK, undefined);
      }
    }
  }
}
