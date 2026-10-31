import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import {
  ATTACK_LANDED_LISTENER_MODIFIER,
  DAMAGE_LISTENER_MODIFIER,
  MODIFIER_ADDED_LISTENER_MODIFIER,
  ModifierEventHub,
} from './modifier-event-hub';

/** 全场唯一的各类事件监听，挂在隐藏的 thinker 上，收到事件交给分发中心 */
// eslint-disable-next-line @typescript-eslint/naming-convention
@registerModifier('modules/modifier-event/modifier-event-listener', DAMAGE_LISTENER_MODIFIER)
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

// eslint-disable-next-line @typescript-eslint/naming-convention
@registerModifier(
  'modules/modifier-event/modifier-event-listener',
  MODIFIER_ADDED_LISTENER_MODIFIER,
)
export class modifier_modifier_added_event_listener extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_MODIFIER_ADDED];
  }

  OnModifierAdded(event: ModifierAddedEvent): void {
    ModifierEventHub.DispatchModifierAdded(event);
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
@registerModifier('modules/modifier-event/modifier-event-listener', ATTACK_LANDED_LISTENER_MODIFIER)
export class modifier_attack_landed_event_listener extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ATTACK_LANDED];
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    ModifierEventHub.DispatchAttackLanded(event);
  }
}
