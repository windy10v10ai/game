import { registerModifier } from '../../utils/dota_ts_adapter';
import { ActionAbility } from '../action/action-ability';
import { BotBaseAIModifier } from './bot-base';

@registerModifier(undefined, 'ai/hero/hero-shadow-shaman')
export class ShadowShamanAIModifier extends BotBaseAIModifier {
  override UseAbilityEnemy(): boolean {
    // 妖术
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, 'shadow_shaman_voodoo')) {
      return true;
    }

    // 苍穹震击
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, 'shadow_shaman_ether_shock')) {
      return true;
    }

    // 枷锁
    if (ActionAbility.CastAbilityOnFindEnemyHero(this, 'shadow_shaman_shackles')) {
      return true;
    }

    // 群蛇守卫
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, 'shadow_shaman_mass_serpent_ward', {
        target: { count: { gte: 2 } },
      })
    ) {
      return true;
    }

    return false;
  }

  override UseAbilityCreep(): boolean {
    // 苍穹震击
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, 'shadow_shaman_ether_shock', {
        ability: { level: { gte: 3 } },
      })
    ) {
      return true;
    }
    return false;
  }
}
