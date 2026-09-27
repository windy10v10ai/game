import type { BotMode } from '../hero/bot-base';
import { AbilitySpec, TargetSide } from './ability-spec';
import { GetCreepCondition, ShouldTryCreepSpec } from './ability-dispatcher';

const creepSpec = (condition?: AbilitySpec['condition']): AbilitySpec => ({
  abilityName: 'test_ability',
  targetSide: TargetSide.EnemyCreep,
  condition,
});

describe('creep ability policy', () => {
  it('requires two targets by default', () => {
    expect(GetCreepCondition(creepSpec()).target?.count).toEqual({ gte: 2 });
  });

  it('allows creep spells from level two by default', () => {
    expect(GetCreepCondition(creepSpec()).ability?.level).toEqual({ gte: 2 });
  });

  it('allows an explicit single-target use', () => {
    const condition = GetCreepCondition(
      creepSpec({
        target: { count: { gte: 1 } },
      }),
    );
    expect(condition.target?.count).toEqual({ gte: 1 });
  });

  it.each<BotMode>(['laning', 'push', 'farm', 'defend'])(
    'allows creep spells in %s mode',
    (mode) => {
      expect(ShouldTryCreepSpec(mode)).toBe(true);
    },
  );

  it.each<BotMode>(['fight', 'retreat', 'regroup', 'recover', 'hold'])(
    'skips creep spells in %s mode',
    (mode) => {
      expect(ShouldTryCreepSpec(mode)).toBe(false);
    },
  );
});
