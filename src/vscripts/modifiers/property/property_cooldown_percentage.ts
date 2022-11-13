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
