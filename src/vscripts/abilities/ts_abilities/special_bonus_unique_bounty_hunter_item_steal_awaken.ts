import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const JINADA_ABILITY = 'bounty_hunter_jinada';
const JINADA_ICON = 'bounty_hunter_jinada';
const FIRST_ITEM_SLOT = InventorySlot.SLOT_1;
const LAST_BACKPACK_SLOT = InventorySlot.SLOT_9;
const MAX_STEAL_CHANCE_LEVEL = 4;

@registerAbility('special_bonus_unique_bounty_hunter_item_steal_awaken')
export class SpecialBonusUniqueBountyHunterItemStealAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_bounty_hunter_item_steal_awaken.name;
  }
}

/** 赏金猎人觉醒：忍术攻击有概率把敌方英雄的一件可出售装备转移给自己。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_bounty_hunter_item_steal_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_bounty_hunter_item_steal_awaken extends BaseModifier {
  private jinadaAttackRecords: Record<number, boolean> = {};

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
    return JINADA_ICON;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.jinadaAttackRecords = {};
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_ATTACK_RECORD,
      ModifierFunction.ON_ATTACK_LANDED,
      ModifierFunction.ON_ATTACK_RECORD_DESTROY,
    ];
  }

  OnAttackRecord(event: ModifierAttackEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const target = event.target;
    const awaken = this.GetAbility();
    if (
      event.attacker !== parent ||
      event.no_attack_cooldown ||
      !target ||
      target.IsNull() ||
      !target.IsRealHero() ||
      target.IsIllusion() ||
      target.GetTeamNumber() === parent.GetTeamNumber() ||
      target.HasModifier(modifier_bounty_hunter_item_steal_protection.name) ||
      !parent.IsRealHero() ||
      parent.IsIllusion() ||
      parent.PassivesDisabled() ||
      !awaken ||
      awaken.IsNull() ||
      awaken.GetLevel() <= 0 ||
      !awaken.IsActivated()
    ) {
      return;
    }

    const jinada = parent.FindAbilityByName(JINADA_ABILITY);
    if (
      !jinada ||
      jinada.IsNull() ||
      jinada.GetLevel() <= 0 ||
      !jinada.IsActivated() ||
      !jinada.IsCooldownReady()
    ) {
      return;
    }

    this.jinadaAttackRecords[event.record] = true;
  }

  OnAttackLanded(event: ModifierAttackEvent): void {
    if (!IsServer() || !this.jinadaAttackRecords[event.record]) return;
    delete this.jinadaAttackRecords[event.record];

    const bountyHunter = this.GetParent();
    const target = event.target;
    const awaken = this.GetAbility();
    if (
      event.attacker !== bountyHunter ||
      !target ||
      target.IsNull() ||
      !target.IsRealHero() ||
      target.IsIllusion() ||
      target.GetTeamNumber() === bountyHunter.GetTeamNumber() ||
      target.HasModifier(modifier_bounty_hunter_item_steal_protection.name) ||
      bountyHunter.PassivesDisabled() ||
      !awaken ||
      awaken.IsNull() ||
      awaken.GetLevel() <= 0 ||
      !awaken.IsActivated() ||
      !this.hasEmptyInventorySlot(bountyHunter)
    ) {
      return;
    }

    const jinada = bountyHunter.FindAbilityByName(JINADA_ABILITY);
    if (!jinada || jinada.IsNull() || jinada.GetLevel() <= 0) return;

    const chanceLevel = Math.min(jinada.GetLevel(), MAX_STEAL_CHANCE_LEVEL) - 1;
    const stealChance = awaken.GetLevelSpecialValueFor('steal_chance_pct', chanceLevel);
    if (!RollPseudoRandomPercentage(stealChance, 0, bountyHunter)) return;

    const items = this.getStealableItems(target);
    if (items.length === 0) return;

    const stolenItem = items[RandomInt(0, items.length - 1)];
    target.TakeItem(stolenItem);
    bountyHunter.AddItem(stolenItem);
    stolenItem.SetPurchaser(bountyHunter);

    target.AddNewModifier(bountyHunter, awaken, modifier_bounty_hunter_item_steal_protection.name, {
      duration: awaken.GetSpecialValueFor('protection_duration'),
    });
  }

  OnAttackRecordDestroy(event: ModifierAttackEvent): void {
    if (!IsServer()) return;
    delete this.jinadaAttackRecords[event.record];
  }

  private hasEmptyInventorySlot(hero: CDOTA_BaseNPC): boolean {
    for (let slot = FIRST_ITEM_SLOT; slot <= LAST_BACKPACK_SLOT; slot++) {
      if (!hero.GetItemInSlot(slot)) return true;
    }
    return false;
  }

  private getStealableItems(target: CDOTA_BaseNPC): CDOTA_Item[] {
    const items: CDOTA_Item[] = [];
    for (let slot = FIRST_ITEM_SLOT; slot <= LAST_BACKPACK_SLOT; slot++) {
      const item = target.GetItemInSlot(slot);
      if (
        item &&
        !item.IsNull() &&
        item.GetCost() > 0 &&
        item.IsSellable() &&
        !item.IsRecipe() &&
        !item.IsStackable()
      ) {
        items.push(item);
      }
    }
    return items;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_bounty_hunter_item_steal_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_bounty_hunter_item_steal_protection extends BaseModifier {
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
    return JINADA_ICON;
  }
}
