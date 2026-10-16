/** 实机核对：权杖主动效果在物品被卖后的表现，吸血属性与魔龙狂舞经共享监听的触发，以及持有者陆续卖出时的暴击，生命之心经共享监听在永恒之盘触发时的回复，天堂之戟 v2 / 六道轮回枪经共享监听的法术吸血与普攻触发。 */

import {
  property_lifesteal,
  property_spell_lifesteal,
} from '../../modifiers/property/property_declare';
import {
  ATTACK_LANDED_LISTENER_MODIFIER,
  DAMAGE_LISTENER_MODIFIER,
  MODIFIER_ADDED_LISTENER_MODIFIER,
} from '../modifier-event/modifier-event-hub';

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
  ApplyDamage({
    victim: target,
    attacker: hero,
    damage: 300,
    damage_type: DamageTypes.MAGICAL,
    damage_flags: DamageFlag.NO_SPELL_LIFESTEAL,
    ability: hero.GetAbilityByIndex(0),
  });
  const afterFlagged = hero.GetHealth();
  out(
    `lifesteal hp before=${before} after attack=${afterAttack} after spell=${afterSpell} after flagged=${afterFlagged}`,
  );
  verdict(afterAttack > before, 'attack lifesteal heals');
  verdict(afterSpell > afterAttack, 'spell lifesteal heals');
  verdict(afterFlagged === afterSpell, 'no-spell-lifesteal damage does not heal');
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

function spellHeal(hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero): number {
  target.SetHealth(target.GetMaxHealth());
  hero.SetHealth(hero.GetMaxHealth() / 2);
  const before = hero.GetHealth();
  ApplyDamage({
    victim: target,
    attacker: hero,
    damage: 300,
    damage_type: DamageTypes.MAGICAL,
    ability: hero.GetAbilityByIndex(0),
  });
  return hero.GetHealth() - before;
}

// 普攻触发带概率，连续攻击到出现 debuff 为止
function attackUntilDebuff(
  hero: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC_Hero,
  debuffName: string,
  maxAttacks: number,
): number {
  target.RemoveModifierByName(debuffName);
  for (let attack = 1; attack <= maxAttacks; attack++) {
    target.SetHealth(target.GetMaxHealth());
    hero.PerformAttack(target, true, true, true, true, false, false, true);
    if (target.HasModifier(debuffName)) {
      target.RemoveModifierByName(debuffName);
      return attack;
    }
  }
  return 0;
}

// 法术吸血与普攻触发都经共享监听，卖出后应随之停止、普攻监听随之移除
function checkAttackItem(
  hero: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC_Hero,
  itemName: string,
  debuffName: string,
  done: () => void,
): void {
  // 上一项永恒之盘留下的保护期内英雄造成的伤害为 0
  hero.RemoveModifierByName('modifier_item_aeon_disk_buff');
  const without = spellHeal(hero, target);
  const item = hero.AddItemByName(itemName);
  if (!item) {
    verdict(false, `${itemName} could not be added`);
    done();
    return;
  }
  Timers.CreateTimer(0.2, () => {
    const holding = spellHeal(hero, target);
    const listeners = countListeners(ATTACK_LANDED_LISTENER_MODIFIER);
    const procAt = attackUntilDebuff(hero, target, debuffName, 100);
    hero.RemoveItem(item);
    Timers.CreateTimer(0.2, () => {
      const sold = spellHeal(hero, target);
      const soldProc = attackUntilDebuff(hero, target, debuffName, 30);
      const soldListeners = countListeners(ATTACK_LANDED_LISTENER_MODIFIER);
      out(
        `${itemName} spell heal without=${without} holding=${holding} sold=${sold} proc at attack=${procAt} after sale=${soldProc} listeners holding=${listeners} sold=${soldListeners}`,
      );
      verdict(holding > without, `${itemName} spell lifesteal heals`);
      verdict(sold < holding, `${itemName} spell lifesteal stops after sale`);
      verdict(procAt > 0, `${itemName} attack applies debuff`);
      verdict(soldProc === 0, `${itemName} attack debuff stops after sale`);
      verdict(listeners === 1, `${itemName} uses one attack-landed listener`);
      verdict(soldListeners === 0, `${itemName} attack-landed listener removed after sale`);
      hero.SetHealth(hero.GetMaxHealth());
      done();
    });
  });
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
    const active = hero.AddNewModifier(hero, item, 'modifier_item_dracula_mask_active', {
      duration: 5,
    });
    const activeHeal = physicalHeal(hero, target);
    active.Destroy();
    const afterActive = physicalHeal(hero, target);
    hero.RemoveItem(item);
    Timers.CreateTimer(0.2, () => {
      const sold = physicalHeal(hero, target);
      out(
        `dracula heal without=${without} holding=${holding} active=${activeHeal} afterActive=${afterActive} sold=${sold}`,
      );
      verdict(holding > without, 'dracula mask lifesteal heals');
      verdict(activeHeal > holding, 'dracula mask active lifesteal heals more');
      verdict(afterActive < activeHeal, 'dracula mask active lifesteal stops when it ends');
      verdict(sold < holding, 'dracula mask lifesteal stops after sale');
      hero.SetHealth(hero.GetMaxHealth());
      done();
    });
  });
}

function checkVladmir(
  hero: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC_Hero,
  done: () => void,
): void {
  const without = physicalHeal(hero, target);
  const item = hero.AddItemByName('item_vladmir_2');
  if (!item) {
    verdict(false, 'item_vladmir_2 could not be added');
    done();
    return;
  }
  // 光环 buff 由光环周期性挂上，等它到位
  Timers.CreateTimer(1, () => {
    const holding = physicalHeal(hero, target);
    const auraHolding = hero.HasModifier('modifier_item_vladmir');
    hero.RemoveItem(item);
    Timers.CreateTimer(1.5, () => {
      const sold = physicalHeal(hero, target);
      out(`vladmir heal without=${without} holding=${holding} sold=${sold}`);
      verdict(auraHolding, 'vladmir native aura added while holding');
      verdict(!hero.HasModifier('modifier_item_vladmir'), 'vladmir native aura removed after sale');
      verdict(holding > without, 'vladmir aura lifesteal heals');
      verdict(sold < holding, 'vladmir aura lifesteal stops after sale');
      hero.SetHealth(hero.GetMaxHealth());
      done();
    });
  });
}

function countListeners(modifierName: string = DAMAGE_LISTENER_MODIFIER): number {
  const thinkers = Entities.FindAllByClassname('npc_dota_thinker') as CDOTA_BaseNPC[];
  return thinkers.filter((thinker) => thinker.HasModifier(modifierName)).length;
}

function checkWitheredSpring(
  hero: CDOTA_BaseNPC_Hero,
  attacker: CDOTA_BaseNPC_Hero,
  done: () => void,
): void {
  const first = hero.AddItemByName('item_withered_spring');
  const second = hero.AddItemByName('item_withered_spring');
  if (!first || !second) {
    verdict(false, 'item_withered_spring could not be added');
    done();
    return;
  }
  Timers.CreateTimer(0.2, () => {
    const holding = countListeners(MODIFIER_ADDED_LISTENER_MODIFIER);
    // 新获得的物品带初始冷却，清掉才会触发永恒之盘；伤害要让血量低于阈值而不是恰好等于
    first.EndCooldown();
    second.EndCooldown();
    hero.SetHealth(hero.GetMaxHealth());
    hero.SetMana(0);
    ApplyDamage({
      victim: hero,
      attacker,
      damage: hero.GetMaxHealth() * 0.7,
      damage_type: DamageTypes.PURE,
    });
    Timers.CreateTimer(0.2, () => {
      const triggered = hero.HasModifier('modifier_item_aeon_disk_buff');
      const replenished = hero.HasModifier('modifier_item_withered_spring_active');
      const mana = hero.GetMana();
      hero.RemoveItem(first);
      hero.RemoveItem(second);
      Timers.CreateTimer(0.2, () => {
        const sold = countListeners(MODIFIER_ADDED_LISTENER_MODIFIER);
        out(
          `withered aeon=${triggered} active=${replenished} mana=${mana} listeners holding=${holding} sold=${sold}`,
        );
        verdict(holding === 1, 'withered spring uses one modifier-added listener');
        verdict(triggered, 'aeon disk buff triggered');
        verdict(replenished && mana > 0, 'withered spring replenishes on aeon disk');
        verdict(sold === 0, 'modifier-added listener removed after sale');
        hero.RemoveModifierByName('modifier_item_withered_spring_active');
        hero.SetHealth(hero.GetMaxHealth());
        done();
      });
    });
  });
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
  done: () => void,
): void {
  // 目标血量放大到不会被连续命中打死
  target.SetBaseMaxHealth(1000000);
  target.SetMaxHealth(1000000);

  const itemA = a.AddItemByName('item_magic_crit_blade');
  const itemB = b.AddItemByName('item_magic_crit_blade');
  if (!itemA || !itemB) {
    verdict(false, 'crit blade could not be added to both holders');
    done();
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
              done();
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
        checkDraculaMask(player, enemy, () =>
          checkVladmir(player, enemy, () =>
            checkCritBlade(player, ally, enemy, () =>
              checkWitheredSpring(player, enemy, () =>
                checkAttackItem(
                  player,
                  enemy,
                  'item_heavens_halberd_v2',
                  'modifier_heavens_halberd_debuff',
                  () =>
                    checkAttackItem(
                      player,
                      enemy,
                      'item_six_paths_reincarnation_gun',
                      'modifier_item_six_paths_reincarnation_gun_debuff',
                      () => out('done'),
                    ),
                ),
              ),
            ),
          ),
        ),
      );
    });
  });
}
