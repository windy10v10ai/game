import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { calculateIntellectMagicResist } from './intellect-magic-resist-calculator';

const VANILLA_MAGIC_RESIST_PER_INT = 0.125;

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

    // 原版每点智力提供的魔抗（7.42 起 0.125%，此前 0.1%）要和引擎一致，否则扣减不对
    // 用分段线性函数替换原版线性收益，高智力时扣得多，魔抗不会轻易达到上限
    const originalMagicResist = intellect * VANILLA_MAGIC_RESIST_PER_INT;

    // 计算实际应该获得的魔抗（返回百分比形式）
    const actualMagicResist = calculateIntellectMagicResist(intellect);

    // 计算需要扣减的魔抗（原版魔抗 - 实际魔抗）
    // 返回负值，因为这是直接修改（扣减）
    // 返回值是百分比形式（例如-10表示扣减10%）
    const result = -(originalMagicResist - actualMagicResist);
    return result;
  }
}
