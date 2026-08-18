import { DragonWishFilter } from './dragon-wish-filter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

describe('DragonWishFilter', () => {
  let orderFilter: (event: ExecuteOrderFilterEvent) => boolean;
  let entities: Record<number, unknown>;

  beforeEach(() => {
    entities = {};
    global.EntIndexToHScript = jest.fn((index: number) => entities[index]);
    global.PlayerResource = {
      IsValidPlayerID: jest.fn(() => true),
      GetSelectedHeroEntity: jest.fn(),
    };
    global.GameRules = {
      GetGameModeEntity: jest.fn().mockReturnValue({
        SetExecuteOrderFilter: jest.fn((filter) => {
          orderFilter = filter;
        }),
      }),
    };

    new DragonWishFilter();
  });

  function createOrder(abilityIndex = 1, targetIndex = 2): ExecuteOrderFilterEvent {
    return {
      units: {},
      entindex_target: targetIndex as EntityIndex,
      entindex_ability: abilityIndex as EntityIndex,
      issuer_player_id_const: 0 as PlayerID,
      sequence_number_const: 0,
      queue: 0,
      order_type: UnitOrder.CAST_TARGET,
      position_x: 0,
      position_y: 0,
      position_z: 0,
      shop_item_name: '',
    };
  }

  it('blocks Culling Blade against the Dragon immortality spirit state', () => {
    entities[1] = { GetAbilityName: () => 'axe_culling_blade' };
    entities[2] = {
      HasModifier: () => true,
    };

    expect(orderFilter(createOrder())).toBe(false);
  });

  it('allows Culling Blade when the target has no green immortality spirit state', () => {
    entities[1] = { GetAbilityName: () => 'axe_culling_blade' };
    entities[2] = { HasModifier: () => false };

    expect(orderFilter(createOrder())).toBe(true);
  });

  it('does not block other targeted abilities', () => {
    entities[1] = { GetAbilityName: () => 'lion_finger_of_death' };
    entities[2] = {
      HasModifier: () => true,
    };

    expect(orderFilter(createOrder())).toBe(true);
  });
  it('redirects inherited Spirit Bear skill training to Lone Druid', () => {
    let druidAbilityLevel = 0;
    const druidAbility = {
      GetLevel: jest.fn(() => druidAbilityLevel),
    };
    const druid = {
      FindAbilityByName: jest.fn(() => druidAbility),
      UpgradeAbility: jest.fn(() => {
        druidAbilityLevel += 1;
      }),
    };
    const bear = {
      GetUnitName: jest.fn(() => 'npc_dota_lone_druid_bear1'),
      HasModifier: jest.fn(() => true),
      GetPlayerOwnerID: jest.fn(() => 0),
    };
    const bearAbility = {
      GetAbilityName: jest.fn(() => 'medusa_split_shot'),
      GetCaster: jest.fn(() => bear),
      SetLevel: jest.fn(),
    };
    entities[1] = bearAbility;
    global.PlayerResource.GetSelectedHeroEntity.mockReturnValue(druid);

    const order = createOrder(1, 0);
    order.order_type = UnitOrder.TRAIN_ABILITY;
    order.entindex_target = 0 as EntityIndex;

    expect(orderFilter(order)).toBe(false);
    expect(druid.UpgradeAbility).toHaveBeenCalledWith(druidAbility);
    expect(bearAbility.SetLevel).toHaveBeenCalledWith(1);
  });
});
