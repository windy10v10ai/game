/** 实机核对：权杖主动效果在物品被卖后的表现，吸血属性与魔龙狂舞经共享监听的触发，以及持有者陆续卖出时的暴击。 */

import {
  property_lifesteal,
  property_spell_lifesteal,
} from '../../modifiers/property/property_declare';
import { DAMAGE_LISTENER_MODIFIER } from '../modifier-event/modifier-event-hub';

const TAG = '[sell-check]';
const HITS_PER_ATTACKER = 40;
const HIT_INTERVAL = 0.15;
const HIT_DAMAGE = 200;

function out(line: string): void {
  print(`${TAG} ${line}`);
}

function verdict(ok: boolean, text: string): void {
  out(`${ok ? 'PASS' : 'FAIL'} ${text}`);
}

function checkScepter(hero: CDOTA_BaseNPC_Hero, itemName: string, done: () => void): void {
  const ampBase = hero.GetSpellAmplification(false);
  const item = hero.AddItemByName(itemName);
  if (!item) {
    verdict(false, `${itemName} could not be added`);
    done();
    return;
  }
  const activeName = `modifier_${itemName}_active`;
  const activeBoost = item.GetSpecialValueFor('active_boost') / 100;
  (item as unknown as { OnSpellStart(): void }).OnSpellStart();
  const ampBefore = hero.GetSpellAmplification(false);
  const hasBefore = hero.HasModifier(activeName);
  hero.RemoveItem(item);
  Timers.CreateTimer(1, () => {
    const hasAfter = hero.HasModifier(activeName);
    const ampAfter = hero.GetSpellAmplification(false);
    out(
      `${itemName} amp base=${ampBase} before sell=${ampBefore} after 1s=${ampAfter} boost=${activeBoost} active before=${hasBefore} after=${hasAfter}`,
    );
    verdict(hasBefore && hasAfter, `${itemName} active modifier survives sale`);
    // 卖出会带走物品自身的被动增强，只要求主动加成仍在
    verdict(
      ampAfter >= ampBase + activeBoost - 0.0001,
      `${itemName} spell amp keeps active boost after sale`,
    );
    hero.RemoveModifierByName(activeName);
    done();
  });
}

// 吸血与法术吸血都靠共享监听分发，能回血说明分发到了属性 modifier
function checkLifesteal(
  hero: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC_Hero,
  done: () => void,
): void {
  const added: string[] = [];
  for (const name of [property_lifesteal.name, property_spell_lifesteal.name]) {
    if (hero.HasModifier(name)) continue;
    hero.AddNewModifier(hero, undefined, name, { value: 50 });
    added.push(name);
  }
  target.SetHealth(target.GetMaxHealth());
  hero.SetHealth(hero.GetMaxHealth() / 2);
  const before = hero.GetHealth();
  ApplyDamage({ victim: target, attacker: hero, damage: 300, damage_type: DamageTypes.PHYSICAL });
  const afterAttack = hero.GetHealth();
  ApplyDamage({
    victim: target,
    attacker: hero,
    damage: 300,
    damage_type: DamageTypes.MAGICAL,
    ability: hero.GetAbilityByIndex(0),
  });
  const afterSpell = hero.GetHealth();
  out(`lifesteal hp before=${before} after attack=${afterAttack} after spell=${afterSpell}`);
  verdict(afterAttack > before, 'attack lifesteal heals');
  verdict(afterSpell > afterAttack, 'spell lifesteal heals');
  added.forEach((name) => hero.RemoveModifierByName(name));
  hero.SetHealth(hero.GetMaxHealth());
  done();
}

function physicalHeal(hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero): number {
  target.SetHealth(target.GetMaxHealth());
  hero.SetHealth(hero.GetMaxHealth() / 2);
  const before = hero.GetHealth();
  ApplyDamage({ victim: target, attacker: hero, damage: 300, damage_type: DamageTypes.PHYSICAL });
  return hero.GetHealth() - before;
}

// 生命之盔被动吸血经共享监听触发，卖出后应随之停止
function checkDraculaMask(
  hero: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC_Hero,
  done: () => void,
): void {
  const without = physicalHeal(hero, target);
  const item = hero.AddItemByName('item_dracula_mask');
  if (!item) {
    verdict(false, 'item_dracula_mask could not be added');
    done();
    return;
  }
  Timers.CreateTimer(0.2, () => {
    const holding = physicalHeal(hero, target);
    hero.RemoveItem(item);
    Timers.CreateTimer(0.2, () => {
      const sold = physicalHeal(hero, target);
      out(`dracula heal without=${without} holding=${holding} sold=${sold}`);
      verdict(holding > without, 'dracula mask lifesteal heals');
      verdict(sold < holding, 'dracula mask lifesteal stops after sale');
      hero.SetHealth(hero.GetMaxHealth());
      done();
    });
  });
}

function countListeners(): number {
  const thinkers = Entities.FindAllByClassname('npc_dota_thinker') as CDOTA_BaseNPC[];
  return thinkers.filter((thinker) => thinker.HasModifier(DAMAGE_LISTENER_MODIFIER)).length;
}

type Counts = Record<string, number>;

function runPhase(
  attackers: CDOTA_BaseNPC_Hero[],
  target: CDOTA_BaseNPC_Hero,
  done: (crits: Counts) => void,
): void {
  const crits: Counts = {};
  attackers.forEach((attacker) => (crits[String(attacker.entindex())] = 0));
  const total = attackers.length * HITS_PER_ATTACKER;
  let index = 0;
  Timers.CreateTimer(0, () => {
    if (index >= total) {
      done(crits);
      return undefined;
    }
    const attacker = attackers[index % attackers.length];
    index++;
    if (!target.IsAlive()) target.RespawnHero(false, false);
    target.SetHealth(target.GetMaxHealth());
    const before = target.GetHealth();
    const dealt = ApplyDamage({
      victim: target,
      attacker,
      damage: HIT_DAMAGE,
      damage_type: DamageTypes.MAGICAL,
      damage_flags: DamageFlag.NONE,
    });
    const loss = before - target.GetHealth();
    if (dealt > 0 && loss > dealt * 1.3) crits[String(attacker.entindex())]++;
    return HIT_INTERVAL;
  });
}

function checkCritBlade(
  a: CDOTA_BaseNPC_Hero,
  b: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC_Hero,
): void {
  // 目标血量放大到不会被连续命中打死
  target.SetBaseMaxHealth(1000000);
  target.SetMaxHealth(1000000);

  const itemA = a.AddItemByName('item_magic_crit_blade');
  const itemB = b.AddItemByName('item_magic_crit_blade');
  if (!itemA || !itemB) {
    verdict(false, 'crit blade could not be added to both holders');
    return;
  }
  const nameA = String(a.entindex());
  const nameB = String(b.entindex());

  Timers.CreateTimer(0.5, () => {
    verdict(countListeners() === 1, `phase1 one shared listener (count=${countListeners()})`);
    runPhase([a, b], target, (p1) => {
      out(
        `phase1 both hold: A(${nameA})=${p1[nameA]} B(${nameB})=${p1[nameB]} of ${HITS_PER_ATTACKER} each`,
      );
      verdict(p1[nameA] > 0, 'phase1 A crits');
      verdict(p1[nameB] > 0, 'phase1 B crits');

      a.RemoveItem(itemA);
      Timers.CreateTimer(0.5, () => {
        verdict(countListeners() === 1, `phase2 one shared listener (count=${countListeners()})`);
        runPhase([a, b], target, (p2) => {
          out(`phase2 A sold: A=${p2[nameA]} B=${p2[nameB]} of ${HITS_PER_ATTACKER} each`);
          verdict(p2[nameB] > 0, 'phase2 B still crits');
          verdict(p2[nameA] === 0, 'phase2 A has no crits');

          b.RemoveItem(itemB);
          Timers.CreateTimer(0.5, () => {
            runPhase([a, b], target, (p3) => {
              out(`phase3 both sold: A=${p3[nameA]} B=${p3[nameB]} of ${HITS_PER_ATTACKER} each`);
              verdict(p3[nameB] === 0, 'phase3 B has no crits');
              verdict(p3[nameA] === 0, 'phase3 A has no crits');
              // 玩家吸血属性也登记在同一个监听上，卖光后监听可能保留，只要求不重复
              const left = countListeners();
              verdict(left <= 1, `phase3 no duplicated listener (count=${left})`);
              out('done');
            });
          });
        });
      });
    });
  });
}

const player = PlayerResource.GetSelectedHeroEntity(0);
if (!player) {
  out('FAIL player 0 hero missing');
} else {
  // 暴击判定不看阵营，另取两个任意英雄当第二持有者和靶子
  const others = HeroList.GetAllHeroes().filter(
    (hero) => hero.entindex() !== player.entindex() && hero.IsRealHero(),
  );
  out(`heroes found=${others.length + 1}`);
  const enemy = others.find((hero) => hero.GetTeam() !== player.GetTeam()) ?? others[0];
  const ally = others.find((hero) => hero !== enemy);
  checkScepter(player, 'item_magic_scepter', () => {
    checkScepter(player, 'item_hallowed_scepter', () => {
      if (!ally || !enemy) {
        verdict(false, 'need two other heroes for crit blade check');
        return;
      }
      checkLifesteal(player, enemy, () =>
        checkDraculaMask(player, enemy, () => checkCritBlade(player, ally, enemy)),
      );
    });
  });
}
