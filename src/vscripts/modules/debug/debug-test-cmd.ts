/** 实机测试用调试命令：输出数值快照、监视状态变化、代码施法、刷靶子，输出统一带 `[test]` 前缀供日志检索。 */
import { IsAbilityBehavior } from '../../ai/action/cast-condition';
import { CMD } from './debug-cmd';

const WATCH_INTERVAL = 0.1;
const DUMMY_UNIT = 'npc_dota_hero_target_dummy';

interface UnitSnapshot {
  modifiers: Map<string, number>;
  values: Map<string, number>;
}

const dummies: CDOTA_BaseNPC[] = [];
const watched = new Map<EntityIndex, UnitSnapshot>();
let watching = false;

function log(message: string): void {
  print(`[test] t=${GameRules.GetDOTATime(false, true).toFixed(1)} ${message}`);
}

function readValues(unit: CDOTA_BaseNPC): Map<string, number> {
  const values = new Map<string, number>();
  values.set('hp', math.floor(unit.GetHealth()));
  values.set('mp', math.floor(unit.GetMana()));
  values.set('ms', math.floor(unit.GetIdealSpeed()));
  if (unit.IsHero()) {
    values.set('str', math.floor(unit.GetStrength()));
    values.set('agi', math.floor(unit.GetAgility()));
    values.set('int', math.floor(unit.GetIntellect(false)));
    values.set('amp', math.floor(unit.GetSpellAmplification(false) * 100));
  }
  return values;
}

function readModifiers(unit: CDOTA_BaseNPC): Map<string, number> {
  const modifiers = new Map<string, number>();
  for (const modifier of unit.FindAllModifiers()) {
    const name = modifier.GetName();
    modifiers.set(name, (modifiers.get(name) ?? 0) + 1);
  }
  return modifiers;
}

function unitLabel(unit: CDOTA_BaseNPC): string {
  return `${unit.GetUnitName()}#${unit.entindex()}`;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** 按类别分行输出单位能从引擎读到的全部数值，用于对照伤害、增益的实测结果。 */
function logStat(unit: CDOTA_BaseNPC): void {
  const label = unitLabel(unit);
  log(
    `stat ${label} base lvl=${unit.GetLevel()} hp=${math.floor(unit.GetHealth())}/${unit.GetMaxHealth()}` +
      ` mp=${math.floor(unit.GetMana())}/${math.floor(unit.GetMaxMana())}` +
      ` hpRegen=${unit.GetHealthRegen().toFixed(1)} mpRegen=${unit.GetManaRegen().toFixed(1)}` +
      ` ms=${math.floor(unit.GetIdealSpeed())} baseMs=${unit.GetBaseMoveSpeed()}`,
  );
  if (unit.IsHero()) {
    log(
      `stat ${label} attr str=${math.floor(unit.GetStrength())}(${unit.GetBaseStrength()})` +
        ` agi=${math.floor(unit.GetAgility())}(${unit.GetBaseAgility()})` +
        ` int=${math.floor(unit.GetIntellect(false))}(${unit.GetBaseIntellect()})` +
        ` primary=${math.floor(unit.GetPrimaryStatValue())}`,
    );
  }
  log(
    `stat ${label} attack dmg=${math.floor(unit.GetAverageTrueAttackDamage(undefined))}` +
      ` baseDmg=${unit.GetBaseDamageMin()}-${unit.GetBaseDamageMax()}` +
      ` as=${math.floor(unit.GetDisplayAttackSpeed())} aps=${unit.GetAttacksPerSecond(false).toFixed(2)}` +
      ` range=${math.floor(unit.Script_GetAttackRange())}` +
      ` evasion=${pct(unit.GetEvasion())}`,
  );
  log(
    `stat ${label} defense armor=${unit.GetPhysicalArmorValue(false).toFixed(1)}` +
      ` mres=${pct(unit.Script_GetMagicalArmorValue(undefined as unknown as object))}` +
      ` statusRes=${pct(unit.GetStatusResistance())}`,
  );
  log(
    `stat ${label} spell amp=${pct(unit.GetSpellAmplification(false))}` +
      ` castRange=+${unit.GetCastRangeBonus()} cdr=${unit.GetCooldownReduction().toFixed(3)}`,
  );
  if (unit.IsHero()) {
    const items: string[] = [];
    for (let slot = 0; slot < 6; slot++) {
      const item = unit.GetItemInSlot(slot);
      if (item) items.push(`${item.GetName()}:cd=${item.GetCooldownTimeRemaining().toFixed(1)}`);
    }
    log(`stat ${label} items ${items.join(' ')}`);
  }
}

function diffUnit(unit: CDOTA_BaseNPC, before: UnitSnapshot): UnitSnapshot {
  const label = unitLabel(unit);
  const modifiers = readModifiers(unit);
  modifiers.forEach((count, name) => {
    if ((before.modifiers.get(name) ?? 0) >= count) return;
    const remaining = unit.FindModifierByName(name)?.GetRemainingTime() ?? -1;
    log(`watch ${label} +${name} dur=${remaining < 0 ? 'inf' : remaining.toFixed(2)}`);
  });
  before.modifiers.forEach((count, name) => {
    if ((modifiers.get(name) ?? 0) < count) log(`watch ${label} -${name}`);
  });

  const values = readValues(unit);
  values.forEach((value, key) => {
    const old = before.values.get(key);
    if (old === undefined || old === value) return;
    const delta = value - old;
    // 自然回复每 0.1 秒都会变，只输出超出回复量的增长；减少一律输出
    const regen =
      key === 'hp' ? unit.GetHealthRegen() : key === 'mp' ? unit.GetManaRegen() : undefined;
    if (regen !== undefined && delta > 0 && delta <= regen * WATCH_INTERVAL + 1) return;
    log(`watch ${label} ${key} ${old}->${value} (${delta > 0 ? '+' : ''}${delta})`);
  });
  return { modifiers, values };
}

function addWatch(unit: CDOTA_BaseNPC): void {
  watched.set(unit.entindex(), { modifiers: readModifiers(unit), values: readValues(unit) });
  const pos = unit.GetAbsOrigin();
  log(
    `watch start ${unitLabel(unit)} pos=${math.floor(pos.x)},${math.floor(pos.y)}` +
      ` armor=${unit.GetPhysicalArmorValue(false).toFixed(1)}` +
      ` mres=${pct(unit.Script_GetMagicalArmorValue(undefined as unknown as object))}`,
  );
}

function startWatch(hero: CDOTA_BaseNPC_Hero, radius: number): void {
  watched.clear();
  const units: CDOTA_BaseNPC[] = [hero, ...dummies.filter((dummy) => IsValidEntity(dummy))];
  if (radius > 0) {
    const enemies = FindUnitsInRadius(
      hero.GetTeamNumber(),
      hero.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC + UnitTargetType.BUILDING,
      UnitTargetFlags.INVULNERABLE,
      FindOrder.CLOSEST,
      false,
    );
    units.push(...enemies);
  }
  units.forEach(addWatch);

  watching = true;
  Timers.CreateTimer(WATCH_INTERVAL, (): number | undefined => {
    if (!watching) return undefined;
    watched.forEach((before, index) => {
      const unit = EntIndexToHScript(index) as CDOTA_BaseNPC | undefined;
      if (!unit || !IsValidEntity(unit)) {
        log(`watch #${index} removed`);
        watched.delete(index);
        return;
      }
      watched.set(index, diffUnit(unit, before));
    });
    return WATCH_INTERVAL;
  });
}

/** 在指定位置刷一个中立训练假人，同时被双方视为敌人。 */
export function spawnTargetDummy(playerId: PlayerID, position: Vector): void {
  // 假人不在开局预载列表里，同步创建会没有模型
  PrecacheUnitByNameAsync(DUMMY_UNIT, () => {
    const dummy = CreateUnitByName(
      DUMMY_UNIT,
      position,
      true,
      undefined,
      undefined,
      DotaTeam.NEUTRALS,
    );
    dummy.SetControllableByPlayer(playerId, false);
    dummy.Hold();
    dummy.SetIdleAcquire(false);
    dummy.SetAcquisitionRange(0);
    dummies.push(dummy);
    log(`dummy ${unitLabel(dummy)}`);
    if (watching) addWatch(dummy);
  });
}

function lastDummy(): CDOTA_BaseNPC | undefined {
  for (let i = dummies.length - 1; i >= 0; i--) {
    if (IsValidEntity(dummies[i]) && dummies[i].IsAlive()) return dummies[i];
  }
  return undefined;
}

function castByCommand(hero: CDOTA_BaseNPC_Hero, args: string[]): void {
  const [name, xArg, yArg] = args;
  const ability = hero.FindItemInInventory(name) ?? hero.FindAbilityByName(name);
  if (!ability) {
    log(`cast ${name} not found`);
    return;
  }

  const order: ExecuteOrderOptions = {
    UnitIndex: hero.entindex(),
    AbilityIndex: ability.entindex(),
    OrderType: UnitOrder.CAST_NO_TARGET,
    Queue: false,
  };
  if (xArg === '@dummy') {
    const dummy = lastDummy();
    if (!dummy) {
      log(`cast ${name} no dummy`);
      return;
    }
    if (IsAbilityBehavior(ability, AbilityBehavior.POINT)) {
      order.OrderType = UnitOrder.CAST_POSITION;
      order.Position = dummy.GetAbsOrigin();
    } else {
      order.OrderType = UnitOrder.CAST_TARGET;
      order.TargetIndex = dummy.entindex();
    }
  } else if (xArg !== undefined && yArg !== undefined) {
    order.OrderType = UnitOrder.CAST_POSITION;
    order.Position = hero.GetAbsOrigin().__add(Vector(Number(xArg), Number(yArg), 0));
  }
  ExecuteOrderFromTable(order);
  log(`cast ${name}`);
}

// 会改动整局状态，只在工具模式放行
export function handleTestDebugCommand(
  cmd: string,
  args: string[],
  hero: CDOTA_BaseNPC_Hero | undefined,
): void {
  if (!IsInToolsMode() || !hero) return;

  if (cmd === CMD.STAT) {
    logStat(hero);
    const playerId = hero.GetPlayerOwnerID();
    HeroList.GetAllHeroes()
      .filter((other) => other !== hero && other.GetPlayerOwnerID() === playerId)
      .forEach(logStat);
    dummies.filter((dummy) => IsValidEntity(dummy)).forEach(logStat);
  }
  if (cmd === CMD.WATCH) {
    if (watching) {
      watching = false;
      log('watch stop');
    } else {
      startWatch(hero, Number(args[0] ?? 0));
    }
  }
  if (cmd === CMD.CAST) {
    castByCommand(hero, args);
  }
  if (cmd === CMD.TP) {
    FindClearSpaceForUnit(hero, Vector(Number(args[0]), Number(args[1]), 0), true);
    hero.Stop();
    log(`tp ${unitLabel(hero)}`);
  }
  if (cmd === CMD.REFRESH) {
    for (let i = 0; i < hero.GetAbilityCount(); i++) {
      const ability = hero.GetAbilityByIndex(i);
      if (!ability || ability.IsHidden()) continue;
      ability.SetLevel(ability.GetMaxLevel());
      ability.EndCooldown();
    }
    for (let slot = 0; slot < 6; slot++) hero.GetItemInSlot(slot)?.EndCooldown();
    hero.SetMana(hero.GetMaxMana());
    log(`refresh ${unitLabel(hero)}`);
  }
  if (cmd === CMD.GIVE) {
    const item = hero.AddItemByName(args[0]);
    log(`give ${args[0]} ${item ? 'ok' : 'failed'}`);
  }
  if (cmd === CMD.HURT) {
    const dummy = lastDummy();
    if (!dummy) {
      log('hurt no dummy');
      return;
    }
    ApplyDamage({
      attacker: dummy,
      victim: hero,
      damage: Number(args[0] ?? 100),
      damage_type: DamageTypes.PURE,
    });
    log(`hurt ${unitLabel(hero)} by ${unitLabel(dummy)}`);
  }
  if (cmd === CMD.DUMMY) {
    const offset = Vector(Number(args[0] ?? 300), Number(args[1] ?? 0), 0);
    spawnTargetDummy(hero.GetPlayerOwnerID(), hero.GetAbsOrigin().__add(offset));
  }
}
