/** 全图建筑与塔射程的缓存：建筑只会减少，有一座倒了就重扫，并定期重扫兜底。 */

const BUILDING_CLASSES = ['npc_dota_tower', 'npc_dota_barracks', 'npc_dota_fort'];
const REFRESH_SECONDS = 30;

let buildings: CDOTA_BaseNPC[] = [];
let towers: CDOTA_BaseNPC[] = [];
let refreshAt = -Infinity;
const attackRanges = new Map<EntityIndex, number>();

function IsGone(unit: CDOTA_BaseNPC): boolean {
  return unit.IsNull() || !unit.IsAlive();
}

/** 双方所有存活的塔、兵营与基地。 */
export function CachedBuildings(): CDOTA_BaseNPC[] {
  const now = GameRules.GetGameTime();
  if (now < refreshAt && !buildings.some(IsGone)) {
    return buildings;
  }
  buildings = [];
  for (const className of BUILDING_CLASSES) {
    for (const unit of Entities.FindAllByClassname(className) as CDOTA_BaseNPC[]) {
      if (!IsGone(unit)) {
        buildings.push(unit);
      }
    }
  }
  towers = buildings.filter((unit) => unit.GetClassname() === 'npc_dota_tower');
  refreshAt = now + REFRESH_SECONDS;
  return buildings;
}

/** 双方所有存活的塔。 */
export function CachedTowers(): CDOTA_BaseNPC[] {
  CachedBuildings();
  return towers;
}

export function TowerAttackRange(tower: CDOTA_BaseNPC): number {
  const index = tower.GetEntityIndex();
  let range = attackRanges.get(index);
  if (range === undefined) {
    range = tower.Script_GetAttackRange();
    attackRanges.set(index, range);
  }
  return range;
}

let outposts: CDOTA_BaseNPC[] = [];

/** 全图的前哨：开局就在、位置不变，只找一次；归属随占领变化，用时再读。 */
export function CachedOutposts(): CDOTA_BaseNPC[] {
  if (outposts.length === 0) {
    outposts = Entities.FindAllByClassname('npc_dota_watch_tower') as CDOTA_BaseNPC[];
  }
  return outposts.filter((unit) => IsValidEntity(unit));
}
