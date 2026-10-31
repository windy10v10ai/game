import { UnitHandlerRegistry } from './unit-handler-registry';

/**
 * 全场共用的 modifier 事件监听：引擎会对场上每个声明了全局事件的 modifier 各回调一次，
 * 持有者越多开销成倍增长，所以全场只挂一个监听、按事件里的单位查表分发
 */
// 带 @registerModifier 的文件在引擎创建该 modifier 时会再执行一遍，监听若与登记表同文件就会多出一份互不相通的登记表，
// 因此监听放在单独文件、按名字引用
export const DAMAGE_LISTENER_MODIFIER = 'modifier_damage_event_listener';
export const MODIFIER_ADDED_LISTENER_MODIFIER = 'modifier_modifier_added_event_listener';
export const ATTACK_LANDED_LISTENER_MODIFIER = 'modifier_attack_landed_event_listener';

// 持续伤害的零碎小跳占伤害事件的大头，触发效果收益很小；后期普攻与暴击基本都高于此值
const MIN_DISPATCH_DAMAGE = 20;

type Handler<TEvent> = (this: void, event: TEvent) => void;

/** 一种全局事件：一张按单位的登记表加一个按需创建的隐藏监听 */
class EventChannel<TEvent> {
  private readonly registry = new UnitHandlerRegistry<TEvent>();
  private listener: CDOTA_BaseNPC | undefined;

  constructor(
    private readonly listenerModifier: string,
    private readonly unitOf: (this: void, event: TEvent) => CDOTA_BaseNPC | undefined,
    private readonly accept?: (this: void, event: TEvent) => boolean,
  ) {}

  Register(unit: CDOTA_BaseNPC, owner: object, handler: Handler<TEvent>): void {
    this.registry.Add(unit.entindex(), owner, handler);
    if (this.listener === undefined || this.listener.IsNull()) {
      this.listener = CreateModifierThinker(
        undefined,
        undefined,
        this.listenerModifier,
        undefined,
        Vector(0, 0, 0),
        DotaTeam.NOTEAM,
        false,
      );
    }
  }

  Unregister(unit: CDOTA_BaseNPC, owner: object): void {
    this.registry.Remove(unit.entindex(), owner);
    if (!this.registry.IsEmpty() || this.listener === undefined) return;
    if (!this.listener.IsNull()) {
      UTIL_Remove(this.listener);
    }
    this.listener = undefined;
  }

  Dispatch(event: TEvent): void {
    if (this.accept !== undefined && !this.accept(event)) return;
    const unit = this.unitOf(event);
    if (unit === undefined) return;
    this.registry.Dispatch(unit.entindex(), event);
  }
}

export class ModifierEventHub {
  private static readonly damageByAttacker = new EventChannel<ModifierInstanceEvent>(
    DAMAGE_LISTENER_MODIFIER,
    (event) => event.attacker,
    // 高频低伤的持续伤害每跳都会进来，小伤害对各处理都没有意义，查表前先挡掉
    (event) => event.damage >= MIN_DISPATCH_DAMAGE,
  );

  private static readonly attackLandedByAttacker = new EventChannel<ModifierAttackEvent>(
    ATTACK_LANDED_LISTENER_MODIFIER,
    (event) => event.attacker,
  );

  private static readonly modifierAddedByUnit = new EventChannel<ModifierAddedEvent>(
    MODIFIER_ADDED_LISTENER_MODIFIER,
    (event) => event.unit,
  );

  /** 登记攻击者造成伤害时的处理，owner 用于注销，一般传 modifier 自身 */
  static RegisterDamageByAttacker(
    attacker: CDOTA_BaseNPC,
    owner: object,
    handler: Handler<ModifierInstanceEvent>,
  ): void {
    this.damageByAttacker.Register(attacker, owner, handler);
  }

  static UnregisterDamageByAttacker(attacker: CDOTA_BaseNPC, owner: object): void {
    this.damageByAttacker.Unregister(attacker, owner);
  }

  static DispatchDamage(event: ModifierInstanceEvent): void {
    this.damageByAttacker.Dispatch(event);
  }

  /** 登记攻击者普攻命中时的处理 */
  static RegisterAttackLandedByAttacker(
    attacker: CDOTA_BaseNPC,
    owner: object,
    handler: Handler<ModifierAttackEvent>,
  ): void {
    this.attackLandedByAttacker.Register(attacker, owner, handler);
  }

  static UnregisterAttackLandedByAttacker(attacker: CDOTA_BaseNPC, owner: object): void {
    this.attackLandedByAttacker.Unregister(attacker, owner);
  }

  static DispatchAttackLanded(event: ModifierAttackEvent): void {
    this.attackLandedByAttacker.Dispatch(event);
  }

  /** 登记单位身上被加 modifier 时的处理 */
  static RegisterModifierAdded(
    unit: CDOTA_BaseNPC,
    owner: object,
    handler: Handler<ModifierAddedEvent>,
  ): void {
    this.modifierAddedByUnit.Register(unit, owner, handler);
  }

  static UnregisterModifierAdded(unit: CDOTA_BaseNPC, owner: object): void {
    this.modifierAddedByUnit.Unregister(unit, owner);
  }

  static DispatchModifierAdded(event: ModifierAddedEvent): void {
    this.modifierAddedByUnit.Dispatch(event);
  }
}

declare global {
  /** 供 Lua 物品登记攻击者造成伤害时的处理 */
  function ModifierEventRegisterDamageByAttacker(
    this: void,
    attacker: CDOTA_BaseNPC,
    owner: object,
    handler: (this: void, event: ModifierInstanceEvent) => void,
  ): void;
  function ModifierEventUnregisterDamageByAttacker(
    this: void,
    attacker: CDOTA_BaseNPC,
    owner: object,
  ): void;
}

_G.ModifierEventRegisterDamageByAttacker = (attacker, owner, handler) =>
  ModifierEventHub.RegisterDamageByAttacker(attacker, owner, handler);
_G.ModifierEventUnregisterDamageByAttacker = (attacker, owner) =>
  ModifierEventHub.UnregisterDamageByAttacker(attacker, owner);
