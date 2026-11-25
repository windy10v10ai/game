/** 接管后原生不再买眼，由团队定期补：从本队商店库存里买，和玩家共用同一份库存。 */

import { PlayerHelper } from '../../modules/helper/player-helper';
import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import { countHeldWards, HeldItem, pickWardBuyer, WardBuyer, WardKind } from './ward-decision';
import { WardPlacement } from './ward-placement';
import { OBSERVER_WARD_CONFIG, SENTRY_WARD_CONFIG, WardTypeConfig } from './ward-position-config';

const CHECK_SECONDS = 10;
// 有玩家的队伍给玩家留几个，不让 bot 把商店买空
const PLAYER_RESERVE = 2;
const FIELD_SLOTS = 9;

interface SupplySpec {
  item: string;
  kind: WardKind;
  config: WardTypeConfig;
  /** 本队插着的加 bot 手里的上限 */
  teamCap: number;
  /** 每个 bot 身上最多带几个 */
  perBotCap: number;
  /** Buy only while the team has an open target, so wards are not stockpiled with no place to go. */
  needsOpenTarget: boolean;
}

// 假眼靠路过和绕路插，手里攒太多也插不出去。真眼只留给反隐与少数肉山、神符点
const SUPPLIES: readonly SupplySpec[] = [
  {
    item: 'item_ward_observer',
    kind: 'observer',
    config: OBSERVER_WARD_CONFIG,
    teamCap: 4,
    perBotCap: 2,
    needsOpenTarget: true,
  },
  {
    item: 'item_ward_sentry',
    kind: 'sentry',
    config: SENTRY_WARD_CONFIG,
    teamCap: 3,
    perBotCap: 1,
    needsOpenTarget: false,
  },
];

const checkedAt = new Map<DotaTeam, number>();
// 调试日志：每个场上的眼只记一次
const loggedWards = new Set<EntityIndex>();

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
      if (IS_DEBUG_RUN && !loggedWards.has(ward.GetEntityIndex())) {
        loggedWards.add(ward.GetEntityIndex());
        const position = ward.GetAbsOrigin();
        print(
          `[bot-ward] field t=${Math.floor(GameRules.GetGameTime())} team=${team} item=${spec.item} pos=${Math.floor(position.x)},${Math.floor(position.y)} owner=${ward.GetOwnerEntity()?.GetName()}`,
        );
      }
    }
  }
  const placed = owned;
  // 持有数只看谁带着眼（含阵亡的），买家另看谁现在能买
  const buyers: WardBuyer[] = [];
  for (const hero of members) {
    if (!IsValidEntity(hero) || !PlayerHelper.IsBotPlayer(hero)) {
      continue;
    }
    const items: HeldItem[] = [];
    let slotsUsed = 0;
    for (let slot = 0; slot < FIELD_SLOTS; slot++) {
      const item = hero.GetItemInSlot(slot);
      if (!item) {
        continue;
      }
      slotsUsed++;
      items.push({
        name: item.GetName(),
        charges: item.GetCurrentCharges(),
        secondaryCharges: item.GetSecondaryCharges(),
      });
    }
    const held = countHeldWards(spec.kind, items);
    owned += held.total;
    if (!hero.IsAlive()) {
      continue;
    }
    const roomed = held.total < spec.perBotCap;
    const slotted = held.canStack || slotsUsed < FIELD_SLOTS;
    buyers.push({
      id: hero.GetEntityIndex(),
      power: powerOf(hero),
      gold: hero.GetGold(),
      hasRoom: roomed && slotted,
      holdsOtherKind: held.holdsOtherKind,
    });
  }
  if (buyers.length === 0) {
    return;
  }
  if (spec.needsOpenTarget && WardPlacement.TargetsOf(team, spec.config).length === 0) {
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
  // 发物品和扣金前再确认一次买家是电脑，身份取不到就跳过
  if (!hero || !PlayerHelper.IsBotPlayer(hero)) {
    return;
  }
  const added = hero.AddItemByName(spec.item);
  if (!added) {
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
