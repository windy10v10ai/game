/* eslint-disable @typescript-eslint/no-explicit-any */
import { applyAwakenByHero, canAwaken, executeReplacement, isAwakened } from './awaken-replacer';

/** 构造一个记录技能槽状态的假英雄，用于验证三分支的增删与退点数逻辑 */
function createFakeHero(opts: {
  unitName?: string;
  abilities?: { name: string; level: number }[];
  abilityPoints?: number;
}) {
  const abilities: { name: string; level: number }[] = opts.abilities ?? [];
  let abilityPoints = opts.abilityPoints ?? 0;
  const addOrder: string[] = [];

  const makeAbility = (entry: { name: string; level: number }) => ({
    GetAbilityName: () => entry.name,
    GetLevel: () => entry.level,
    // 占位防崩：替换分支实现会调用 GetMaxLevel，运行时由引擎提供真实值
    GetMaxLevel: () => 25,
    SetLevel: (lvl: number) => {
      entry.level = lvl;
    },
  });

  const hero: any = {
    GetUnitName: () => opts.unitName ?? 'npc_dota_hero_pudge',
    IsHero: () => true,
    GetAbilityPoints: () => abilityPoints,
    SetAbilityPoints: (p: number) => {
      abilityPoints = p;
    },
    GetAbilityByIndex: (i: number) => {
      const entry = abilities[i];
      return entry !== undefined ? makeAbility(entry) : undefined;
    },
    FindAbilityByName: (name: string) => {
      const entry = abilities.find((a) => a.name === name);
      return entry !== undefined ? makeAbility(entry) : undefined;
    },
    RemoveAbility: (name: string) => {
      const idx = abilities.findIndex((a) => a.name === name);
      if (idx >= 0) abilities.splice(idx, 1);
    },
    AddAbility: (name: string) => {
      const entry = { name, level: 0 };
      abilities.push(entry);
      addOrder.push(name);
      return makeAbility(entry);
    },
  };

  return { hero, abilities, addOrder, getPoints: () => abilityPoints };
}

describe('executeReplacement', () => {
  it('分支1 纯新增：直接加技能不动原有技能', () => {
    const f = createFakeHero({ abilities: [{ name: 'foo', level: 2 }] });
    executeReplacement(f.hero, {
      heroName: 'npc_dota_hero_pudge',
      newAbility: 'special_bonus_unique_zuus_upgrade',
      newLevel: 1,
    });
    expect(f.abilities.map((a) => a.name)).toEqual(['foo', 'special_bonus_unique_zuus_upgrade']);
  });

  it('分支3 替换：移除旧技能、加新技能', () => {
    const f = createFakeHero({
      abilities: [{ name: 'pudge_meat_hook', level: 3 }],
    });
    executeReplacement(f.hero, {
      heroName: 'npc_dota_hero_pudge',
      targetAbility: 'pudge_meat_hook',
      newAbility: 'pudge_meat_hook_lua',
      newLevel: 0,
    });
    expect(f.abilities.map((a) => a.name)).toEqual(['pudge_meat_hook_lua']);
  });

  it('分支2 插入：原技能被移除后以原等级加回，新技能先入槽', () => {
    const f = createFakeHero({
      abilities: [
        { name: 'slot0', level: 1 },
        { name: 'slot1', level: 1 },
        { name: 'slot2', level: 1 },
        { name: 'oldUlt', level: 2 },
      ],
      abilityPoints: 0,
    });
    executeReplacement(f.hero, {
      heroName: 'npc_dota_hero_pudge',
      targetSlot: 3,
      newAbility: 'newInserted',
      newLevel: 0,
    });
    // 新技能先加回、原技能后加回（实现插入顺序）
    expect(f.addOrder).toEqual(['newInserted', 'oldUlt']);
    // 原技能等级恢复为 2，并退回 2 点
    expect(f.abilities.find((a) => a.name === 'oldUlt')?.level).toBe(2);
    expect(f.getPoints()).toBe(2);
  });

  it('分支2 跳过 generic_hidden 空槽，走替换逻辑直接加新技能', () => {
    const f = createFakeHero({
      abilities: [{ name: 'generic_hidden', level: 0 }],
      abilityPoints: 0,
    });
    executeReplacement(f.hero, {
      heroName: 'npc_dota_hero_pudge',
      targetSlot: 0,
      newAbility: 'newInserted',
      newLevel: 0,
    });
    expect(f.abilities.some((a) => a.name === 'newInserted')).toBe(true);
  });

  it('inheritLevelFrom：插入到关联技能所在槽位时，新技能继承该技能当前等级', () => {
    const f = createFakeHero({
      abilities: [
        { name: 'slot0', level: 1 },
        { name: 'slot1', level: 1 },
        { name: 'slot2', level: 1 },
        { name: 'axe_culling_blade', level: 3 },
      ],
    });
    executeReplacement(f.hero, {
      heroName: 'npc_dota_hero_axe',
      targetSlot: 3,
      newAbility: 'axe_auto_culling_blade',
      newLevel: 0,
      inheritLevelFrom: 'axe_culling_blade',
    });
    // newLevel=0 但继承大招等级 3
    expect(f.abilities.find((a) => a.name === 'axe_auto_culling_blade')?.level).toBe(3);
    // 大招仍被恢复到原等级
    expect(f.abilities.find((a) => a.name === 'axe_culling_blade')?.level).toBe(3);
  });

  it('inheritLevelFrom：纯新增分支继承关联技能等级', () => {
    const f = createFakeHero({
      abilities: [{ name: 'linkedUlt', level: 4 }],
    });
    executeReplacement(f.hero, {
      heroName: 'npc_dota_hero_pudge',
      newAbility: 'newPassive',
      newLevel: 0,
      inheritLevelFrom: 'linkedUlt',
    });
    expect(f.abilities.find((a) => a.name === 'newPassive')?.level).toBe(4);
  });
});

describe('applyAwakenByHero', () => {
  it('命中配置的英雄返回 true 并应用替换', () => {
    const f = createFakeHero({
      unitName: 'npc_dota_hero_pudge',
      abilities: [{ name: 'pudge_meat_hook', level: 1 }],
    });
    const result = applyAwakenByHero(f.hero);
    expect(result).toBe(true);
    expect(f.abilities.some((a) => a.name === 'pudge_meat_hook_lua')).toBe(true);
  });

  it('未配置的英雄返回 false 且不改动技能', () => {
    const f = createFakeHero({
      unitName: 'npc_dota_hero_tinker',
      abilities: [{ name: 'tinker_laser', level: 1 }],
    });
    const result = applyAwakenByHero(f.hero);
    expect(result).toBe(false);
    expect(f.abilities.map((a) => a.name)).toEqual(['tinker_laser']);
  });

  it('已觉醒的英雄重复使用：返回 false 且不重复添加技能', () => {
    const f = createFakeHero({
      unitName: 'npc_dota_hero_pudge',
      abilities: [{ name: 'pudge_meat_hook', level: 1 }],
    });
    // 第一次觉醒
    expect(applyAwakenByHero(f.hero)).toBe(true);
    const afterFirst = f.abilities.map((a) => a.name);
    // 第二次：已有 newAbility，应跳过且不消耗
    expect(applyAwakenByHero(f.hero)).toBe(false);
    expect(f.abilities.map((a) => a.name)).toEqual(afterFirst);
    expect(f.abilities.filter((a) => a.name === 'pudge_meat_hook_lua').length).toBe(1);
  });
});

describe('canAwaken', () => {
  it('配置表内的英雄返回 true', () => {
    const f = createFakeHero({ unitName: 'npc_dota_hero_pudge' });
    expect(canAwaken(f.hero)).toBe(true);
  });

  it('未配置的英雄返回 false', () => {
    const f = createFakeHero({ unitName: 'npc_dota_hero_tinker' });
    expect(canAwaken(f.hero)).toBe(false);
  });
});

describe('isAwakened', () => {
  it('未配置的英雄返回 false', () => {
    const f = createFakeHero({ unitName: 'npc_dota_hero_tinker' });
    expect(isAwakened(f.hero)).toBe(false);
  });

  it('支持但未觉醒返回 false', () => {
    const f = createFakeHero({
      unitName: 'npc_dota_hero_pudge',
      abilities: [{ name: 'pudge_meat_hook', level: 1 }],
    });
    expect(isAwakened(f.hero)).toBe(false);
  });

  it('觉醒后返回 true', () => {
    const f = createFakeHero({
      unitName: 'npc_dota_hero_pudge',
      abilities: [{ name: 'pudge_meat_hook', level: 1 }],
    });
    applyAwakenByHero(f.hero);
    expect(isAwakened(f.hero)).toBe(true);
  });
});
