import { ModeEnum } from "./mode-enum";

export abstract class ModeBase {
  abstract mode: ModeEnum;

  abstract GetDesire(hero: CDOTA_BaseNPC): number;
}
