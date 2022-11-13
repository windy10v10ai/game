import { Player, PlayerDto } from "../../api/player";
import { property_cast_range_bonus_stacking, property_cooldown_percentage, property_status_resistance_stacking } from "./property_declare";

export class PropertyController {
    private propertyValuePerLevel = new Map<string, number>();
    constructor() {
        // load property
        this.propertyValuePerLevel.set(property_cooldown_percentage.name, 4);
        this.propertyValuePerLevel.set(property_status_resistance_stacking.name, 4);
        this.propertyValuePerLevel.set(property_cast_range_bonus_stacking.name, 25);
    }

    public InitPlayerProperty(hero: CDOTA_BaseNPC_Hero) {
        if (!hero) {
            return;
        }

        const steamId = PlayerResource.GetSteamAccountID(hero.GetPlayerOwnerID());
        const playerInfo = Player.playerList.find((player) => player.id == steamId.toString());

        if (!playerInfo?.properties) {
            return;
        }

        for (const property of playerInfo.properties) {
            const propertyValuePerLevel = this.propertyValuePerLevel.get(property.name);
            if (propertyValuePerLevel) {
                // add property modifer to player
                hero.AddNewModifier(hero, undefined, property.name, {
                    value: propertyValuePerLevel * property.level
                });
            }
        }
    }
}
