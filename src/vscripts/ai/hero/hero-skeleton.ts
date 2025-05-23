import { registerModifier } from '../../utils/dota_ts_adapter';
import { reloadable } from '../../utils/tstl-utils';
import { ActionAbility } from '../action/action-ability';
import { BotBaseAIModifier } from './bot-base';

@reloadable
@registerModifier()
export class SkeletonAIModifier extends BotBaseAIModifier {
  override UseAbilityEnemy(): boolean {
    // 冥火爆击
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, 'skeleton_king_hellfire_blast')) {
      return true;
    }
    return false;
  }
}
