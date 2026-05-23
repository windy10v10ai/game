import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

// 标记由调试面板生成、需玩家手动控制的英雄，使其跳过出生点重置与 bot AI 初始化。
@registerModifier('modifiers/debug/modifier_debug_manual_control')
export class modifier_debug_manual_control extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }
}
