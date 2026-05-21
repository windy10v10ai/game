import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

// 调试面板「无敌」按钮使用：完全免疫物理、魔法、纯粹伤害。
@registerModifier('modifiers/debug/modifier_debug_invulnerable')
export class modifier_debug_invulnerable extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'modifier_invulnerable';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ABSOLUTE_NO_DAMAGE_MAGICAL,
      ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL,
      ModifierFunction.ABSOLUTE_NO_DAMAGE_PURE,
    ];
  }

  GetAbsoluteNoDamageMagical(): 0 | 1 {
    return 1;
  }

  GetAbsoluteNoDamagePhysical(): 0 | 1 {
    return 1;
  }

  GetAbsoluteNoDamagePure(): 0 | 1 {
    return 1;
  }
}
