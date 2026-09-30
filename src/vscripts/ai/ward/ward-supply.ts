/** 接管后原生不再买眼，由团队定期补：从本队商店库存里买，和玩家共用同一份库存。 */

import { PlayerHelper } from '../../modules/helper/player-helper';
import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import { pickWardBuyer, WardBuyer } from './ward-decision';
import { OBSERVER_WARD_CONFIG } from './ward-position-config';

const WARD_ITEM = 'item_ward_observer';
const CHECK_SECONDS = 10;
// 眼的插法是路过预设眼位才插，手里攒太多也插不出去
const TEAM_WARD_CAP = 4;
// 有玩家的队伍给玩家留一个，不让 bot 把商店买空
const PLAYER_RESERVE = 1;
const FIELD_SLOTS = 9;

const checkedAt = new Map<DotaTeam, number>();

export function SupplyWards(
  team: DotaTeam,
  members: readonly CDOTA_BaseNPC_Hero[],
  powerOf: (hero: CDOTA_BaseNPC_Hero) => number,
): void {
  const now = GameRules.GetGameTime();
  if (now - (checkedAt.get(team) ?? -Infinity) < CHECK_SECONDS) {
    return;
  }
  checkedAt.set(team, now);

  let owned = 0;
  for (const ward of Entities.FindAllByClassname(
    OBSERVER_WARD_CONFIG.wardClassName,
  ) as CBaseEntity[]) {
    if (ward.GetTeamNumber() === team) {
      owned++;
    }
  }
  const buyers: WardBuyer[] = [];
  for (const hero of members) {
    if (!IsValidEntity(hero) || !hero.IsAlive()) {
      continue;
    }
    let used = 0;
    let holding = false;
    for (let slot = 0; slot < FIELD_SLOTS; slot++) {
      const item = hero.GetItemInSlot(slot);
      if (!item) {
        continue;
      }
      used++;
      if (item.GetName() === WARD_ITEM) {
        owned += item.GetCurrentCharges();
        holding = true;
      }
    }
    buyers.push({
      id: hero.GetEntityIndex(),
      power: powerOf(hero),
      gold: hero.GetGold(),
      hasRoom: holding || used < FIELD_SLOTS,
    });
  }
  if (buyers.length === 0) {
    return;
  }

  const playerId = members[0].GetPlayerOwnerID();
  const stock = GameRules.GetItemStockCount(team, WARD_ITEM, playerId);
  let hasPlayers = false;
  PlayerHelper.ForEachPlayer((id) => {
    hasPlayers =
      hasPlayers ||
      (PlayerResource.GetTeam(id) === team && PlayerHelper.IsHumanPlayerByPlayerId(id));
  });
  const cost = GetItemCost(WARD_ITEM);
  const buyerId = pickWardBuyer(buyers, {
    owned,
    cap: TEAM_WARD_CAP,
    stock,
    reserve: hasPlayers ? PLAYER_RESERVE : 0,
    cost,
  });
  if (buyerId === undefined) {
    return;
  }
  const hero = EntIndexToHScript(buyerId as EntityIndex) as CDOTA_BaseNPC_Hero;
  if (!hero.AddItemByName(WARD_ITEM)) {
    return;
  }
  hero.SpendGold(cost, ModifyGoldReason.PURCHASE_ITEM);
  GameRules.SetItemStockCount(stock - 1, team, WARD_ITEM, playerId);
  if (IS_DEBUG_RUN) {
    print(
      `[bot-ai] team=${team} ward_buy=${hero.GetUnitName().replace('npc_dota_hero_', '')} owned=${owned} stock=${stock}`,
    );
  }
}
