import {
  BaseItem,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const MODIFIER_NAME = 'modifier_item_inventory_slot_unlock';
const MAX_UNLOCKED_ITEM_SLOTS = 3;
const FIRST_BACKPACK_SLOT = InventorySlot.SLOT_7;
const LAST_BACKPACK_SLOT = InventorySlot.SLOT_9;
const INVENTORY_SYNC_INTERVAL = 0.1;

// CanBeUsedOutOfInventory() also turns true once an item merely passes through an
// unlocked backpack slot, so it cannot be used to detect the KV declaration at
// runtime. Mirror the KV `ItemCanBeUsedWithoutInventory "1"` items here instead.
const BACKPACK_ALWAYS_USABLE_ITEMS: string[] = [
  'item_roshans_banner',
  'item_dust',
  'item_smoke_of_deceit',
  'item_ward_observer',
  'item_ward_sentry',
  'item_ward_dispenser',
  'item_tome_of_knowledge',
  'item_tome_of_agility',
  'item_tome_of_intelligence',
  'item_tome_of_strength',
  'item_tome_of_luoshu',
  'item_tome_of_ability_reset',
  'item_skill_reset',
  'item_collector',
  'item_awaken_stone',
  'item_passive_skill_tome',
  'item_inventory_slot_unlock',
];

interface ForcedUnequippedItem {
  entIndex: EntityIndex;
  wasActivated: boolean;
}

interface ObservedInventoryItem {
  entIndex: EntityIndex;
  slot: number;
}

/** 扩容之书 */
@registerAbility('item_inventory_slot_unlock')
export class ItemInventorySlotUnlock extends BaseItem {
  private unlockedSlotCount(): number {
    const caster = this.GetCaster();
    if (!caster || !caster.IsHero()) {
      return 0;
    }

    // FindModifierByName is not available on the client entity used by cast filters.
    // GetModifierStackCount is mirrored to the client and is safe in both realms.
    return caster.GetModifierStackCount(MODIFIER_NAME, caster);
  }

  CastFilterResult(): UnitFilterResult {
    return this.unlockedSlotCount() >= MAX_UNLOCKED_ITEM_SLOTS
      ? UnitFilterResult.FAIL_CUSTOM
      : UnitFilterResult.SUCCESS;
  }

  GetCustomCastError(): string {
    return '#dota_hud_error_inventory_slot_unlock_max_usage';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    if (!caster || !caster.IsHero()) {
      return;
    }

    let modifier = caster.FindModifierByName(MODIFIER_NAME);
    if (!modifier) {
      modifier = caster.AddNewModifier(caster, this, MODIFIER_NAME, {});
    }
    if (!modifier || modifier.GetStackCount() >= MAX_UNLOCKED_ITEM_SLOTS) {
      return;
    }

    modifier.SetStackCount(modifier.GetStackCount() + 1);
    (modifier as ModifierItemInventorySlotUnlock).SynchronizeInventory();
    caster.CalculateStatBonus(true);
    EmitSoundOn('Item.TomeOfKnowledge', caster);
    this.SpendCharge(1);
  }
}

@registerModifier('items/ts_items/item_inventory_slot_unlock', MODIFIER_NAME)
export class ModifierItemInventorySlotUnlock extends BaseModifier {
  private forcedUnequippedItems: ForcedUnequippedItem[] = [];
  private observedInventoryItems: ObservedInventoryItem[] = [];
  private lastInventorySignature = '';

  OnCreated(): void {
    if (!IsServer()) {
      return;
    }

    // Inventory changes do not expose a modifier event. Poll a lightweight
    // signature so newly granted/swapped items are corrected quickly.
    this.StartIntervalThink(INVENTORY_SYNC_INTERVAL);
    this.SynchronizeInventory();
  }

  OnDestroy(): void {
    if (!IsServer()) {
      return;
    }

    const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    for (const record of this.forcedUnequippedItems) {
      const item = EntIndexToHScript(record.entIndex) as CDOTA_Item | undefined;
      if (!item || !IsValidEntity(item) || item.IsNull()) {
        continue;
      }

      item.SetActivated(record.wasActivated);
      item.SetCanBeUsedOutOfInventory(false);
      const slot = item.GetItemSlot();
      if (item.GetCaster() === parent && slot >= 0 && slot < FIRST_BACKPACK_SLOT) {
        item.SetItemState(1);
        item.OnEquip();
      }
    }
    this.forcedUnequippedItems = [];
    this.observedInventoryItems = [];
  }

  OnStackCountChanged(): void {
    if (IsServer()) {
      this.lastInventorySignature = '';
      this.SynchronizeInventory();
    }
  }

  OnIntervalThink(): void {
    if (!IsServer()) {
      return;
    }

    const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    if (this.buildInventorySignature(parent) !== this.lastInventorySignature) {
      this.SynchronizeInventory();
    }
  }

  /** Reconcile engine-wide Pack Rat with the exact number of unlocked slots. */
  SynchronizeInventory(): void {
    if (!IsServer()) {
      return;
    }

    const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    const unlockedSlots = Math.min(this.GetStackCount(), MAX_UNLOCKED_ITEM_SLOTS);

    this.restoreItemsOutsideLockedBackpack(parent, unlockedSlots);
    this.activateUsableInventoryItems(parent, unlockedSlots);
    this.deactivateLockedBackpackItems(parent, unlockedSlots);

    parent.CalculateStatBonus(true);
    this.observedInventoryItems = this.buildObservedInventoryItems(parent);
    this.lastInventorySignature = this.buildInventorySignature(parent);
  }

  /** Restore items that left the still-locked part of the backpack. */
  private restoreItemsOutsideLockedBackpack(
    parent: CDOTA_BaseNPC_Hero,
    unlockedSlots: number,
  ): void {
    for (let index = this.forcedUnequippedItems.length - 1; index >= 0; index--) {
      const record = this.forcedUnequippedItems[index];
      const item = EntIndexToHScript(record.entIndex) as CDOTA_Item | undefined;
      if (!item || !IsValidEntity(item) || item.IsNull()) {
        this.forcedUnequippedItems.splice(index, 1);
        continue;
      }

      if (BACKPACK_ALWAYS_USABLE_ITEMS.includes(item.GetAbilityName())) {
        continue;
      }

      const slot = item.GetItemSlot();
      if (this.isLockedBackpackSlot(slot, unlockedSlots)) {
        continue;
      }

      item.SetActivated(record.wasActivated);
      const ownedByParent = item.GetCaster() === parent;
      const inUnlockedBackpack =
        ownedByParent && slot >= FIRST_BACKPACK_SLOT && slot < FIRST_BACKPACK_SLOT + unlockedSlots;
      const inMainInventory = ownedByParent && slot >= 0 && slot < FIRST_BACKPACK_SLOT;

      item.SetCanBeUsedOutOfInventory(inUnlockedBackpack);
      if (inMainInventory) {
        // Backpack slots handle their own equip via activateUsableInventoryItems;
        // items dragged back into the main inventory need it restored here instead.
        item.SetItemState(1);
        item.OnEquip();
      } else if (!inUnlockedBackpack) {
        item.SetItemState(0);
      }
      this.forcedUnequippedItems.splice(index, 1);
    }
  }

  private activateUsableInventoryItems(parent: CDOTA_BaseNPC_Hero, unlockedSlots: number): void {
    // The engine can keep ItemState=1 when an item is dropped from an unlocked
    // backpack slot and then picked up again. In that case Pack Rat does not
    // recreate the item's intrinsic modifiers by itself. Track the actual slot
    // transition and explicitly run OnEquip once whenever an active item enters
    // or changes slots, even if ItemState already says it is equipped.
    for (let slot = 0; slot < FIRST_BACKPACK_SLOT + unlockedSlots; slot++) {
      const item = parent.GetItemInSlot(slot);
      if (!item || BACKPACK_ALWAYS_USABLE_ITEMS.includes(item.GetAbilityName())) {
        continue;
      }

      const previousSlot = this.findObservedItemSlot(item.entindex());
      const movedOrEntered = previousSlot === undefined || previousSlot !== slot;
      const inUnlockedBackpack = slot >= FIRST_BACKPACK_SLOT;

      item.SetCanBeUsedOutOfInventory(inUnlockedBackpack);
      item.SetItemState(1);
      if (movedOrEntered) {
        item.OnEquip();
      }
    }
  }

  private deactivateLockedBackpackItems(parent: CDOTA_BaseNPC_Hero, unlockedSlots: number): void {
    for (let offset = 0; offset < MAX_UNLOCKED_ITEM_SLOTS; offset++) {
      const slot = FIRST_BACKPACK_SLOT + offset;
      const item = parent.GetItemInSlot(slot);
      if (!item || BACKPACK_ALWAYS_USABLE_ITEMS.includes(item.GetAbilityName())) {
        continue;
      }

      const record = this.findForcedUnequippedItem(item.entindex());
      if (offset < unlockedSlots) {
        if (record !== undefined) {
          item.SetActivated(record.wasActivated);
          this.removeForcedUnequippedItem(item.entindex());
        }
        continue;
      }

      const needsUnequip = item.IsActivated() || item.GetItemState() !== 0;
      if (!record) {
        this.forcedUnequippedItems.push({
          entIndex: item.entindex(),
          wasActivated: item.IsActivated(),
        });
      }
      item.SetActivated(false);
      item.SetCanBeUsedOutOfInventory(false);
      item.SetItemState(0);
      if (!record || needsUnequip) {
        item.OnUnequip();
      }
    }
  }

  private isLockedBackpackSlot(slot: number, unlockedSlots: number): boolean {
    return slot >= FIRST_BACKPACK_SLOT + unlockedSlots && slot <= LAST_BACKPACK_SLOT;
  }

  private findForcedUnequippedItem(entIndex: EntityIndex): ForcedUnequippedItem | undefined {
    return this.forcedUnequippedItems.find((record) => record.entIndex === entIndex);
  }

  private removeForcedUnequippedItem(entIndex: EntityIndex): void {
    const index = this.forcedUnequippedItems.findIndex((record) => record.entIndex === entIndex);
    if (index >= 0) {
      this.forcedUnequippedItems.splice(index, 1);
    }
  }

  private findObservedItemSlot(entIndex: EntityIndex): number | undefined {
    return this.observedInventoryItems.find((record) => record.entIndex === entIndex)?.slot;
  }

  private buildObservedInventoryItems(parent: CDOTA_BaseNPC_Hero): ObservedInventoryItem[] {
    const items: ObservedInventoryItem[] = [];
    for (let slot = 0; slot <= LAST_BACKPACK_SLOT; slot++) {
      const item = parent.GetItemInSlot(slot);
      if (item) {
        items.push({ entIndex: item.entindex(), slot });
      }
    }
    return items;
  }

  private buildInventorySignature(parent: CDOTA_BaseNPC_Hero): string {
    const parts = [`${Math.min(this.GetStackCount(), MAX_UNLOCKED_ITEM_SLOTS)}`];
    for (let slot = 0; slot <= LAST_BACKPACK_SLOT; slot++) {
      const item = parent.GetItemInSlot(slot);
      parts.push(
        item ? `${item.entindex()}:${item.GetItemState()}:${item.IsActivated() ? 1 : 0}` : '-1',
      );
    }
    return parts.join('|');
  }

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return false;
  }

  IsPermanent(): boolean {
    return true;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.PACK_RAT, ModifierFunction.TOOLTIP];
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.CAN_USE_BACKPACK_ITEMS]: true,
    };
  }

  /** Pack Rat is boolean in the current engine; per-slot gating is handled above. */
  GetModifierIsPackRat(): number {
    return 1;
  }

  OnTooltip(): number {
    return Math.min(this.GetStackCount(), MAX_UNLOCKED_ITEM_SLOTS);
  }

  GetTexture(): string {
    return 'item_inventory_slot_unlock';
  }
}
