import { reloadable } from '../../utils/tstl-utils';
import { BotBaseAIModifier } from '../hero/bot-base';
import { ModeAttack } from './mode-attack';
import { ModeBase } from './mode-base';
import { ModeEnum } from './mode-enum';
import { ModeLaning } from './mode-laning';
import { ModePush } from './mode-push';
import { ModeRetreat } from './mode-retreat';

@reloadable
export class FSA {
  // 切换模式的阈值
  public static readonly MODE_SWITCH_THRESHOLD = 0.5;

  ModeList: ModeBase[] = [];
  constructor() {
    this.ModeList.push(new ModeLaning());
    this.ModeList.push(new ModeAttack());
    this.ModeList.push(new ModeRetreat());
    this.ModeList.push(new ModePush());
  }

  GetMode(heroAI: BotBaseAIModifier): ModeEnum {
    const currentMode = heroAI.mode;
    let maxDesire = 0;
    let desireMode: ModeEnum | undefined;
    for (const mode of this.ModeList) {
      const desire = mode.GetDesire(heroAI);
      if (desire > maxDesire) {
        maxDesire = desire;
        desireMode = mode.mode;
      }
    }

    if (maxDesire >= FSA.MODE_SWITCH_THRESHOLD) {
      if (desireMode !== currentMode) {
        // print(`[AI] hero ${heroAI.GetHero().GetUnitName()} desire to switch mode to ${desireMode}`);
      }
      return desireMode!;
    } else {
      return currentMode;
    }
  }
}
