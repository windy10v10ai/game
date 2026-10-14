/** 实机核对：原版吸血 / 法术吸血 modifier 能否由隐藏物品挂给英雄生效，以及同名 modifier 多份是否叠加。 */

const TAG = '[native-check]';

function out(line: string): void {
  print(`${TAG} ${line}`);
}

function addSource(hero: CDOTA_BaseNPC_Hero, itemName: string, modifierName: string): CDOTA_Item {
  const item = CreateItem(itemName, hero.GetPlayerOwner(), hero)!;
  hero.AddNewModifier(hero, item, modifierName, {});
  return item;
}

function healFromAttack(hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero): number {
  target.SetHealth(target.GetMaxHealth());
  hero.SetHealth(hero.GetMaxHealth() / 2);
  const before = hero.GetHealth();
  hero.PerformAttack(target, true, true, true, true, false, false, true);
  return hero.GetHealth() - before;
}

function healFromSpell(hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero): number {
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

function checkStacking(
  hero: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC_Hero,
  itemName: string,
  modifierName: string,
  heal: (hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero) => number,
): void {
  const none = heal(hero, target);
  const first = addSource(hero, itemName, modifierName);
  const one = heal(hero, target);
  const second = addSource(hero, itemName, modifierName);
  const two = heal(hero, target);
  const count = hero.FindAllModifiersByName(modifierName).length;
  out(`${modifierName} heal none=${none} one=${one} two=${two} modifiers=${count}`);
  out(`${one > none ? 'PASS' : 'FAIL'} ${modifierName} heals`);
  // 第二份的增量与第一份接近才算叠加，而不是取最大值
  const stacks = two - one > (one - none) * 0.6;
  out(`${stacks ? 'PASS' : 'FAIL'} ${modifierName} stacks`);
  hero.FindAllModifiersByName(modifierName).forEach((modifier) => modifier.Destroy());
  UTIL_Remove(first);
  UTIL_Remove(second);
}

const player = PlayerResource.GetSelectedHeroEntity(0);
const target = player
  ? HeroList.GetAllHeroes().find((hero) => hero.GetTeam() !== player.GetTeam() && hero.IsRealHero())
  : undefined;
if (!player || !target) {
  out('FAIL player or enemy hero missing');
} else {
  target.SetBaseMaxHealth(1000000);
  target.SetMaxHealth(1000000);
  checkStacking(player, target, 'item_lifesteal', 'modifier_item_lifesteal', healFromAttack);
  checkStacking(player, target, 'item_voodoo_mask', 'modifier_item_voodoo_mask', healFromSpell);
  player.SetHealth(player.GetMaxHealth());
  out('done');
}
