import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

/**
 * 真假眼额外槽位（issue #1812）：人类玩家在商店购买真假眼时，物品经 filter 拦截不进背包，
 * 转为英雄身上隐藏 slot ability 的一层充能。点击 HUD 槽位由客户端 ExecuteAbility 放置，
 * 充能/冷却走 ability 自带 charge 系统，本模块不维护任何 net table。
 */
@reloadable
export class WardSlot {
  private static readonly WARD_ITEM_TO_ABILITY: Record<string, string> = {
    item_ward_observer: 'ability_ward_observer_slot',
    item_ward_sentry: 'ability_ward_sentry_slot',
  };

  constructor() {
    ListenToGameEvent('npc_spawned', (keys) => this.onNpcSpawned(keys), this);
    GameRules.GetGameModeEntity().SetItemAddedToInventoryFilter(
      (event) => this.filterItemAdded(event),
      this,
    );
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
      if (hero.HasAbility(abilityName)) {
        continue;
      }
      const ability = hero.AddAbility(abilityName);
      ability.SetLevel(1);
      ability.SetHidden(true);
      // KV 无 ability 初始充能字段，引擎默认值不确定，显式归零保证开局无充能。
      ability.SetCurrentAbilityCharges(0);
    }
  }

  /**
   * return false 阻止 ward 物品进背包；此时购买的扣金币、扣库存已发生，
   * 改为给对应 slot ability 加一层充能。仅拦截人类玩家，bot 照常入背包。
   */
  private filterItemAdded(event: ItemAddedToInventoryFilterEvent): boolean {
    const item = EntIndexToHScript(event.item_entindex_const) as CDOTA_Item | undefined;
    const hero = EntIndexToHScript(event.inventory_parent_entindex_const) as
      | CDOTA_BaseNPC_Hero
      | undefined;
    if (!item || !hero) {
      return true;
    }

    const abilityName = WardSlot.WARD_ITEM_TO_ABILITY[item.GetAbilityName()];
    if (!abilityName) {
      return true;
    }
    if (!PlayerHelper.IsHumanPlayer(hero)) {
      return true;
    }

    const ability = hero.FindAbilityByName(abilityName);
    if (!ability) {
      return true;
    }

    // 物品自身可能携带多层充能（堆叠购买），按其充能数累加。
    const charges = Math.max(1, item.GetCurrentCharges());
    ability.SetCurrentAbilityCharges(ability.GetCurrentAbilityCharges() + charges);
    UTIL_Remove(item);
    return false;
  }
}
