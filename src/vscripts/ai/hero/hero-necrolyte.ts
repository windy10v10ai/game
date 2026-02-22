import { registerModifier } from '../../utils/dota_ts_adapter';
import { ActionAbility } from '../action/action-ability';
import { BotBaseAIModifier } from './bot-base';

@registerModifier(undefined, 'ai/hero/hero-necrolyte')
export class NecrolyteAIModifier extends BotBaseAIModifier {
  override UseAbilityEnemy(): boolean {
    // 死亡脉冲
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, 'necrolyte_death_pulse', {
        target: {
          range: 500,
        },
      })
    ) {
      return true;
    }

    // 死亡搜寻
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, 'necrolyte_death_seeker', {
        self: {
          unitCondition: {
            healthPercent: { gte: 50 },
          },
        },
      })
    ) {
      return true;
    }

    // 死神镰刀
    if (
      ActionAbility.CastAbilityOnFindEnemyHero(this, 'necrolyte_reapers_scythe', {
        target: {
          unitCondition: { healthPercent: { lte: 50 } },
        },
      })
    ) {
      return true;
    }

    return false;
  }

  override UseAbilityCreep(): boolean {
    // 死亡脉冲
    if (
      ActionAbility.CastAbilityOnFindEnemyCreep(this, 'necrolyte_death_pulse', {
        target: {
          range: 500,
        },
      })
    ) {
      return true;
    }

    return false;
  }

  override UseAbilitySelf(): boolean {
    // TODO 死亡脉冲，自己生命值低于90%时施法
    return false;
  }
}
