import { ModeBase } from "./mode-base";
import { ModeEnum } from "./mode-enum";
import { ModeLaning } from "./mode-laning";
import { ModePush } from "./mode-push";

export class FSA {
  // 切换模式的阈值
  public static readonly MODE_SWITCH_THRESHOLD = 0.6;

  ModeList: ModeBase[] = [];
  constructor() {
    this.ModeList.push(new ModeLaning());
    this.ModeList.push(new ModePush());
  }

  GetMode(currentMode: ModeEnum, hero: CDOTA_BaseNPC): ModeEnum {
    let maxDesire = 0;
    let desireMode: ModeEnum | undefined;
    for (const mode of this.ModeList) {
      if (mode.mode === currentMode) {
        continue;
      }

      const desire = mode.GetDesire(hero);
      if (desire > maxDesire) {
        maxDesire = desire;
        desireMode = mode.mode;
      }
    }

    if (maxDesire > FSA.MODE_SWITCH_THRESHOLD) {
      print(`[AI] hero ${hero.GetUnitName()} desire to switch mode to ${desireMode}`);
      return desireMode!;
    } else {
      return currentMode;
    }
  }
}
