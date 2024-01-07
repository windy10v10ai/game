import { ModeBase } from "./mode-base";
import { ModeEnum } from "./mode-enum";

export class ModeLaning extends ModeBase {
  mode: ModeEnum = ModeEnum.LANING;

  GetDesire(_hero: CDOTA_BaseNPC): number {
    // if time is less than 0:00, return 0
    const currentTime = GameRules.GetDOTATime(false, false);
    let desire = 0;
    if (currentTime < 1) {
      desire = 0;
    } else if (currentTime < 600) {
      // 每过一分钟，减少0.1的desire
      desire = 0.8 - Math.floor(currentTime / 60) * 0.1;
    } else {
      desire = 0;
    }

    desire = Math.min(desire, 1);
    desire = Math.max(desire, 0);
    return desire;
  }
}
