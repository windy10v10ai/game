/** Supplies the shop with the alternative recipes for chest-only components. */
import { TreasuredShopComponent } from '../../../common/net_tables';

export const TREASURED_RECIPE_COMPONENTS = new Set([
  'item_berserkers_sabatons_copy',
  'item_bfury_copy',
  'item_blade_mail_copy',
  'item_echo_sabre_2_copy',
  'item_hand_of_midas_copy',
  'item_heart_copy',
  'item_hydras_breath_copy',
  'item_radiance_copy',
  'item_starforge_copy',
  'item_ultimate_scepter_copy',
]);

interface ItemDefinition {
  ID?: string;
  ItemResult?: string;
  ItemRequirements?: Record<string, string>;
}

export function publishTreasuredShopRecipes(): void {
  const recipes: Record<string, string[][]> = {};
  const files = ['scripts/npc/npc_items_custom.txt', 'scripts/npc/npc_items_override.txt'];
  for (const file of files) {
    const items = LoadKeyValues(file) as Record<string, ItemDefinition>;
    for (const [recipeName, definition] of Object.entries(items)) {
      if (!definition.ItemRequirements) continue;
      const recipe = GetAbilityKeyValuesByName(recipeName) as ItemDefinition;
      const resultName = recipe.ItemResult!;
      if (recipeName !== resultName.replace('item_', 'item_recipe_')) continue;
      recipes[resultName] = Object.values(recipe.ItemRequirements!).map((requirement) => {
        const row = requirement
          .split(';')
          .filter((name) => name !== '')
          .map((name) => name.replace('*', ''));
        if (GetItemCost(recipeName) > 0) row.push(recipeName);
        return row;
      });
    }
  }
  const affected = new Set(TREASURED_RECIPE_COMPONENTS);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, rows] of Object.entries(recipes)) {
      if (!affected.has(name) && rows.some((row) => row.some((part) => affected.has(part)))) {
        affected.add(name);
        changed = true;
      }
    }
  }

  const items: Record<string, TreasuredShopComponent> = {};
  function publishItem(name: string): number {
    if (items[name]) return items[name].id;
    const definition = GetAbilityKeyValuesByName(name) as ItemDefinition;
    const item: TreasuredShopComponent = {
      name,
      id: Number(definition.ID),
      cost: GetItemCost(name),
      treasured: TREASURED_RECIPE_COMPONENTS.has(name) ? 1 : 0,
    };
    items[name] = item;
    if (item.treasured === 0 && !name.startsWith('item_recipe_')) {
      let rows = recipes[name];
      if (rows === undefined) {
        const recipeName = name.replace('item_', 'item_recipe_');
        const recipe = GetAbilityKeyValuesByName(recipeName) as ItemDefinition | undefined;
        if (recipe?.ItemRequirements) {
          rows = Object.values(recipe.ItemRequirements).map((requirement) => {
            const row = requirement
              .split(';')
              .filter((part) => part !== '')
              .map((part) => part.replace('*', ''));
            if (GetItemCost(recipeName) > 0) row.push(recipeName);
            return row;
          });
        }
      }
      if (rows !== undefined)
        item.recipes = rows.map((row) => row.map((part) => publishItem(part)));
    }
    CustomNetTables.SetTableValue('treasured_shop', item.id.toString(), item);
    return item.id;
  }
  for (const name of affected) publishItem(name);
}
