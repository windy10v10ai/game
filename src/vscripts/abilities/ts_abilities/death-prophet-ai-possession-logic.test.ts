import {
  extendPossessionDuration,
  runBestEffortCleanup,
  shouldExtendPossession,
  uniqueAbilityNames,
} from './death-prophet-ai-possession-logic';

describe('Death Prophet possession logic', () => {
  const baseKillContext = {
    extension: 8,
    victimIsRealHero: true,
    victimIsIllusion: false,
    victimIsReincarnating: false,
    victimTeam: 3,
    casterTeam: 2,
    attackerIsTarget: true,
    attackerIsCaster: false,
    attackerPlayerId: 6,
    casterPlayerId: 0,
    attackerOwnerIsTargetOrCaster: false,
  };

  it('被附身目标击杀当前敌方真实英雄时延长持续时间', () => {
    expect(shouldExtendPossession(baseKillContext)).toBe(true);
    expect(extendPossessionDuration(11.5, 8)).toBe(19.5);
  });

  it.each([
    { extension: 0 },
    { victimIsRealHero: false },
    { victimIsIllusion: true },
    { victimIsReincarnating: true },
    { victimTeam: 2 },
    {
      attackerIsTarget: false,
      attackerIsCaster: false,
      attackerPlayerId: 6,
      casterPlayerId: 0,
      attackerOwnerIsTargetOrCaster: false,
    },
  ])('不满足击杀条件时不延长：%o', (override) => {
    expect(shouldExtendPossession({ ...baseKillContext, ...override })).toBe(false);
  });

  it('同一玩家控制的召唤物或附身目标所有者也计为附身击杀', () => {
    expect(
      shouldExtendPossession({
        ...baseKillContext,
        attackerIsTarget: false,
        attackerPlayerId: 0,
      }),
    ).toBe(true);
    expect(
      shouldExtendPossession({
        ...baseKillContext,
        attackerIsTarget: false,
        attackerOwnerIsTargetOrCaster: true,
      }),
    ).toBe(true);
  });

  it('借用技能去重并保持首次出现顺序', () => {
    expect(uniqueAbilityNames(['active', 'passive', 'active', '', 'passive2'])).toEqual([
      'active',
      'passive',
      'passive2',
    ]);
  });

  it('某个退出阶段报错后仍继续执行其余恢复阶段', () => {
    const completed: string[] = [];
    const errors: string[] = [];
    runBestEffortCleanup(
      [
        { name: 'abilities', run: () => completed.push('abilities') },
        {
          name: 'identity',
          run: () => {
            throw new Error('identity failed');
          },
        },
        { name: 'status', run: () => completed.push('status') },
        { name: 'items', run: () => completed.push('items') },
      ],
      (name) => errors.push(name),
    );

    expect(completed).toEqual(['abilities', 'status', 'items']);
    expect(errors).toEqual(['identity']);
  });
});
