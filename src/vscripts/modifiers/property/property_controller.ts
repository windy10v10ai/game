
class Property {
    playerSteamId!: string;
    propertyName!: string;
    level!: number;
}


export class PropertyController {
    private propertys: Property[] = [];
    constructor() {
        this.propertys.push({
            playerSteamId: "136407523",
            propertyName: "move_speed",
            level: 1,
        });
    }

    public InitPlayerProperty() {
        // add
    }
}
