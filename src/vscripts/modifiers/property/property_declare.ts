import { registerModifier } from "../../lib/dota_ts_adapter";
import { PropertyBaseModifier } from "./property_base";

@registerModifier()
export class property_cooldown_percentage extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.COOLDOWN_PERCENTAGE];
    }
    GetModifierPercentageCooldown(): number {
        return this.value;
    }
}

@registerModifier()
export class property_status_resistance_stacking extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATUS_RESISTANCE_STACKING];
    }
    GetModifierStatusResistanceStacking(): number {
        return this.value;
    }
}


@registerModifier()
export class property_cast_range_bonus_stacking extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.CAST_RANGE_BONUS_STACKING];
    }
    GetModifierCastRangeBonusStacking(event: ModifierAbilityEvent): number {
        return this.value;
    }
}

@registerModifier()
export class property_spell_amplify_percentage extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.SPELL_AMPLIFY_PERCENTAGE];
    }
    GetModifierSpellAmplify_Percentage(): number {
        return this.value;
    }
}

@registerModifier()
export class property_magical_resistance_bonus extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MAGICAL_RESISTANCE_BONUS];
    }
    GetModifierMagicalResistanceBonus(): number {
        return this.value;
    }
}

@registerModifier()
export class property_attack_range_bonus extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACK_RANGE_BONUS];
    }
    GetModifierAttackRangeBonus(): number {
        const parent = this.GetParent();
        if (parent && parent.IsRangedAttacker()) {
            return this.value;
        }
        return 0;
    }
}

@registerModifier()
export class property_physical_armor_bonus extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierPhysicalArmorBonus(): number {
        return this.value;
    }
}

@registerModifier()
export class property_preattack_bonus_damage extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE];
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.value;
    }
}

@registerModifier()
export class property_attackspeed_bonus_constant extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT];
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.value;
    }
}

@registerModifier()
export class property_stats_strength_bonus extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATS_STRENGTH_BONUS];
    }
    GetModifierBonusStats_Strength(): number {
        return this.value;
    }
}

@registerModifier()
export class property_stats_agility_bonus extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATS_AGILITY_BONUS];
    }
    GetModifierBonusStats_Agility(): number {
        return this.value;
    }
}

@registerModifier()
export class property_stats_intellect_bonus extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATS_INTELLECT_BONUS];
    }
    GetModifierBonusStats_Intellect(): number {
        return this.value;
    }
}

@registerModifier()
export class property_health_regen_percentage extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.HEALTH_REGEN_PERCENTAGE];
    }
    GetModifierHealthRegenPercentage(): number {
        return this.value;
    }
}

@registerModifier()
export class property_mana_regen_total_percentage extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MANA_REGEN_TOTAL_PERCENTAGE];
    }
    GetModifierTotalPercentageManaRegen(): number {
        return this.value;
    }
}


@registerModifier()
export class property_lifesteal extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED];
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        // @ts-ignore
        TsLifeStealOnAttackLanded(event, this.value, this.GetParent(), this)
    }
}


@registerModifier()
export class property_spell_lifesteal extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_TAKEDAMAGE];
    }
    OnTakeDamage(event: ModifierInstanceEvent): void {
        // @ts-ignore
        TsSpellLifeSteal(event, this, this.value)
    }
}

@registerModifier()
export class property_movespeed_bonus_constant extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_CONSTANT];
    }
    GetModifierMoveSpeedBonus_Constant(): number {
        return this.value;
    }
}

@registerModifier()
export class property_ignore_movespeed_limit extends PropertyBaseModifier {
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.IGNORE_MOVESPEED_LIMIT,
            ModifierFunction.MOVESPEED_LIMIT
        ];
    }
    GetModifierIgnoreMovespeedLimit(): 0 | 1 {
        return 1;
    }
    GetModifierMoveSpeed_Limit(): number {
        return 5000;
    }
}

@registerModifier()
export class property_cannot_miss extends PropertyBaseModifier {
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.CANNOT_MISS]: true
        };
    }
}
