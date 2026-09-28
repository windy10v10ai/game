/**
 * 召唤物与幻象：原生 bot 关掉后没人给它们下指令。主人附近有敌方英雄就一起打，否则跟着主人；
 * 主人阵亡时（如复仇之魂死后留下的魂）跟着最近的队友打。不区分具体单位，不能攻击的单位只跟随。
 */

const ENGAGE_RADIUS = 1200;
const FOLLOW_DISTANCE = 500;

export function ControlSummons(team: DotaTeam, members: CDOTA_BaseNPC_Hero[]): void {
  const owners = new Map<PlayerID, CDOTA_BaseNPC_Hero>();
  for (const hero of members) {
    owners.set(hero.GetPlayerOwnerID(), hero);
  }
  const alive = members.filter((hero) => hero.IsAlive());
  if (owners.size === 0 || alive.length === 0) {
    return;
  }
  const units = FindUnitsInRadius(
    team,
    Vector(0, 0, 0),
    undefined,
    FIND_UNITS_EVERYWHERE,
    UnitTargetTeam.FRIENDLY,
    UnitTargetType.HERO + UnitTargetType.BASIC,
    UnitTargetFlags.PLAYER_CONTROLLED,
    FindOrder.ANY,
    false,
  );
  for (const unit of units) {
    if (
      unit.IsRealHero() ||
      unit.IsCourier() ||
      !unit.IsAlive() ||
      !unit.HasMovementCapability() ||
      unit.IsChanneling()
    ) {
      continue;
    }
    const owner = owners.get(unit.GetPlayerOwnerID());
    if (!owner) {
      continue;
    }
    const anchor = owner.IsAlive() ? owner : Nearest(alive, unit.GetAbsOrigin());
    const target = unit.HasAttackCapability() ? FindTarget(team, anchor) : undefined;
    if (target) {
      if (unit.GetAttackTarget() !== target) {
        unit.MoveToTargetToAttack(target);
      }
    } else if (unit.GetRangeToUnit(anchor) > FOLLOW_DISTANCE) {
      unit.MoveToPosition(anchor.GetAbsOrigin());
    }
  }
}

/** 主人正在打的敌方单位优先，否则打主人身边最近的看得见的敌方英雄。 */
function FindTarget(team: DotaTeam, anchor: CDOTA_BaseNPC_Hero): CDOTA_BaseNPC | undefined {
  const attacking = anchor.GetAttackTarget();
  if (
    attacking &&
    IsValidEntity(attacking) &&
    attacking.IsAlive() &&
    attacking.GetTeamNumber() !== team &&
    anchor.GetRangeToUnit(attacking) <= ENGAGE_RADIUS
  ) {
    return attacking;
  }
  return FindUnitsInRadius(
    team,
    anchor.GetAbsOrigin(),
    undefined,
    ENGAGE_RADIUS,
    UnitTargetTeam.ENEMY,
    UnitTargetType.HERO,
    UnitTargetFlags.FOW_VISIBLE + UnitTargetFlags.NO_INVIS,
    FindOrder.CLOSEST,
    false,
  )[0];
}

function Nearest(heroes: CDOTA_BaseNPC_Hero[], pos: Vector): CDOTA_BaseNPC_Hero {
  let best = heroes[0];
  for (const hero of heroes) {
    if (hero.GetAbsOrigin().__sub(pos).Length2D() < best.GetAbsOrigin().__sub(pos).Length2D()) {
      best = hero;
    }
  }
  return best;
}
