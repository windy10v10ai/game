/** 接管后原生不再买眼，由团队定期补：从本队商店库存里买，和玩家共用同一份库存。 */

import { PlayerHelper } from '../../modules/helper/player-helper';
import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import { pickWardBuyer, WardBuyer } from './ward-decision';
import { OBSERVER_WARD_CONFIG, SENTRY_WARD_CONFIG, WardTypeConfig } from './ward-position-config';

const CHECK_SECONDS = 10;
// 有玩家的队伍给玩家留几个，不让 bot 把商店买空
const PLAYER_RESERVE = 2;
const FIELD_SLOTS = 9;
// 备用栏里的物品不能使用，眼只有在主物品栏里电脑才插得出去
const MAIN_SLOTS = 6;

interface SupplySpec {
  item: string;
  config: WardTypeConfig;
  /** 本队插着的加 bot 手里的上限 */
  teamCap: number;
  /** 每个 bot 身上最多带几个 */
  perBotCap: number;
}

// 假眼靠路过和绕路插，手里攒太多也插不出去。真眼只留给反隐与少数肉山、神符点
const SUPPLIES: readonly SupplySpec[] = [
  { item: 'item_ward_observer', config: OBSERVER_WARD_CONFIG, teamCap: 4, perBotCap: 2 },
  { item: 'item_ward_sentry', config: SENTRY_WARD_CONFIG, teamCap: 3, perBotCap: 1 },
];

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
  for (const spec of SUPPLIES) {
    SupplyOne(team, members, powerOf, spec);
  }
}

function SupplyOne(
  team: DotaTeam,
  members: readonly CDOTA_BaseNPC_Hero[],
  powerOf: (hero: CDOTA_BaseNPC_Hero) => number,
  spec: SupplySpec,
): void {
  let owned = 0;
  for (const ward of Entities.FindAllByClassname(spec.config.wardClassName) as CBaseEntity[]) {
    if (ward.GetTeamNumber() === team) {
      owned++;
    }
  }
  const placed = owned;
  const buyers: WardBuyer[] = [];
  for (const hero of members) {
    if (!IsValidEntity(hero) || !hero.IsAlive()) {
      continue;
    }
    let mainUsed = 0;
    let holding = 0;
    let holdingMain = 0;
    for (let slot = 0; slot < FIELD_SLOTS; slot++) {
      const item = hero.GetItemInSlot(slot);
      if (!item) {
        continue;
      }
      if (slot < MAIN_SLOTS) {
        mainUsed++;
      }
      // 侦察与岗哨合成的组合守卫里，侦察守卫的数量记在当前充能上
      if (spec.config.itemNames.includes(item.GetName())) {
        holding += item.GetCurrentCharges();
        if (slot < MAIN_SLOTS) {
          holdingMain += item.GetCurrentCharges();
        }
      }
    }
    owned += holding;
    buyers.push({
      id: hero.GetEntityIndex(),
      power: powerOf(hero),
      gold: hero.GetGold(),
      hasRoom: holding < spec.perBotCap && (holdingMain > 0 || mainUsed < MAIN_SLOTS),
    });
  }
  if (buyers.length === 0) {
    return;
  }
  if (IS_DEBUG_RUN) {
    print(
      `[bot-ward] summary t=${Math.floor(GameRules.GetGameTime())} team=${team} item=${spec.item} placed=${placed} carrying=${owned - placed}`,
    );
  }

  const playerId = members[0].GetPlayerOwnerID();
  const stock = GameRules.GetItemStockCount(team, spec.item, playerId);
  let hasPlayers = false;
  PlayerHelper.ForEachPlayer((id) => {
    hasPlayers =
      hasPlayers ||
      (PlayerResource.GetTeam(id) === team && PlayerHelper.IsHumanPlayerByPlayerId(id));
  });
  const cost = GetItemCost(spec.item);
  const buyerId = pickWardBuyer(buyers, {
    owned,
    cap: spec.teamCap,
    stock,
    reserve: hasPlayers ? PLAYER_RESERVE : 0,
    cost,
  });
  if (buyerId === undefined) {
    return;
  }
  const hero = EntIndexToHScript(buyerId as EntityIndex) as CDOTA_BaseNPC_Hero;
  if (!hero.AddItemByName(spec.item)) {
    return;
  }
  hero.SpendGold(cost, ModifyGoldReason.PURCHASE_ITEM);
  GameRules.SetItemStockCount(stock - 1, team, spec.item, playerId);
  if (IS_DEBUG_RUN) {
    print(
      `[bot-ai] team=${team} ward_buy=${spec.item}:${hero.GetUnitName().replace('npc_dota_hero_', '')} owned=${owned} stock=${stock}`,
    );
  }
}
