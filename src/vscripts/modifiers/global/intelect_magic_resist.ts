import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { calculateIntellectMagicResist } from './intellect-magic-resist-calculator';

@registerModifier('modifiers/global/intelect_magic_resist')
export class modifier_intelect_magic_resist extends BaseModifier {
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

  AllowIllusionDuplicate(): boolean {
    return true;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.MAGICAL_RESISTANCE_DIRECT_MODIFICATION];
  }

  GetModifierMagicalResistanceDirectModification(): number {
    const hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    const intellect = hero.GetIntellect(true);

    // 原版：每点智力提供0.1%魔抗，基础25%，750智力时满（25% + 75% = 100%）
    // 解决方案：使用简单的分段线性函数，避免复杂计算
    // 低智力时扣减少，高智力时扣减多，确保魔抗不会轻易达到上限

    // 原版应该提供的魔抗（每点智力0.1%）
    const originalMagicResist = intellect * 0.001;

    // 计算实际应该获得的魔抗
    const actualMagicResist = calculateIntellectMagicResist(intellect);

    // 计算需要扣减的魔抗（原版魔抗 - 实际魔抗）
    // 返回负值，因为这是直接修改（扣减）
    return -(originalMagicResist - actualMagicResist);
  }
}
