import { DragonWishFilter } from './dragon-wish-filter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

describe('DragonWishFilter', () => {
  let orderFilter: (event: ExecuteOrderFilterEvent) => boolean;
  let entities: Record<number, unknown>;

  beforeEach(() => {
    entities = {};
    global.EntIndexToHScript = jest.fn((index: number) => entities[index]);
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

  it('blocks enabling Enigma alternate cast while either Black Hole is cooling down', () => {
    const enigma = {
      GetAbilityName: () => 'enigma_black_hole_awakened',
      GetAutoCastState: () => false,
      GetCooldownTimeRemaining: () => 0,
      GetCaster: () => ({
        IsChanneling: () => false,
        FindAbilityByName: () => ({ GetCooldownTimeRemaining: () => 1 }),
      }),
    };
    entities[1] = enigma;
    const order = createOrder();
    order.order_type = UnitOrder.CAST_TOGGLE_AUTO;
    expect(orderFilter(order)).toBe(false);
  });

  it('allows disabling Enigma alternate cast during cooldown', () => {
    entities[1] = {
      GetAbilityName: () => 'enigma_black_hole_awakened',
      GetAutoCastState: () => true,
      GetCooldownTimeRemaining: () => 10,
      GetCaster: () => ({ IsChanneling: () => false, FindAbilityByName: () => undefined }),
    };
    const order = createOrder();
    order.order_type = UnitOrder.CAST_TOGGLE_AUTO;
    expect(orderFilter(order)).toBe(true);
  });
});
