
import { BaseModifier } from "../../lib/dota_ts_adapter";
import { ModifierPropertyCooldown } from "./property_cooldown";

class Property {
    playerSteamId!: string;
    propertyName!: string;
    level!: number;
}

export class PropertyController {
    private propertyValuePerLevel = new Map<string, number>();
    private propertys: Property[] = [];
    constructor() {
        // load property
        this.propertyValuePerLevel.set(ModifierPropertyCooldown.name, 4);

        // load player data
        this.propertys.push({
            playerSteamId: "136407523",
            propertyName: "ModifierPropertyCooldown",
            level: 10,
        });
    }

    public InitPlayerProperty(hero: CDOTA_BaseNPC_Hero) {
        if (!hero) {
            return;
        }

        const steamId = PlayerResource.GetSteamAccountID(hero.GetPlayerOwnerID());
        const currentPlayerPropertys = this.propertys.filter((m) => m.playerSteamId === steamId.toString());

        for (const property of currentPlayerPropertys) {

            const propertyValuePerLevel = this.propertyValuePerLevel.get(property.propertyName);
            if (propertyValuePerLevel) {
                // @ts-ignore
                TsPrint(`InitPlayerProperty ${property.propertyName}`);
                // add property modifer to player
                hero.AddNewModifier(hero, undefined, property.propertyName, {
                    value: propertyValuePerLevel * property.level
                });
            }
        }
    }
}
