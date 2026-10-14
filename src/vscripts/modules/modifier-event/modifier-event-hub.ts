import { UnitHandlerRegistry } from './unit-handler-registry';

/**
 * 全场共用的 modifier 事件监听：引擎会对场上每个声明了全局事件的 modifier 各回调一次，
 * 持有者越多开销成倍增长，所以全场只挂一个监听、按事件里的单位查表分发
 */
// 带 @registerModifier 的文件在引擎创建该 modifier 时会再执行一遍，监听若与登记表同文件就会多出一份互不相通的登记表，
// 因此监听放在单独文件、按名字引用
export const DAMAGE_LISTENER_MODIFIER = 'modifier_damage_event_listener';

export class ModifierEventHub {
  private static readonly damageByAttacker = new UnitHandlerRegistry<ModifierInstanceEvent>();
  private static damageListener: CDOTA_BaseNPC | undefined;

  /** 登记攻击者造成伤害时的处理，owner 用于注销，一般传 modifier 自身 */
  static RegisterDamageByAttacker(
    attacker: CDOTA_BaseNPC,
    owner: object,
    handler: (this: void, event: ModifierInstanceEvent) => void,
  ): void {
    this.damageByAttacker.Add(attacker.entindex(), owner, handler);
    if (this.damageListener === undefined || this.damageListener.IsNull()) {
      this.damageListener = CreateModifierThinker(
        undefined,
        undefined,
        DAMAGE_LISTENER_MODIFIER,
        undefined,
        Vector(0, 0, 0),
        DotaTeam.NOTEAM,
        false,
      );
    }
  }

  static UnregisterDamageByAttacker(attacker: CDOTA_BaseNPC, owner: object): void {
    this.damageByAttacker.Remove(attacker.entindex(), owner);
    if (!this.damageByAttacker.IsEmpty() || this.damageListener === undefined) return;
    if (!this.damageListener.IsNull()) {
      UTIL_Remove(this.damageListener);
    }
    this.damageListener = undefined;
  }

  static DispatchDamage(event: ModifierInstanceEvent): void {
    const attacker = event.attacker;
    if (attacker === undefined) return;
    this.damageByAttacker.Dispatch(attacker.entindex(), event);
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
