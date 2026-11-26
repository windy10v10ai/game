function FindDotaHudElement(id) {
  return GetDotaHud().FindChildTraverse(id);
}

function GetDotaHud() {
  var panel = $.GetContextPanel();
  while (panel && panel.id !== 'Hud') {
    panel = panel.GetParent();
  }
  return panel;
}

// 7.41e 引擎 bug：商店会多渲染一层默认物品格子，覆盖显示为原版物品/贴图缺失
(function () {
  const pShop = FindDotaHudElement('GridBasicItems');
  if (pShop) pShop.RemoveAndDeleteChildren();

  const pShop2 = FindDotaHudElement('GridUpgradeItems');
  if (pShop2) pShop2.RemoveAndDeleteChildren();
})();

(function () {
  var context = $.GetContextPanel();
  var instance = (context.treasuredShopInstance || 0) + 1;
  context.treasuredShopInstance = instance;

  function plan(itemId, inventory, ancestors) {
    var item = CustomNetTables.GetTableValue('treasured_shop', String(itemId));
    if (!item) return null;
    if (inventory[item.name] > 0) {
      var remaining = Object.assign({}, inventory);
      remaining[item.name]--;
      return { inventory: remaining, missing: [], cost: 0, usesTreasure: item.treasured === 1 };
    }
    if (item.treasured === 1 || ancestors.indexOf(itemId) !== -1) return null;
    if (!item.recipes) {
      return { inventory: inventory, missing: [itemId], cost: item.cost, usesTreasure: false };
    }
    var best = null;
    Object.values(item.recipes).forEach(function (row) {
      var remaining = inventory;
      var missing = [];
      var cost = 0;
      var usesTreasure = false;
      var available = true;
      Object.values(row).forEach(function (componentId) {
        if (!available) return;
        var component = plan(componentId, remaining, ancestors.concat([itemId]));
        if (!component) {
          available = false;
        } else {
          remaining = component.inventory;
          missing = missing.concat(component.missing);
          cost += component.cost;
          usesTreasure = usesTreasure || component.usesTreasure;
        }
      });
      if (available && (!best || cost < best.cost || (cost === best.cost && !usesTreasure))) {
        best = { inventory: remaining, missing: missing, cost: cost, usesTreasure: usesTreasure };
      }
    });
    return best;
  }

  function purchase(shop, itemId) {
    if (GameUI.IsAltDown() || GameUI.IsControlDown() || GameUI.IsShiftDown()) return false;
    var data = CustomNetTables.GetTableValue('treasured_shop', String(itemId));
    if (!data || !data.recipes) return false;
    var playerId = Game.GetLocalPlayerID();
    var hero = Players.GetPlayerHeroEntityIndex(playerId);
    var unit = Players.GetLocalPlayerPortraitUnit();
    if (unit !== hero || !Entities.IsControllableByPlayer(unit, playerId)) return false;
    var inventory = {};
    for (var slot = 0; slot < 15; slot++) {
      var item = Entities.GetItemInSlot(hero, slot);
      if (item === -1) continue;
      var purchaser = Items.GetPurchaser(item);
      if (purchaser !== -1 && purchaser !== hero) continue;
      var name = Abilities.GetAbilityName(item);
      inventory[name] = (inventory[name] || 0) + 1;
    }
    // The clicked product starts a new purchase even when another copy is already owned.
    inventory[data.name] = 0;
    var recipe = plan(itemId, inventory, []);
    if (!recipe || !recipe.usesTreasure) return false;
    recipe.missing.forEach(function (componentId) {
      $.DispatchEvent('DOTAShopPurchaseItem', shop, componentId);
    });
    return true;
  }

  function register() {
    if (!context.IsValid() || context.treasuredShopInstance !== instance) return;
    var hud = GetDotaHud();
    var shop = hud && hud.FindChildTraverse('shop');
    if (!shop) {
      $.Schedule(0.2, register);
      return;
    }
    // Native panel handlers survive script reloads, so keep one forwarding callback.
    shop.treasuredPurchase = function (itemId) {
      return purchase(shop, itemId);
    };
    if (shop.treasuredPurchaseRegistered) return;
    shop.treasuredPurchaseRegistered = true;
    $.RegisterEventHandler('DOTAShopPurchaseItem', shop, function (itemId) {
      return shop.treasuredPurchase(itemId);
    });
    $.RegisterEventHandler('DOTAShopItemRightMouseDown', shop, function (itemPanel, itemId) {
      return shop.treasuredPurchase(itemId);
    });
  }
  register();
})();
