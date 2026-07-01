/**
 * 测试 InitializeHeroBuild 函数的输出
 */

import { HeroBuilds } from './hero-build-config';
import { HeroTemplate } from './hero-build-config-template';
import { InitializeHeroBuild } from './hero-build-state';
import { ItemTier } from './item-tier-config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;
// eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
declare var console: any;

// Mock print function
global.print = jest.fn();
global.GameRules = {
  Option: { direGoldXpMultiplier: 1 },
};
// 沿用 weighted-pool.test.ts 同款 RandomFloat(min, max) 签名
global.RandomFloat = (min: number, max: number) => min + Math.random() * (max - min);

function createMockHero(unitName: string, primaryAttribute: Attributes = Attributes.AGILITY) {
  return {
    GetUnitName: () => unitName,
    GetPrimaryAttribute: () => primaryAttribute,
  } as CDOTA_BaseNPC_Hero;
}

describe('InitializeHeroBuild', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.GameRules = {
      Option: { direGoldXpMultiplier: 1 },
    };
  });

  // it('测试 1: Luna 的完整配置', () => {
  //   const mockHero = {
  //     GetUnitName: () => 'npc_dota_hero_luna',
  //   } as CDOTA_BaseNPC_Hero;

  //   const lunaConfig = {
  //     template: HeroTemplate.AgilityCarryRanged,
  //     targetItemsByTier: {
  //       [ItemTier.T3]: ['item_monkey_king_bar_2'],
  //       [ItemTier.T4]: [
  //         'item_excalibur',
  //         'item_skadi_2',
  //         'item_satanic_2',
  //         'item_black_king_bar_2',
  //       ],
  //     },
  //   };

  //   const result = InitializeHeroBuild(mockHero, lunaConfig);

  //   // 打印结果供查看
  //   // eslint-disable-next-line no-console
  //   console.log('\n========== Luna 配置结果 ==========');
  //   // eslint-disable-next-line no-console
  //   console.log('currentTier:', result.currentTier);
  //   // eslint-disable-next-line no-console
  //   console.log('T1:', result.resolvedItems[ItemTier.T1]);
  //   // eslint-disable-next-line no-console
  //   console.log('T2:', result.resolvedItems[ItemTier.T2]);
  //   // eslint-disable-next-line no-console
  //   console.log('T3:', result.resolvedItems[ItemTier.T3]);
  //   // eslint-disable-next-line no-console
  //   console.log('T4:', result.resolvedItems[ItemTier.T4]);
  //   // eslint-disable-next-line no-console
  //   console.log('T5:', result.resolvedItems[ItemTier.T5]);

  //   expect(result.currentTier).toBe(ItemTier.T1);
  //   expect(result.resolvedItems[ItemTier.T3]).toContain('item_monkey_king_bar_2');
  //   expect(result.resolvedItems[ItemTier.T4]).toContain('item_excalibur');
  // });

  // it('测试 2: Lion 的法师配置', () => {
  //   const mockHero = {
  //     GetUnitName: () => 'npc_dota_hero_lion',
  //   } as CDOTA_BaseNPC_Hero;

  //   const lionConfig = {
  //     template: HeroTemplate.MagicalCarry,
  //     targetItemsByTier: {
  //       [ItemTier.T3]: ['item_aeon_pendant'],
  //       [ItemTier.T4]: [
  //         'item_hallowed_scepter',
  //         'item_necronomicon_staff',
  //         'item_refresh_core',
  //         'item_arcane_blink',
  //       ],
  //     },
  //   };

  //   const result = InitializeHeroBuild(mockHero, lionConfig);

  //   // eslint-disable-next-line no-console
  //   console.log('\n========== Lion 配置结果 ==========');
  //   // eslint-disable-next-line no-console
  //   console.log('currentTier:', result.currentTier);
  //   // eslint-disable-next-line no-console
  //   console.log('T1:', result.resolvedItems[ItemTier.T1]);
  //   // eslint-disable-next-line no-console
  //   console.log('T2:', result.resolvedItems[ItemTier.T2]);
  //   // eslint-disable-next-line no-console
  //   console.log('T3:', result.resolvedItems[ItemTier.T3]);
  //   // eslint-disable-next-line no-console
  //   console.log('T4:', result.resolvedItems[ItemTier.T4]);
  //   // eslint-disable-next-line no-console
  //   console.log('T5:', result.resolvedItems[ItemTier.T5]);

  //   expect(result.currentTier).toBe(ItemTier.T1);
  //   expect(result.resolvedItems[ItemTier.T3]).toContain('item_aeon_pendant');
  // });

  // it('测试 3: 默认 AgilityCarryRanged 模板（无自定义配置）', () => {
  //   const mockHero = {
  //     GetUnitName: () => 'npc_dota_hero_test',
  //   } as CDOTA_BaseNPC_Hero;

  //   const defaultConfig = {
  //     template: HeroTemplate.AgilityCarryRanged,
  //   };

  //   const result = InitializeHeroBuild(mockHero, defaultConfig);

  //   // eslint-disable-next-line no-console
  //   console.log('\n========== 默认 AgilityCarryRanged 配置结果 ==========');
  //   // eslint-disable-next-line no-console
  //   console.log('currentTier:', result.currentTier);
  //   // eslint-disable-next-line no-console
  //   console.log('T1:', result.resolvedItems[ItemTier.T1]);
  //   // eslint-disable-next-line no-console
  //   console.log('T2:', result.resolvedItems[ItemTier.T2]);
  //   // eslint-disable-next-line no-console
  //   console.log('T3:', result.resolvedItems[ItemTier.T3]);
  //   // eslint-disable-next-line no-console
  //   console.log('T4:', result.resolvedItems[ItemTier.T4]);
  //   // eslint-disable-next-line no-console
  //   console.log('T5:', result.resolvedItems[ItemTier.T5]);

  //   expect(result.currentTier).toBe(ItemTier.T1);
  //   // 默认配置应该为每个 tier 填充了 template 中的装备
  //   expect(result.resolvedItems[ItemTier.T1].length).toBeGreaterThan(0);
  // });

  // it('测试 4: Axe 的力量坦克配置', () => {
  //   const mockHero = {
  //     GetUnitName: () => 'npc_dota_hero_axe',
  //   } as CDOTA_BaseNPC_Hero;

  //   const axeConfig = {
  //     template: HeroTemplate.StrengthTank,
  //     targetItemsByTier: {
  //       [ItemTier.T3]: ['item_blade_mail_2', 'item_radiance_2'],
  //       [ItemTier.T4]: [
  //         'item_undying_heart',
  //         'item_shivas_guard_2',
  //         'item_black_king_bar_2',
  //         'item_jump_jump_jump',
  //       ],
  //     },
  //   };

  //   const result = InitializeHeroBuild(mockHero, axeConfig);

  //   // eslint-disable-next-line no-console
  //   console.log('\n========== Axe 配置结果 ==========');
  //   // eslint-disable-next-line no-console
  //   console.log('currentTier:', result.currentTier);
  //   // eslint-disable-next-line no-console
  //   console.log('T1:', result.resolvedItems[ItemTier.T1]);
  //   // eslint-disable-next-line no-console
  //   console.log('T2:', result.resolvedItems[ItemTier.T2]);
  //   // eslint-disable-next-line no-console
  //   console.log('T3:', result.resolvedItems[ItemTier.T3]);
  //   // eslint-disable-next-line no-console
  //   console.log('T4:', result.resolvedItems[ItemTier.T4]);
  //   // eslint-disable-next-line no-console
  //   console.log('T5:', result.resolvedItems[ItemTier.T5]);

  //   expect(result.currentTier).toBe(ItemTier.T1);
  //   expect(result.resolvedItems[ItemTier.T3]).toContain('item_blade_mail_2');
  //   expect(result.resolvedItems[ItemTier.T4]).toContain('item_jump_jump_jump');
  // });

  // it('测试 5: 配置超过 6 个装备时只取前 6 个', () => {
  //   const mockHero = {
  //     GetUnitName: () => 'npc_dota_hero_test_overflow',
  //   } as CDOTA_BaseNPC_Hero;

  //   const overflowConfig = {
  //     template: HeroTemplate.AgilityCarryRanged,
  //     targetItemsByTier: {
  //       [ItemTier.T4]: [
  //         'item_1',
  //         'item_2',
  //         'item_3',
  //         'item_4',
  //         'item_5',
  //         'item_6',
  //         'item_7', // 第 7 个，应该被截断
  //         'item_8', // 第 8 个，应该被截断
  //       ],
  //     },
  //   };

  //   const result = InitializeHeroBuild(mockHero, overflowConfig);

  //   // eslint-disable-next-line no-console
  //   console.log('\n========== 溢出测试配置结果 ==========');
  //   // eslint-disable-next-line no-console
  //   console.log('T4 长度:', result.resolvedItems[ItemTier.T4].length);
  //   // eslint-disable-next-line no-console
  //   console.log('T4:', result.resolvedItems[ItemTier.T4]);

  //   // 验证只有前 6 个装备
  //   expect(result.resolvedItems[ItemTier.T4].length).toBe(6);
  //   expect(result.resolvedItems[ItemTier.T4]).toContain('item_1');
  //   expect(result.resolvedItems[ItemTier.T4]).toContain('item_6');
  //   expect(result.resolvedItems[ItemTier.T4]).not.toContain('item_7');
  //   expect(result.resolvedItems[ItemTier.T4]).not.toContain('item_8');
  // });

  it('英雄专属候选池完全替代模板池：T2 只有 2 项时结果长度为 2 且不含模板独有条目', () => {
    const mockHero = createMockHero('npc_dota_hero_test_pool_override');
    const config = {
      template: HeroTemplate.StrengthTank,
      targetItemsByTier: {
        // T3/T4/T5 也固定为无前置装备的条目，避免 FillPrerequisiteItems 回填 T2 干扰断言
        [ItemTier.T2]: ['item_blink', 'item_blade_mail'],
        [ItemTier.T3]: ['item_heart'],
        [ItemTier.T4]: ['item_insight_armor'],
        [ItemTier.T5]: ['item_beast_armor'],
      },
    };

    const result = InitializeHeroBuild(mockHero, config);

    expect(result.resolvedItems[ItemTier.T2].length).toBe(2);
    expect(result.resolvedItems[ItemTier.T2]).toEqual(
      expect.arrayContaining(['item_blink', 'item_blade_mail']),
    );
    // 模板 T2 独有条目（英雄专属池未包含）不应出现
    expect(result.resolvedItems[ItemTier.T2]).not.toContain('item_echo_sabre_2');
    expect(result.resolvedItems[ItemTier.T2]).not.toContain('item_radiance');
    expect(result.resolvedItems[ItemTier.T2]).not.toContain('item_black_king_bar');
  });

  it('英雄未配置该 tier 时回退到模板候选池', () => {
    const mockHero = createMockHero('npc_dota_hero_test_template_fallback');
    const config = {
      template: HeroTemplate.StrengthTank,
      targetItemsByTier: {
        [ItemTier.T2]: ['item_blink'],
      },
    };

    const result = InitializeHeroBuild(mockHero, config);

    const templateT1Pool = ['item_phase_boots', 'item_bracer', 'item_vanguard'];
    for (const item of result.resolvedItems[ItemTier.T1]) {
      expect(templateT1Pool).toContain(item);
    }
  });

  it('难度倍率 < 9 时 T5 不解锁，resolvedItems[T5] 为空数组', () => {
    global.GameRules.Option.direGoldXpMultiplier = 5;
    const mockHero = createMockHero('npc_dota_hero_test_t5_locked');
    const config = {
      template: HeroTemplate.StrengthTank,
    };

    const result = InitializeHeroBuild(mockHero, config);

    expect(result.resolvedItems[ItemTier.T5]).toEqual([]);
  });

  it('难度倍率 >= 9 时 T5 解锁，resolvedItems[T5] 非空', () => {
    global.GameRules.Option.direGoldXpMultiplier = 10;
    const mockHero = createMockHero('npc_dota_hero_test_t5_unlocked');
    const config = {
      template: HeroTemplate.StrengthTank,
    };

    const result = InitializeHeroBuild(mockHero, config);

    expect(result.resolvedItems[ItemTier.T5].length).toBeGreaterThan(0);
  });

  it('新字段初始值正确', () => {
    const mockHero = createMockHero('npc_dota_hero_test_new_fields', Attributes.INTELLECT);
    const config = {
      template: HeroTemplate.MagicalCarry,
    };

    const result = InitializeHeroBuild(mockHero, config);

    expect(result.tomePhase).toBe(false);
    expect(result.luoshuPurchased).toBe(false);
    expect(result.tomePurchasedCount).toBe(0);
    expect(result.heroPrimaryAttribute).toBe(Attributes.INTELLECT);
  });

  // abaddon实际测试

  it('测试 6: Abaddon 的实际测试', () => {
    const mockHero = createMockHero('npc_dota_hero_abaddon');

    const abaddonConfig = HeroBuilds.npc_dota_hero_abaddon;
    const result = InitializeHeroBuild(mockHero, abaddonConfig);

    console.log(result);
  });

  it('测试 7: Axe 的实际测试', () => {
    const mockHero = createMockHero('npc_dota_hero_axe');

    const axeConfig = HeroBuilds.npc_dota_hero_axe;
    const result = InitializeHeroBuild(mockHero, axeConfig);

    console.log(result);
  });
});
