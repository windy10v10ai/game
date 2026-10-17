/** 实机核对：原版吸血 / 法术吸血 modifier 的真实名字，装在物品栏和由隐藏物品直接挂上时是否回血、多份是否叠加。 */

const TAG = '[native-check]';
// 原版回血可能在伤害结算后的下一帧才落到血量上
const READ_DELAY = 0.2;

function out(line: string): void {
  print(`${TAG} ${line}`);
}

type Hit = (hero: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero) => void;

const attackHit: Hit = (hero, target) =>
  hero.PerformAttack(target, true, true, true, true, false, false, true);

const spellHit: Hit = (hero, target) => {
  ApplyDamage({
    victim: target,
    attacker: hero,
    damage: 300,
    damage_type: DamageTypes.MAGICAL,
    ability: hero.GetAbilityByIndex(0),
  });
};

function measure(
  hero: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC_Hero,
  hit: Hit,
  done: (heal: number) => void,
): void {
  target.SetHealth(target.GetMaxHealth());
  hero.SetHealth(hero.GetMaxHealth() / 2);
  const before = hero.GetHealth();
  hit(hero, target);
  Timers.CreateTimer(READ_DELAY, () => {
    done(hero.GetHealth() - before);
    return undefined;
  });
}

function listModifiers(hero: CDOTA_BaseNPC_Hero, label: string): void {
  const names = hero
    .FindAllModifiers()
    .map((modifier) => modifier.GetName())
    .filter(
      (name) => name.includes('lifesteal') || name.includes('voodoo') || name.includes('mask'),
    );
  out(`${label} modifiers=[${names.join(',')}]`);
}

/** 依次量 无 / 一份 / 两份 时的回血，add 返回撤销函数 */
function stackCase(
  hero: CDOTA_BaseNPC_Hero,
  target: CDOTA_BaseNPC_Hero,
  label: string,
  hit: Hit,
  add: () => () => void,
  done: () => void,
): void {
  measure(hero, target, hit, (none) => {
    const undoFirst = add();
    listModifiers(hero, `${label} one`);
    measure(hero, target, hit, (one) => {
      const undoSecond = add();
      measure(hero, target, hit, (two) => {
        out(`${label} heal none=${none} one=${one} two=${two}`);
        out(`${one > none ? 'PASS' : 'FAIL'} ${label} heals`);
        // 第二份的增量接近第一份才算叠加，而不是只取最大值
        out(`${two - one > (one - none) * 0.6 ? 'PASS' : 'FAIL'} ${label} stacks`);
        undoSecond();
        undoFirst();
        done();
      });
    });
  });
}

function inventoryItem(hero: CDOTA_BaseNPC_Hero, itemName: string): () => () => void {
  return () => {
    const item = hero.AddItemByName(itemName);
    return () => {
      if (item && IsValidEntity(item)) hero.RemoveItem(item);
    };
  };
}

function hiddenSource(
  hero: CDOTA_BaseNPC_Hero,
  itemName: string,
  modifierName: string,
): () => () => void {
  return () => {
    const item = CreateItem(itemName, hero.GetPlayerOwner(), hero);
    const modifier = item ? hero.AddNewModifier(hero, item, modifierName, {}) : undefined;
    return () => {
      if (modifier && !modifier.IsNull()) modifier.Destroy();
      if (item && IsValidEntity(item)) UTIL_Remove(item);
    };
  };
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
  const cases: [string, Hit, () => () => void][] = [
    ['inventory item_lifesteal', attackHit, inventoryItem(player, 'item_lifesteal')],
    ['inventory item_voodoo_mask', spellHit, inventoryItem(player, 'item_voodoo_mask')],
    [
      'hidden modifier_item_lifesteal',
      attackHit,
      hiddenSource(player, 'item_lifesteal', 'modifier_item_lifesteal'),
    ],
    [
      'hidden modifier_item_voodoo_mask',
      spellHit,
      hiddenSource(player, 'item_voodoo_mask', 'modifier_item_voodoo_mask'),
    ],
  ];
  const next = (index: number) => {
    const entry = cases[index];
    if (!entry) {
      player.SetHealth(player.GetMaxHealth());
      out('done');
      return;
    }
    stackCase(player, target, entry[0], entry[1], entry[2], () => next(index + 1));
  };
  next(0);
}
