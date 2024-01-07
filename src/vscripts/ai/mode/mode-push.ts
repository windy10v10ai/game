import { ModeBase } from "./mode-base";
import { ModeEnum } from "./mode-enum";

export class ModePush extends ModeBase {
  mode: ModeEnum = ModeEnum.PUSH;

  GetDesire(_hero: CDOTA_BaseNPC): number {
    // if time is less than 0:00, return 0
    const currentTime = GameRules.GetDOTATime(false, false);
    let desire = 0;
    // 每过一分钟，增加0.1的desire
    desire = Math.floor(currentTime / 60) * 0.1;
    desire = Math.min(desire, 0.8);

    // if hero level > 6, desire + 0.2
    if (_hero.GetLevel() > 6) {
      desire += 0.2;
    }

    return desire;
  }
}
