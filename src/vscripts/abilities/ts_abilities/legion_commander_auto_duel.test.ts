const mockCastImmediatelyOnTarget = jest.fn();
const mockFindEnemiesInRange = jest.fn();
const mockGetFullCastRange = jest.fn().mockReturnValue(900);
const mockCreateTimer = jest.fn();
const mockCreateParticle = jest.fn().mockReturnValue(77);
const mockEntIndexToHScript = jest.fn();

(globalThis as unknown as { Timers: { CreateTimer: jest.Mock } }).Timers = {
  CreateTimer: mockCreateTimer,
};

jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseModifier: class {},
  registerAbility: () => (ability: unknown) => ability,
  registerModifier: () => (modifier: unknown) => modifier,
}));

jest.mock('./shared/auto-cast-ability', () => ({
  AutoCastAbility: class {},
  castImmediatelyOnTarget: (...args: unknown[]) => mockCastImmediatelyOnTarget(...args),
  findEnemiesInRange: (...args: unknown[]) => mockFindEnemiesInRange(...args),
  getFullCastRange: (...args: unknown[]) => mockGetFullCastRange(...args),
}));

import * as autoDuelModule from './legion_commander_auto_duel';

const DUEL_MODIFIER = 'modifier_legion_commander_duel';
const IMMUNITY_MODIFIER = 'modifier_legion_commander_auto_duel_debuff_immunity';
const UNSELECTABLE_MODIFIER = 'modifier_legion_commander_auto_duel_target_unselectable';
const BKB_PARTICLE = 'particles/items_fx/black_king_bar_avatar.vpcf';

type MockDuelModifier = {
  SetDuration: jest.Mock;
};

type MockUnit = {
  IsIllusion: jest.Mock;
  TriggerSpellAbsorb: jest.Mock;
  FindModifierByName: jest.Mock;
  HasModifier: jest.Mock;
  AddNewModifier: jest.Mock;
  RemoveModifierByName: jest.Mock;
  entindex: jest.Mock;
  FindAbilityByName?: jest.Mock;
};

function makeUnit(isIllusion = false, entityIndex = 22): MockUnit {
  return {
    IsIllusion: jest.fn().mockReturnValue(isIllusion),
    TriggerSpellAbsorb: jest.fn().mockReturnValue(false),
    FindModifierByName: jest.fn(),
    HasModifier: jest.fn().mockReturnValue(true),
    AddNewModifier: jest.fn(),
    RemoveModifierByName: jest.fn(),
    entindex: jest.fn().mockReturnValue(entityIndex),
  };
}

function makeFixture(options?: { castable?: boolean; duration?: number; enemies?: MockUnit[] }) {
  const casterDuelModifier: MockDuelModifier = { SetDuration: jest.fn() };
  const targetDuelModifier: MockDuelModifier = { SetDuration: jest.fn() };
  const duel = {
    IsFullyCastable: jest.fn().mockReturnValue(options?.castable ?? true),
    GetSpecialValueFor: jest.fn().mockReturnValue(options?.duration ?? 5.25),
  };
  const caster = makeUnit(false, 11);
  caster.FindAbilityByName = jest.fn().mockReturnValue(duel) as never;
  caster.FindModifierByName.mockReturnValue(casterDuelModifier);

  const enemies = options?.enemies ?? [makeUnit(false, 22)];
  for (const enemy of enemies) {
    enemy.FindModifierByName.mockReturnValue(targetDuelModifier);
  }
  mockFindEnemiesInRange.mockReturnValue(enemies);

  const ability = new autoDuelModule.LegionCommanderAutoDuel();
  ability.GetSpecialValueFor = jest.fn().mockReturnValue(200) as never;

  return {
    ability,
    caster,
    casterDuelModifier,
    duel,
    enemies,
    targetDuelModifier,
  };
}

describe('LegionCommanderAutoDuel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFullCastRange.mockReturnValue(900);
  });

  it('does not search or cast while native Duel is not fully castable', () => {
    const { ability, caster } = makeFixture({ castable: false });

    ability.OnAutoCastThink(caster as never);

    expect(mockFindEnemiesInRange).not.toHaveBeenCalled();
    expect(mockCastImmediatelyOnTarget).not.toHaveBeenCalled();
  });

  it('searches native Duel range plus 200 and keeps magic-immune heroes eligible', () => {
    const { ability, caster } = makeFixture();

    ability.OnAutoCastThink(caster as never);

    expect(mockFindEnemiesInRange).toHaveBeenCalledWith(caster, 1100, UnitTargetType.HERO, true);
  });

  it('skips the nearest illusion and duels the next real hero', () => {
    const illusion = makeUnit(true);
    const realHero = makeUnit(false);
    const { ability, caster, duel } = makeFixture({ enemies: [illusion, realHero] });

    ability.OnAutoCastThink(caster as never);

    expect(mockCastImmediatelyOnTarget).toHaveBeenCalledTimes(1);
    expect(mockCastImmediatelyOnTarget).toHaveBeenCalledWith(caster, duel, realHero);
    expect(illusion.TriggerSpellAbsorb).not.toHaveBeenCalled();
  });

  it('does not consume Duel or spell block when every nearby hero is an illusion', () => {
    const firstIllusion = makeUnit(true);
    const secondIllusion = makeUnit(true);
    const { ability, caster } = makeFixture({ enemies: [firstIllusion, secondIllusion] });

    ability.OnAutoCastThink(caster as never);

    expect(firstIllusion.TriggerSpellAbsorb).not.toHaveBeenCalled();
    expect(secondIllusion.TriggerSpellAbsorb).not.toHaveBeenCalled();
    expect(mockCastImmediatelyOnTarget).not.toHaveBeenCalled();
  });

  it('consumes every passive spell-block layer before casting Duel', () => {
    const target = makeUnit(false);
    target.TriggerSpellAbsorb.mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const { ability, caster, duel } = makeFixture({ enemies: [target] });

    ability.OnAutoCastThink(caster as never);

    expect(target.TriggerSpellAbsorb).toHaveBeenCalledTimes(4);
    expect(target.TriggerSpellAbsorb).toHaveBeenNthCalledWith(1, duel);
    expect(mockCastImmediatelyOnTarget).toHaveBeenCalledWith(caster, duel, target);
  });

  it('starts a server-timed Duel controller and makes only the target unselectable', () => {
    const { ability, caster, casterDuelModifier, duel, enemies, targetDuelModifier } = makeFixture({
      duration: 6,
    });

    ability.OnAutoCastThink(caster as never);

    expect(duel.GetSpecialValueFor).toHaveBeenCalledWith('duration');
    expect(casterDuelModifier.SetDuration).toHaveBeenCalledWith(6, true);
    expect(targetDuelModifier.SetDuration).toHaveBeenCalledWith(6, true);
    expect(caster.AddNewModifier).toHaveBeenCalledWith(caster, ability, IMMUNITY_MODIFIER, {
      fixedDuration: 6,
      targetEntIndex: 22,
    });
    expect(enemies[0].AddNewModifier).toHaveBeenCalledWith(
      caster,
      ability,
      UNSELECTABLE_MODIFIER,
      {},
    );
  });

  it('retries state synchronization on the next frame when native modifiers are delayed', () => {
    const { ability, caster, casterDuelModifier, enemies, targetDuelModifier } = makeFixture({
      duration: 4.5,
    });
    caster.FindModifierByName.mockReturnValueOnce(undefined).mockReturnValue(casterDuelModifier);
    enemies[0].FindModifierByName.mockReturnValueOnce(undefined).mockReturnValue(
      targetDuelModifier,
    );

    ability.OnAutoCastThink(caster as never);

    expect(mockCreateTimer).toHaveBeenCalledTimes(1);
    expect(mockCreateTimer).toHaveBeenCalledWith(0, expect.any(Function));
    expect(caster.AddNewModifier).not.toHaveBeenCalled();
    expect(enemies[0].AddNewModifier).not.toHaveBeenCalled();

    const retry = mockCreateTimer.mock.calls[0][1] as () => void;
    retry();

    expect(casterDuelModifier.SetDuration).toHaveBeenCalledWith(4.5, true);
    expect(targetDuelModifier.SetDuration).toHaveBeenCalledWith(4.5, true);
    expect(caster.AddNewModifier).toHaveBeenCalledWith(caster, ability, IMMUNITY_MODIFIER, {
      fixedDuration: 4.5,
      targetEntIndex: 22,
    });
    expect(enemies[0].AddNewModifier).toHaveBeenCalledWith(
      caster,
      ability,
      UNSELECTABLE_MODIFIER,
      {},
    );
  });
});

describe('modifier_legion_commander_auto_duel_debuff_immunity', () => {
  function makeModifier() {
    const ModifierClass = (
      autoDuelModule as unknown as {
        modifier_legion_commander_auto_duel_debuff_immunity: new () => {
          IsHidden(): boolean;
          IsPurgable(): boolean;
          IsPurgeException(): boolean;
          GetTexture(): string;
          CheckState(): Partial<Record<ModifierState, boolean>>;
          OnCreated(params: { fixedDuration: number; targetEntIndex: EntityIndex }): void;
          OnRefresh(params: { fixedDuration: number; targetEntIndex: EntityIndex }): void;
          OnIntervalThink(): void;
          OnDestroy(): void;
          GetParent: jest.Mock;
          GetAbility: jest.Mock;
          StartIntervalThink: jest.Mock;
          Destroy: jest.Mock;
          AddParticle: jest.Mock;
          DeclareFunctions?: () => ModifierFunction[];
        };
      }
    ).modifier_legion_commander_auto_duel_debuff_immunity;
    const modifier = new ModifierClass();
    const parent = makeUnit(false, 11);
    const target = makeUnit(false, 22);
    const casterDuelModifier: MockDuelModifier = { SetDuration: jest.fn() };
    const targetDuelModifier: MockDuelModifier = { SetDuration: jest.fn() };
    parent.FindModifierByName.mockReturnValue(casterDuelModifier);
    target.FindModifierByName.mockReturnValue(targetDuelModifier);
    modifier.GetParent = jest.fn().mockReturnValue(parent);
    modifier.GetAbility = jest.fn().mockReturnValue({});
    modifier.StartIntervalThink = jest.fn();
    modifier.Destroy = jest.fn();
    modifier.AddParticle = jest.fn();
    return { modifier, parent, target, casterDuelModifier, targetDuelModifier };
  }

  beforeEach(() => {
    let gameTime = 100;
    (globalThis as unknown as { __setGameTime: (time: number) => void }).__setGameTime = (
      time: number,
    ) => {
      gameTime = time;
    };
    (globalThis as unknown as { IsServer: () => boolean }).IsServer = () => true;
    (globalThis as unknown as { GameRules: { GetGameTime: () => number } }).GameRules = {
      GetGameTime: () => gameTime,
    };
    mockEntIndexToHScript.mockReset().mockImplementation(() => makeUnit(false, 22));
    (globalThis as unknown as { EntIndexToHScript: jest.Mock }).EntIndexToHScript =
      mockEntIndexToHScript;
    (globalThis as unknown as { ParticleManager: { CreateParticle: jest.Mock } }).ParticleManager =
      {
        CreateParticle: mockCreateParticle,
      };
    (
      globalThis as unknown as {
        ParticleAttachment: { ABSORIGIN_FOLLOW: ParticleAttachment };
      }
    ).ParticleAttachment = {
      ABSORIGIN_FOLLOW: 'ABSORIGIN_FOLLOW' as unknown as ParticleAttachment,
    };
    (
      globalThis as unknown as {
        ModifierState: { DEBUFF_IMMUNE: ModifierState; UNSELECTABLE: ModifierState };
      }
    ).ModifierState = {
      DEBUFF_IMMUNE: 'DEBUFF_IMMUNE' as unknown as ModifierState,
      UNSELECTABLE: 'UNSELECTABLE' as unknown as ModifierState,
    };
    mockCreateParticle.mockClear();
  });

  it('is visible, unpurgable, uses the native Duel icon, and grants only debuff immunity', () => {
    const { modifier } = makeModifier();

    expect(modifier.IsHidden()).toBe(false);
    expect(modifier.IsPurgable()).toBe(false);
    expect(modifier.IsPurgeException()).toBe(false);
    expect(modifier.GetTexture()).toBe('legion_commander_duel');
    expect(modifier.CheckState()).toEqual({
      [ModifierState.DEBUFF_IMMUNE]: true,
    });
    expect(modifier.DeclareFunctions).toBeUndefined();
  });

  it('adds the BKB avatar particle only to Legion Commander', () => {
    const { modifier, parent, target } = makeModifier();
    mockEntIndexToHScript.mockReturnValue(target);

    modifier.OnCreated({ fixedDuration: 6, targetEntIndex: 22 as EntityIndex });

    expect(mockCreateParticle).toHaveBeenCalledWith(
      BKB_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      parent,
    );
    expect(modifier.AddParticle).toHaveBeenCalledWith(77, false, false, -1, false, false);
    expect(mockCreateParticle).not.toHaveBeenCalledWith(
      BKB_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      target,
    );
    expect(modifier.StartIntervalThink).toHaveBeenCalledWith(0.03);
  });

  it('resets the controller for an immediate level-25 recast', () => {
    const { modifier, target, casterDuelModifier } = makeModifier();
    const nextTarget = makeUnit(false, 33);
    const nextTargetDuelModifier: MockDuelModifier = { SetDuration: jest.fn() };
    nextTarget.FindModifierByName.mockReturnValue(nextTargetDuelModifier);
    mockEntIndexToHScript.mockReturnValueOnce(target).mockReturnValueOnce(nextTarget);
    modifier.OnCreated({ fixedDuration: 6, targetEntIndex: 22 as EntityIndex });

    globalThis.__setGameTime(102);
    modifier.OnRefresh({ fixedDuration: 4, targetEntIndex: 33 as EntityIndex });
    globalThis.__setGameTime(103);
    modifier.OnIntervalThink();

    expect(target.RemoveModifierByName).toHaveBeenCalledWith(UNSELECTABLE_MODIFIER);
    expect(casterDuelModifier.SetDuration).toHaveBeenLastCalledWith(3, false);
    expect(nextTargetDuelModifier.SetDuration).toHaveBeenLastCalledWith(3, false);
  });

  it('restores the server duration without repeatedly resetting the client taunt bar', () => {
    const { modifier, target, casterDuelModifier, targetDuelModifier } = makeModifier();
    mockEntIndexToHScript.mockReturnValue(target);
    target.HasModifier.mockReturnValue(true);
    modifier.OnCreated({ fixedDuration: 6, targetEntIndex: 22 as EntityIndex });

    globalThis.__setGameTime(101);
    modifier.OnIntervalThink();

    expect(casterDuelModifier.SetDuration).toHaveBeenLastCalledWith(5, false);
    expect(targetDuelModifier.SetDuration).toHaveBeenLastCalledWith(5, false);
    expect(modifier.Destroy).not.toHaveBeenCalled();
  });

  it('keeps a safety buffer until the fixed deadline, then lets Duel end', () => {
    const { modifier, target, casterDuelModifier, targetDuelModifier } = makeModifier();
    mockEntIndexToHScript.mockReturnValue(target);
    modifier.OnCreated({ fixedDuration: 6, targetEntIndex: 22 as EntityIndex });

    globalThis.__setGameTime(105.9);
    modifier.OnIntervalThink();
    expect(casterDuelModifier.SetDuration).toHaveBeenLastCalledWith(1, false);
    expect(targetDuelModifier.SetDuration).toHaveBeenLastCalledWith(1, false);

    globalThis.__setGameTime(106);
    modifier.OnIntervalThink();
    expect(casterDuelModifier.SetDuration).toHaveBeenLastCalledWith(0.01, true);
    expect(targetDuelModifier.SetDuration).toHaveBeenLastCalledWith(0.01, true);
    expect(modifier.Destroy).toHaveBeenCalledTimes(1);
  });

  it('destroys itself if either native Duel modifier ends early', () => {
    const { modifier, target } = makeModifier();
    mockEntIndexToHScript.mockReturnValue(target);
    modifier.OnCreated({ fixedDuration: 6, targetEntIndex: 22 as EntityIndex });
    target.FindModifierByName.mockReturnValue(undefined);

    modifier.OnIntervalThink();

    expect(modifier.Destroy).toHaveBeenCalledTimes(1);
  });

  it('removes the target unselectable state when the controller ends', () => {
    const { modifier, target } = makeModifier();
    mockEntIndexToHScript.mockReturnValue(target);
    modifier.OnCreated({ fixedDuration: 6, targetEntIndex: 22 as EntityIndex });

    modifier.OnDestroy();

    expect(target.RemoveModifierByName).toHaveBeenCalledWith(UNSELECTABLE_MODIFIER);
  });
});

describe('modifier_legion_commander_auto_duel_target_unselectable', () => {
  function makeModifier() {
    const ModifierClass = (
      autoDuelModule as unknown as {
        modifier_legion_commander_auto_duel_target_unselectable: new () => {
          IsHidden(): boolean;
          IsPurgable(): boolean;
          IsPurgeException(): boolean;
          GetTexture(): string;
          CheckState(): Partial<Record<ModifierState, boolean>>;
          OnCreated(): void;
          OnIntervalThink(): void;
          GetParent: jest.Mock;
          StartIntervalThink: jest.Mock;
          Destroy: jest.Mock;
        };
      }
    ).modifier_legion_commander_auto_duel_target_unselectable;
    const modifier = new ModifierClass();
    const parent = makeUnit(false, 22);
    modifier.GetParent = jest.fn().mockReturnValue(parent);
    modifier.StartIntervalThink = jest.fn();
    modifier.Destroy = jest.fn();
    return { modifier, parent };
  }

  beforeEach(() => {
    (globalThis as unknown as { IsServer: () => boolean }).IsServer = () => true;
    (
      globalThis as unknown as {
        ModifierState: { DEBUFF_IMMUNE: ModifierState; UNSELECTABLE: ModifierState };
      }
    ).ModifierState = {
      DEBUFF_IMMUNE: 'DEBUFF_IMMUNE' as unknown as ModifierState,
      UNSELECTABLE: 'UNSELECTABLE' as unknown as ModifierState,
    };
  });

  it('is a visible, unpurgable Duel state that makes only the target unselectable', () => {
    const { modifier } = makeModifier();

    expect(modifier.IsHidden()).toBe(false);
    expect(modifier.IsPurgable()).toBe(false);
    expect(modifier.IsPurgeException()).toBe(false);
    expect(modifier.GetTexture()).toBe('legion_commander_duel');
    expect(modifier.CheckState()).toEqual({
      [ModifierState.UNSELECTABLE]: true,
    });
  });

  it('ends when native Duel ends', () => {
    const { modifier, parent } = makeModifier();

    modifier.OnCreated();
    expect(modifier.StartIntervalThink).toHaveBeenCalledWith(0.03);

    parent.HasModifier.mockReturnValueOnce(true);
    modifier.OnIntervalThink();
    expect(modifier.Destroy).not.toHaveBeenCalled();

    parent.HasModifier.mockReturnValueOnce(false);
    modifier.OnIntervalThink();
    expect(parent.HasModifier).toHaveBeenCalledWith(DUEL_MODIFIER);
    expect(modifier.Destroy).toHaveBeenCalledTimes(1);
  });
});
