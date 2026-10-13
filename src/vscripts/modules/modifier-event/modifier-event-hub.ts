import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { UnitHandlerRegistry } from './unit-handler-registry';

/**
 * 全场共用的 modifier 事件监听：引擎会对场上每个声明了全局事件的 modifier 各回调一次，
 * 持有者越多开销成倍增长，所以全场只挂一个监听、按事件里的单位查表分发
 */
export class ModifierEventHub {
  private static readonly damageByAttacker = new UnitHandlerRegistry<ModifierInstanceEvent>();
  private static damageListener: CDOTA_BaseNPC | undefined;

  /** 登记攻击者造成伤害时的处理，owner 用于注销，一般传 modifier 自身 */
  static RegisterDamageByAttacker(
    attacker: CDOTA_BaseNPC,
    owner: object,
    handler: (event: ModifierInstanceEvent) => void,
  ): void {
    this.damageByAttacker.Add(attacker.entindex(), owner, handler);
    if (this.damageListener === undefined || this.damageListener.IsNull()) {
      this.damageListener = CreateModifierThinker(
        undefined,
        undefined,
        modifier_damage_event_listener.name,
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

// eslint-disable-next-line @typescript-eslint/naming-convention
@registerModifier('modules/modifier-event/modifier-event-hub')
export class modifier_damage_event_listener extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_TAKEDAMAGE];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    ModifierEventHub.DispatchDamage(event);
  }
}
