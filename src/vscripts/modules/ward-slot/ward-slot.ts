import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

const global = globalThis as typeof globalThis & {
  wardSlotProcessedItemEntIndexes?: Set<EntityIndex>;
};

if (!global.wardSlotProcessedItemEntIndexes) {
  global.wardSlotProcessedItemEntIndexes = new Set<EntityIndex>();
}

/**
 * 真假眼额外槽位（issue #1812）：人类玩家成功获得商店真假眼后，删除入包物品，
 * 转为英雄身上隐藏 slot ability 的一层充能。充能/冷却走 ability 自带 charge 系统。
 */
@reloadable
export class WardSlot {
  private readonly processedItemEntIndexes = global.wardSlotProcessedItemEntIndexes!;

  private static readonly WARD_ITEM_TO_ABILITY: Record<string, string> = {
    item_ward_observer: 'ability_ward_observer_slot',
    item_ward_sentry: 'ability_ward_sentry_slot',
  };

  /**
   * dispenser（同时购买真假眼合成）进包时拆为真眼+假眼各 +1 charge，
   * 然后删除 dispenser 物品。key 同时也是 processed 标记，
   * 防止同一次物品转换被重复处理。
   */
  private static readonly DISPENSER_ABILITIES = [
    'ability_ward_observer_slot',
    'ability_ward_sentry_slot',
  ] as const;

  constructor() {
    GameRules.GetGameModeEntity().ClearItemAddedToInventoryFilter();
    ListenToGameEvent('npc_spawned', (keys) => this.onNpcSpawned(keys), this);
    ListenToGameEvent('dota_inventory_item_added', (keys) => this.onInventoryItemAdded(keys), this);
  }

  private onNpcSpawned(keys: GameEventProvidedProperties & NpcSpawnedEvent): void {
    const npc = EntIndexToHScript(keys.entindex) as CDOTA_BaseNPC | undefined;
    if (!npc || !npc.IsRealHero() || keys.is_respawn === 1) {
      return;
    }
    if (!PlayerHelper.IsHumanPlayer(npc)) {
      return;
    }
    this.ensureSlotAbilities(npc as CDOTA_BaseNPC_Hero);
  }

  private ensureSlotAbilities(hero: CDOTA_BaseNPC_Hero): void {
    for (const abilityName of Object.values(WardSlot.WARD_ITEM_TO_ABILITY)) {
      let ability = hero.FindAbilityByName(abilityName);
      const isNewAbility = ability == null;
      if (!ability) {
        ability = hero.AddAbility(abilityName);
      }
      ability.SetLevel(1);
      ability.SetActivated(true);
      if (isNewAbility) {
        // KV 无 ability 初始充能字段，引擎默认值不确定，显式归零保证开局无充能。
        ability.SetCurrentAbilityCharges(0);
      }
    }
  }

  private onInventoryItemAdded(
    event: GameEventProvidedProperties & DotaInventoryItemAddedEvent,
  ): void {
    if (event.is_courier === 1) {
      return;
    }
    if (this.processedItemEntIndexes.has(event.item_entindex)) {
      return;
    }
    this.processedItemEntIndexes.add(event.item_entindex);

    const isDispenser = event.itemname === 'item_ward_dispenser';
    const abilityName = WardSlot.WARD_ITEM_TO_ABILITY[event.itemname];
    if (!abilityName && !isDispenser) {
      return;
    }

    const hero = EntIndexToHScript(event.inventory_parent_entindex) as
      | CDOTA_BaseNPC_Hero
      | undefined;
    if (!hero || !hero.IsRealHero() || !PlayerHelper.IsHumanPlayer(hero)) {
      return;
    }

    this.ensureSlotAbilities(hero);

    Timers.CreateTimer(0, () => {
      const item = EntIndexToHScript(event.item_entindex) as CDOTA_Item | undefined;
      if (!item) {
        return;
      }

      if (isDispenser) {
        for (const dispAbility of WardSlot.DISPENSER_ABILITIES) {
          const disp = hero.FindAbilityByName(dispAbility);
          if (disp) {
            disp.SetCurrentAbilityCharges(disp.GetCurrentAbilityCharges() + 1);
          }
        }
      } else if (abilityName) {
        const ability = hero.FindAbilityByName(abilityName);
        if (ability) {
          ability.SetCurrentAbilityCharges(ability.GetCurrentAbilityCharges() + 1);
        }
      }

      hero.RemoveItem(item);
    });
  }
}
