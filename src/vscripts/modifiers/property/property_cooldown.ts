import { BaseModifier, registerModifier } from "../../lib/dota_ts_adapter";

@registerModifier()
export class ModifierPropertyCooldown extends BaseModifier {
    value!: number;

    IsPurgable(): boolean {
        return false;
    }
    RemoveOnDeath(): boolean {
        return false;
    }
    IsHidden(): boolean {
        return true;
    }

    OnCreated(kv: { value: number }) {
        if (IsClient()) return;
        // @ts-ignore
        TsPrint(`${this.GetClass()} Created with value: ${kv.value}`);

        this.value = kv.value;
        this.SetHasCustomTransmitterData(true);
    }


    AddCustomTransmitterData(): { value: number } {
        return {
            value: this.value,
        };
    }

    HandleCustomTransmitterData(data: { value: number }) {
        this.value = data.value;
    }

    // Declare functions
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.COOLDOWN_PERCENTAGE];
    }
    GetModifierPercentageCooldown(): number {
        return this.value;
    }
}
