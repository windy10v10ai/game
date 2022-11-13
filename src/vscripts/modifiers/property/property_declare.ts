import { registerModifier } from "../../lib/dota_ts_adapter";
import { PropertyBaseModifier } from "./property_base";

@registerModifier()
export class property_cooldown_percentage extends PropertyBaseModifier {
    // Declare functions
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.COOLDOWN_PERCENTAGE];
    }
    GetModifierPercentageCooldown(): number {
        return this.value;
    }
}

@registerModifier()
export class property_status_resistance_stacking extends PropertyBaseModifier {
    // Declare functions
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATUS_RESISTANCE_STACKING];
    }
    GetModifierStatusResistanceStacking(): number {
        return this.value;
    }
}


@registerModifier()
export class property_cast_range_bonus_stacking extends PropertyBaseModifier {
    // Declare functions
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.CAST_RANGE_BONUS_STACKING];
    }
    GetModifierCastRangeBonusStacking(event: ModifierAbilityEvent): number {
        return this.value;
    }
}
