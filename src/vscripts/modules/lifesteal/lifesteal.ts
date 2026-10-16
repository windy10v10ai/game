/** 吸血与法术吸血：各来源登记百分比，每个单位汇总后只在共享伤害监听上挂一条处理，按 Dota 2 规则回血 */
import { ModifierEventHub } from '../modifier-event/modifier-event-hub';

// 打非英雄单位时的折算（DOTA_ATTACK_LIFESTEAL_CREEP_FACTOR 与法术吸血的小兵折算）
const ATTACK_CREEP_FACTOR = 0.6;
const SPELL_CREEP_FACTOR = 0.2;

type Rates = { attack: number; spell: number };

type UnitLifesteal = {
  unit: CDOTA_BaseNPC;
  sources: Map<CDOTA_Buff, Rates>;
  attack: number;
  spell: number;
};

const byUnit = new Map<EntityIndex, UnitLifesteal>();

function canLifestealFrom(target: CDOTA_BaseNPC): boolean {
  return !target.IsBuilding() && !target.IsOther() && !target.IsWard() && !target.IsCourier();
}

function heal(
  owner: CDOTA_BaseNPC,
  amount: number,
  event: ModifierInstanceEvent,
  isSpell: boolean,
) {
  if (amount <= 0) return;
  owner.HealWithParams(amount, event.inflictor ?? {}, true, true, owner, isSpell);
  const particle = ParticleManager.CreateParticle(
    isSpell
      ? 'particles/items3_fx/octarine_core_lifesteal.vpcf'
      : 'particles/generic_gameplay/generic_lifesteal.vpcf',
    ParticleAttachment.ABSORIGIN_FOLLOW,
    owner,
  );
  ParticleManager.ReleaseParticleIndex(particle);
}

function onDamage(entry: UnitLifesteal, event: ModifierInstanceEvent): void {
  const owner = entry.unit;
  const target = event.unit;
  if (target.GetTeam() === owner.GetTeam()) return;
  const flags = event.damage_flags;
  if ((flags & (DamageFlag.REFLECTION | DamageFlag.HPLOSS)) !== 0) return;

  // 普攻的物理伤害吃吸血；技能伤害与普攻的魔法伤害吃法术吸血；纯粹伤害都不吃
  if (event.inflictor === undefined && event.damage_type === DamageTypes.PHYSICAL) {
    if (entry.attack <= 0) return;
    // 分裂、月刃等次级攻击不触发
    if ((flags & DamageFlag.SECONDARY_PROJECTILE_ATTACK) !== 0) return;
    if (!canLifestealFrom(target)) return;
    const factor = target.IsHero() ? 1 : ATTACK_CREEP_FACTOR;
    heal(owner, (event.damage * entry.attack * factor) / 100, event, false);
    return;
  }

  if (entry.spell <= 0 || event.damage_type === DamageTypes.PURE) return;
  if ((flags & DamageFlag.NO_SPELL_LIFESTEAL) !== 0) return;
  if (target.IsIllusion() || !canLifestealFrom(target)) return;
  const factor = target.IsHero() ? 1 : SPELL_CREEP_FACTOR;
  heal(owner, (event.damage * entry.spell * factor) / 100, event, true);
}

// 每次都按登记表整体重算，并丢掉已失效的来源，漏注销也不会一直多吸
function recompute(entry: UnitLifesteal): void {
  let attack = 0;
  let spell = 0;
  const stale: CDOTA_Buff[] = [];
  for (const [source, rates] of entry.sources) {
    if (source.IsNull()) {
      stale.push(source);
      continue;
    }
    attack += rates.attack;
    spell += rates.spell;
  }
  stale.forEach((source) => entry.sources.delete(source));
  entry.attack = attack;
  entry.spell = spell;
}

function release(unitIndex: EntityIndex, entry: UnitLifesteal): void {
  byUnit.delete(unitIndex);
  if (!entry.unit.IsNull()) {
    ModifierEventHub.UnregisterDamageByAttacker(entry.unit, entry);
  }
}

export class Lifesteal {
  /** 登记或覆盖某个来源给单位的吸血与法术吸血百分比，来源一般传 modifier 自身 */
  static Set(unit: CDOTA_BaseNPC, source: CDOTA_Buff, attack: number, spell: number): void {
    const unitIndex = unit.entindex();
    let entry = byUnit.get(unitIndex);
    if (entry === undefined) {
      const created: UnitLifesteal = { unit, sources: new Map(), attack: 0, spell: 0 };
      ModifierEventHub.RegisterDamageByAttacker(unit, created, (event) => onDamage(created, event));
      byUnit.set(unitIndex, created);
      entry = created;
    }
    entry.sources.set(source, { attack, spell });
    recompute(entry);
  }

  /** 注销某个来源，重复注销无副作用 */
  static Remove(unit: CDOTA_BaseNPC, source: CDOTA_Buff): void {
    const unitIndex = unit.entindex();
    const entry = byUnit.get(unitIndex);
    if (entry === undefined) return;
    entry.sources.delete(source);
    recompute(entry);
    if (entry.sources.size === 0) {
      release(unitIndex, entry);
    }
  }

  /** 单位当前汇总的吸血与法术吸血百分比 */
  static Get(unit: CDOTA_BaseNPC): Rates {
    const entry = byUnit.get(unit.entindex());
    return { attack: entry?.attack ?? 0, spell: entry?.spell ?? 0 };
  }
}
