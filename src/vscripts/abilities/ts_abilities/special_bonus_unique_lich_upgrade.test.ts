jest.mock('../../utils/dota_ts_adapter', () => ({
  BaseAbility: class {},
  BaseModifier: class {},
  registerAbility: () => (ability: unknown) => ability,
  registerModifier: () => (modifier: unknown) => modifier,
}));

import {
  isLichChainFrostAbility,
  modifier_special_bonus_unique_lich_upgrade,
} from './special_bonus_unique_lich_upgrade';
import { SPECS as iceSpireSpecs } from '../../ai/ability/specs/lich_ice_spire';

describe('isLichChainFrostAbility', () => {
  it('accepts both the native and awakened Chain Frost ability names', () => {
    expect(isLichChainFrostAbility('lich_chain_frost')).toBe(true);
    expect(isLichChainFrostAbility('lich_chain_frost_awakened')).toBe(true);
    expect(isLichChainFrostAbility('lich_frost_nova')).toBe(false);
  });
});
type TestableLichModifier = {
  maybeAutoCastIceSpire(
    lich: CDOTA_BaseNPC_Hero,
    awaken: CDOTABaseAbility,
    target: CDOTA_BaseNPC,
  ): void;
  preserveFrostboundDuration(target: CDOTA_BaseNPC, duration: number): void;
};

describe('Lich awakening Ice Spire integration', () => {
  it('registers AI usage for the native Ice Spire only', () => {
    expect(iceSpireSpecs).toHaveLength(1);
    expect(iceSpireSpecs[0].abilityName).toBe('lich_ice_spire');
    expect(iceSpireSpecs[0].condition?.target?.count).toEqual({ gte: 1, lte: 1 });
  });
});

describe('modifier_special_bonus_unique_lich_upgrade', () => {
  beforeEach(() => {
    globalThis.IsServer = () => true;
    globalThis.FindUnitsInRadius = jest.fn() as never;
    globalThis.Timers = {
      CreateTimer: jest.fn((_delay: number, callback: () => void) => {
        callback();
        return 'test-timer';
      }),
    } as never;
    const dotaGlobals = globalThis as unknown as Record<string, unknown>;
    dotaGlobals.UnitTargetTeam = { ENEMY: 2 };
    dotaGlobals.UnitTargetType = { HERO: 1 };
    dotaGlobals.UnitTargetFlags = { FOW_VISIBLE: 1, NO_INVIS: 2 };
    dotaGlobals.FindOrder = { CLOSEST: 1 };
  });

  it('stays visible after awakening so the upgraded Chain Frost description can be inspected', () => {
    const modifier = new modifier_special_bonus_unique_lich_upgrade();

    expect(modifier.IsHidden()).toBe(false);
    expect(modifier.GetTexture()).toBe('lich_chain_frost');
  });

  it('removes the legacy awakened alias and grants the native shard once', () => {
    const lich = {
      FindAbilityByName: jest.fn().mockReturnValue({}),
      RemoveAbility: jest.fn(),
      HasModifier: jest.fn().mockReturnValue(false),
      AddItemByName: jest.fn(),
    };
    const modifier = new modifier_special_bonus_unique_lich_upgrade();
    modifier.GetParent = jest.fn().mockReturnValue(lich) as never;

    modifier.OnCreated();

    expect(lich.FindAbilityByName).toHaveBeenCalledWith('lich_ice_spire_awakened');
    expect(lich.RemoveAbility).toHaveBeenCalledWith('lich_ice_spire_awakened');
    expect(lich.HasModifier).toHaveBeenCalledWith('modifier_item_aghanims_shard');
    expect(lich.AddItemByName).toHaveBeenCalledWith('item_aghanims_shard');
  });

  it('does not grant another shard when the native shard modifier already exists', () => {
    const lich = {
      FindAbilityByName: jest.fn().mockReturnValue(undefined),
      RemoveAbility: jest.fn(),
      HasModifier: jest.fn().mockReturnValue(true),
      AddItemByName: jest.fn(),
    };
    const modifier = new modifier_special_bonus_unique_lich_upgrade();
    modifier.GetParent = jest.fn().mockReturnValue(lich) as never;

    modifier.OnRefresh();

    expect(lich.RemoveAbility).not.toHaveBeenCalled();
    expect(lich.AddItemByName).not.toHaveBeenCalled();
  });

  it('automatically casts native Ice Spire when only one real enemy hero is nearby', () => {
    const position = {} as Vector;
    const target = {
      IsRealHero: jest.fn().mockReturnValue(true),
      IsIllusion: jest.fn().mockReturnValue(false),
      IsAlive: jest.fn().mockReturnValue(true),
      GetAbsOrigin: jest.fn().mockReturnValue(position),
    } as unknown as CDOTA_BaseNPC;
    const iceSpire = {
      GetLevel: jest.fn().mockReturnValue(1),
      IsFullyCastable: jest.fn().mockReturnValue(true),
    };
    const lich = {
      FindAbilityByName: jest.fn().mockReturnValue(iceSpire),
      GetTeamNumber: jest.fn().mockReturnValue(2),
      SetCursorPosition: jest.fn(),
      CastAbilityImmediately: jest.fn(),
      GetPlayerOwnerID: jest.fn().mockReturnValue(0),
    } as unknown as CDOTA_BaseNPC_Hero;
    const awaken = {
      GetSpecialValueFor: jest.fn().mockReturnValue(1100),
    } as unknown as CDOTABaseAbility;
    globalThis.FindUnitsInRadius = jest.fn().mockReturnValue([target]) as never;
    const modifier =
      new modifier_special_bonus_unique_lich_upgrade() as unknown as TestableLichModifier;

    modifier.maybeAutoCastIceSpire(lich, awaken, target);

    expect(lich.FindAbilityByName).toHaveBeenCalledWith('lich_ice_spire');
    expect(lich.SetCursorPosition).toHaveBeenCalledWith(position);
    expect(lich.CastAbilityImmediately).toHaveBeenCalledWith(iceSpire, 0);
  });

  it('does not auto-cast Ice Spire when multiple real enemy heroes are nearby', () => {
    const target = {
      IsRealHero: jest.fn().mockReturnValue(true),
      IsIllusion: jest.fn().mockReturnValue(false),
      IsAlive: jest.fn().mockReturnValue(true),
      GetAbsOrigin: jest.fn().mockReturnValue({}),
    } as unknown as CDOTA_BaseNPC;
    const secondHero = {
      IsRealHero: jest.fn().mockReturnValue(true),
      IsIllusion: jest.fn().mockReturnValue(false),
      IsAlive: jest.fn().mockReturnValue(true),
    } as unknown as CDOTA_BaseNPC;
    const lich = {
      FindAbilityByName: jest.fn().mockReturnValue({
        GetLevel: jest.fn().mockReturnValue(1),
        IsFullyCastable: jest.fn().mockReturnValue(true),
      }),
      GetTeamNumber: jest.fn().mockReturnValue(2),
      SetCursorPosition: jest.fn(),
      CastAbilityImmediately: jest.fn(),
      GetPlayerOwnerID: jest.fn().mockReturnValue(0),
    } as unknown as CDOTA_BaseNPC_Hero;
    const awaken = {
      GetSpecialValueFor: jest.fn().mockReturnValue(1100),
    } as unknown as CDOTABaseAbility;
    globalThis.FindUnitsInRadius = jest.fn().mockReturnValue([target, secondHero]) as never;
    const modifier =
      new modifier_special_bonus_unique_lich_upgrade() as unknown as TestableLichModifier;

    modifier.maybeAutoCastIceSpire(lich, awaken, target);

    expect(lich.CastAbilityImmediately).not.toHaveBeenCalled();
  });

  it('restores the frostbound modifier to its full duration after status resistance', () => {
    const frostbound = {
      IsNull: jest.fn().mockReturnValue(false),
      SetDuration: jest.fn(),
    };
    const target = {
      IsNull: jest.fn().mockReturnValue(false),
      FindModifierByName: jest.fn().mockReturnValue(frostbound),
    } as unknown as CDOTA_BaseNPC;
    const modifier =
      new modifier_special_bonus_unique_lich_upgrade() as unknown as TestableLichModifier;

    modifier.preserveFrostboundDuration(target, 4);

    expect(globalThis.Timers.CreateTimer).toHaveBeenCalledWith(0, expect.any(Function));
    expect(target.FindModifierByName).toHaveBeenCalledWith('modifier_lich_chainfrost_frostbound');
    expect(frostbound.SetDuration).toHaveBeenCalledWith(4, true);
  });
});
