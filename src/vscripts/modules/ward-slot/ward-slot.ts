import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

/**
 * 真假眼额外槽位（issue #1812）：人类玩家成功获得商店真假眼后，删除入包物品，
 * 转为英雄身上隐藏 slot ability 的一层充能。充能/冷却走 ability 自带 charge 系统。
 */
@reloadable
export class WardSlot {
  private static readonly WARD_ITEM_TO_ABILITY: Record<string, string> = {
    item_ward_observer: 'ability_ward_observer_slot',
    item_ward_sentry: 'ability_ward_sentry_slot',
  };

  constructor() {
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

    const abilityName = WardSlot.WARD_ITEM_TO_ABILITY[event.itemname];
    if (!abilityName) {
      return;
    }

    const hero = EntIndexToHScript(event.inventory_parent_entindex) as
      | CDOTA_BaseNPC_Hero
      | undefined;
    if (!hero || !hero.IsRealHero() || !PlayerHelper.IsHumanPlayer(hero)) {
      return;
    }

    this.ensureSlotAbilities(hero);

    // 购买必须先成功入包，商店库存/金币才会被原生系统正确结算。
    // 下一帧再删除物品，避免在 inventory 事件回调中修改刚加入的 item。
    Timers.CreateTimer(0, () => {
      const item = EntIndexToHScript(event.item_entindex) as CDOTA_Item | undefined;
      const ability = hero.FindAbilityByName(abilityName);
      if (!item || !ability) {
        return;
      }

      const charges = Math.max(1, item.GetCurrentCharges());
      ability.SetCurrentAbilityCharges(ability.GetCurrentAbilityCharges() + charges);
      hero.RemoveItem(item);
    });
  }
}
