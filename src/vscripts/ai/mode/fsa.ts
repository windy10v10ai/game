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
  public static readonly MODE_SWITCH_THRESHOLD = 0.5;
  private static readonly RETREAT_HP_THRESHOLD = 25;

  ModeList: ModeBase[] = [];
  constructor() {
    this.ModeList.push(new ModeLaning());
    this.ModeList.push(new ModeAttack());
    this.ModeList.push(new ModeRetreat());
    this.ModeList.push(new ModePush());
  }

  GetMode(heroAI: BotBaseAIModifier): ModeEnum {
    const currentMode = heroAI.mode;

    const hero = heroAI.GetHero();
    const pid = hero.GetPlayerOwnerID();
    if (
      PlayerResource.IsValidPlayerID(pid) &&
      PlayerResource.IsFakeClient(pid) &&
      hero.GetHealthPercent() < FSA.RETREAT_HP_THRESHOLD
    ) {
      return ModeEnum.RETREAT;
    }

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
        print(
          `[AI] ${heroAI.GetHero().GetUnitName()} mode ${currentMode} → ${desireMode} (desire=${maxDesire})`,
        );
      }
      return desireMode!;
    } else {
      return currentMode;
    }
  }
}
