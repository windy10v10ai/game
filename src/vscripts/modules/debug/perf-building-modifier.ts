import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

/** 性能测试用的常驻 Lua modifier：空壳量「挂着」本身的开销，另一个只多声明受伤事件，量全局监听的开销。 */
@registerModifier('modules/debug/perf-building-modifier')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_perf_empty extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }
}

@registerModifier('modules/debug/perf-building-modifier')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_perf_takedamage extends modifier_perf_empty {
  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_TAKEDAMAGE];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (event.unit !== this.GetParent()) return;
  }
}
