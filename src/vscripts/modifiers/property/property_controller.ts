import { Player, PlayerDto } from "../../api/player";
import { property_cooldown_percentage } from "./property_cooldown_percentage";

export class PropertyController {
    private propertyValuePerLevel = new Map<string, number>();
    constructor() {
        // load property
        this.propertyValuePerLevel.set(property_cooldown_percentage.name, 4);
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
            print(`currentPlayerPropertys ${property.name} level ${property.level} `);
            const propertyValuePerLevel = this.propertyValuePerLevel.get(property.name);
            if (propertyValuePerLevel) {
                // @ts-ignore
                TsPrint(`InitPlayerProperty ${property.propertyName} `);
                // add property modifer to player
                hero.AddNewModifier(hero, undefined, property.name, {
                    value: propertyValuePerLevel * property.level
                });
            }
        }
    }
}
