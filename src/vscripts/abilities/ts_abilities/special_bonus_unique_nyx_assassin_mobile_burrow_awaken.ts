import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const BURROW_MODIFIER = 'modifier_nyx_assassin_burrow';
const BURROW_ICON = 'nyx_assassin_burrow';

@registerAbility('special_bonus_unique_nyx_assassin_mobile_burrow_awaken')
export class SpecialBonusUniqueNyxAssassinMobileBurrowAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_nyx_assassin_mobile_burrow_awaken.name;
  }
}

/** 司夜刺客 钻地觉醒：只解除钻地状态的定身，让原生 modifier 继续拥有其余效果。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_nyx_assassin_mobile_burrow_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_nyx_assassin_mobile_burrow_awaken extends BaseModifier {
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
    return BURROW_ICON;
  }

  GetPriority(): modifierpriority {
    return ModifierPriority.SUPER_ULTRA;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    if (!this.GetParent().HasModifier(BURROW_MODIFIER)) return {};

    return {
      [ModifierState.ROOTED]: false,
    };
  }
}
