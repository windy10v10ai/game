import { modifier_global_melee_status_resistance } from '../../modifiers/global/melee_status_resistance';
import { registerModifier } from '../../utils/dota_ts_adapter';

/** 性能测试用的威压：回调与正式版相同，只是允许同一英雄挂多份，按层数放大开销。 */
@registerModifier('modules/debug/perf-melee-stack')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_perf_melee_stack extends modifier_global_melee_status_resistance {
  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.MULTIPLE + ModifierAttribute.PERMANENT;
  }
}
