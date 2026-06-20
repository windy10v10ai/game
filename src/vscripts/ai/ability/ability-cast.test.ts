import { ApplyAbilityAction } from './ability-cast';

/**
 * ApplyAbilityAction 只负责"目标状态与当前状态不一致才切换并返回 true"的分支逻辑，
 * 保证 bot 主动开关只在第一次切换那一 tick 占用 dispatcher，之后放行其他技能。
 * Dota 引擎 API（ToggleAbility / ToggleAutoCast）仅 mock 占位防崩，不断言其调用参数。
 */
function fakeAbility(state: { toggle?: boolean; autoCast?: boolean }): CDOTABaseAbility {
  return {
    GetName: () => 'fake_ability',
    GetToggleState: () => state.toggle ?? false,
    GetAutoCastState: () => state.autoCast ?? false,
    ToggleAbility: () => {
      state.toggle = !state.toggle;
    },
    ToggleAutoCast: () => {
      state.autoCast = !state.autoCast;
    },
  } as unknown as CDOTABaseAbility;
}

beforeAll(() => {
  (globalThis as Record<string, unknown>).print = () => {
    // 占位，避免 dota 全局 print 未定义
  };
});

describe('ApplyAbilityAction', () => {
  it('toggleOn switches an off ability on, returns true once', () => {
    const state = { toggle: false };
    const ability = fakeAbility(state);

    expect(ApplyAbilityAction(ability, { toggleOn: true })).toBe(true);
    expect(state.toggle).toBe(true);
    // 已开启后不再重复触发，放行其他技能
    expect(ApplyAbilityAction(ability, { toggleOn: true })).toBe(false);
  });

  it('toggleOff switches an on ability off, returns true once', () => {
    const state = { toggle: true };
    const ability = fakeAbility(state);

    expect(ApplyAbilityAction(ability, { toggleOff: true })).toBe(true);
    expect(state.toggle).toBe(false);
    expect(ApplyAbilityAction(ability, { toggleOff: true })).toBe(false);
  });

  it('autoCastOn enables autocast, returns true once', () => {
    const state = { autoCast: false };
    const ability = fakeAbility(state);

    expect(ApplyAbilityAction(ability, { autoCastOn: true })).toBe(true);
    expect(state.autoCast).toBe(true);
    expect(ApplyAbilityAction(ability, { autoCastOn: true })).toBe(false);
  });

  it('returns false when no action flag is set', () => {
    const ability = fakeAbility({});
    expect(ApplyAbilityAction(ability, {})).toBe(false);
  });
});
