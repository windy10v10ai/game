import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const QUICKENING_ICON = 'abaddon_borrowed_time';

@registerAbility('special_bonus_unique_abaddon_quickening_awaken')
export class SpecialBonusUniqueAbaddonQuickeningAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_abaddon_quickening_awaken.name;
  }
}

/** 亚巴顿 畅快淋漓觉醒：借用引擎原生 modifier_abaddon_the_quickening 承担死亡触发冷却缩减，自身 modifier 只负责技能栏可见性。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_abaddon_quickening_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_abaddon_quickening_awaken extends BaseModifier {
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
    return QUICKENING_ICON;
  }

  OnCreated(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    parent.AddNewModifier(parent, ability, 'modifier_abaddon_the_quickening', {});
  }
}
