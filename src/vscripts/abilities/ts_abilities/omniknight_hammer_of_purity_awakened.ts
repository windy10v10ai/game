import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { advanceHammerAttackCount } from './omniknight-awaken-logic';

const HAMMER_TEXTURE = 'omniknight_hammer_of_purity';
const NATIVE_HAMMER_ABILITY = 'omniknight_hammer_of_purity';

@registerAbility('omniknight_hammer_of_purity_awakened')
export class OmniknightHammerOfPurityAwakened extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_omniknight_hammer_of_purity_awakened_counter.name;
  }

  OnUpgrade(): void {
    if (!IsServer()) return;
    this.SyncNativeHammerLevel();
  }

  GetNativeHammer(): CDOTABaseAbility | undefined {
    return this.GetCaster().FindAbilityByName(NATIVE_HAMMER_ABILITY);
  }

  SyncNativeHammerLevel(): void {
    const nativeHammer = this.GetNativeHammer();
    if (!nativeHammer) return;

    const level = Math.min(this.GetLevel(), nativeHammer.GetMaxLevel());
    if (nativeHammer.GetLevel() !== level) {
      nativeHammer.SetLevel(level);
    }
    nativeHammer.SetHidden(true);
  }
}

@registerModifier('abilities/ts_abilities/omniknight_hammer_of_purity_awakened')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_omniknight_hammer_of_purity_awakened_counter extends BaseModifier {
  IsHidden(): boolean {
    return this.GetParent().IsIllusion() || (this.GetAbility()?.GetLevel() ?? 0) <= 0;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.PERMANENT;
  }

  GetTexture(): string {
    return HAMMER_TEXTURE;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.SetStackCount(0);
    this.syncNativeHammerState();
  }

  OnRefresh(): void {
    if (!IsServer()) return;
    this.syncNativeHammerState();
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    this.disarmNativeHammer();
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ATTACK_LANDED, ModifierFunction.TOOLTIP, ModifierFunction.TOOLTIP2];
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  OnTooltip2(): number {
    const ability = this.GetAbility();
    return ability ? this.getAttacksPerHammer(ability) : 0;
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer() || !this.isValidAttack(event)) return;

    const ability = this.GetAbility();
    if (!ability || ability.GetLevel() <= 0) return;

    const nativeHammer = this.getNativeHammer();
    const threshold = this.getAttacksPerHammer(ability);
    const nativeHammerTriggered =
      this.GetStackCount() >= threshold &&
      nativeHammer !== undefined &&
      !nativeHammer.IsCooldownReady();
    const transition = advanceHammerAttackCount(
      this.GetStackCount(),
      threshold,
      true,
      nativeHammerTriggered,
    );
    this.SetStackCount(transition.count);

    if (transition.triggerHammer) {
      this.disarmNativeHammer();
      return;
    }

    if (transition.count >= threshold) {
      this.armNativeHammer();
    } else {
      this.disarmNativeHammer();
    }
  }

  private isValidAttack(event: ModifierAttackEvent): boolean {
    const parent = this.GetParent();
    return (
      event.attacker === parent &&
      parent.IsRealHero() &&
      !parent.IsIllusion() &&
      !parent.PassivesDisabled() &&
      event.target.GetTeamNumber() !== parent.GetTeamNumber() &&
      !event.target.IsBuilding() &&
      !event.target.IsOther()
    );
  }

  private getAttacksPerHammer(ability: CDOTABaseAbility): number {
    const levelIndex = Math.max(ability.GetLevel() - 1, 0);
    return Math.max(ability.GetLevelSpecialValueFor('attacks_per_hammer', levelIndex), 1);
  }

  private getNativeHammer(): CDOTABaseAbility | undefined {
    return (this.GetAbility() as OmniknightHammerOfPurityAwakened | undefined)?.GetNativeHammer();
  }

  private syncNativeHammerState(): void {
    const ability = this.GetAbility() as OmniknightHammerOfPurityAwakened | undefined;
    if (!ability || ability.GetLevel() <= 0) {
      this.disarmNativeHammer();
      return;
    }

    ability.SyncNativeHammerLevel();
    if (this.GetStackCount() >= this.getAttacksPerHammer(ability)) {
      this.armNativeHammer();
    } else {
      this.disarmNativeHammer();
    }
  }

  private armNativeHammer(): void {
    const nativeHammer = this.getNativeHammer();
    if (!nativeHammer) return;

    nativeHammer.SetActivated(true);
    nativeHammer.EndCooldown();
    if (!nativeHammer.GetAutoCastState()) {
      nativeHammer.ToggleAutoCast();
    }
  }

  private disarmNativeHammer(): void {
    const nativeHammer = this.getNativeHammer();
    if (!nativeHammer) return;

    if (nativeHammer.GetAutoCastState()) {
      nativeHammer.ToggleAutoCast();
    }
    nativeHammer.EndCooldown();
    // Keep the hidden native ability inactive so AI cannot toggle it before the counter is full.
    nativeHammer.SetActivated(false);
  }
}
