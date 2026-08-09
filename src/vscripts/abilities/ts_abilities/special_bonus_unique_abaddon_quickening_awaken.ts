import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  calculateQuickeningCooldownPlans,
  getQuickeningCooldownReduction,
  isQuickeningDeathInRange,
  QuickeningCooldownState,
} from './abaddon-quickening-logic';

const QUICKENING_ICON = 'abaddon_borrowed_time';

@registerAbility('special_bonus_unique_abaddon_quickening_awaken')
export class SpecialBonusUniqueAbaddonQuickeningAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_abaddon_quickening_awaken.name;
  }
}

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

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_DEATH];
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const ability = this.GetAbility();
    const deadUnit = event.unit;
    if (!ability || ability.IsNull() || !deadUnit || deadUnit.IsNull()) return;

    const radius = ability.GetSpecialValueFor('radius');
    const distance = deadUnit.GetAbsOrigin().__sub(parent.GetAbsOrigin()).Length2D();
    if (!isQuickeningDeathInRange(distance, radius)) return;

    const reduction = getQuickeningCooldownReduction(
      deadUnit.IsHero(),
      ability.GetSpecialValueFor('cooldown_reduction_heroes'),
      ability.GetSpecialValueFor('cooldown_reduction_creeps'),
    );
    if (reduction <= 0) return;

    const cooldownByEntityIndex = new Map<number, CDOTABaseAbility>();
    const cooldownStates: QuickeningCooldownState[] = [];

    for (let index = 0; index < parent.GetAbilityCount(); index++) {
      const currentAbility = parent.GetAbilityByIndex(index);
      if (!currentAbility || currentAbility.IsNull()) continue;
      this.collectCooldown(currentAbility, cooldownByEntityIndex, cooldownStates);
    }

    for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.NEUTRAL_PASSIVE_SLOT; slot++) {
      const item = parent.GetItemInSlot(slot);
      if (!item || item.IsNull()) continue;
      this.collectCooldown(item, cooldownByEntityIndex, cooldownStates);
    }

    const plans = calculateQuickeningCooldownPlans(cooldownStates, reduction);
    for (const plan of plans) {
      const cooldown = cooldownByEntityIndex.get(plan.entityIndex);
      if (!cooldown || cooldown.IsNull()) continue;

      cooldown.EndCooldown();
      if (plan.nextCooldown > 0) cooldown.StartCooldown(plan.nextCooldown);
    }
  }

  private collectCooldown(
    cooldown: CDOTABaseAbility,
    cooldownByEntityIndex: Map<number, CDOTABaseAbility>,
    cooldownStates: QuickeningCooldownState[],
  ): void {
    const entityIndex = cooldown.entindex();
    cooldownByEntityIndex.set(entityIndex, cooldown);
    cooldownStates.push({
      entityIndex,
      remainingCooldown: cooldown.GetCooldownTimeRemaining(),
    });
  }
}
