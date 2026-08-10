// 7.41e 引擎 bug：商店会多渲染一层默认物品格子，覆盖显示为原版物品/贴图缺失
function FindHudElement(id) {
  let panel = $.GetContextPanel();
  while (panel.GetParent() != null) {
    panel = panel.GetParent();
  }
  return panel.FindChildTraverse(id);
}

function TryFixShopGrid() {
  const pShop = FindHudElement('GridBasicItems');
  const pShop2 = FindHudElement('GridUpgradeItems');
  if (!pShop || !pShop2) {
    $.Schedule(0.5, TryFixShopGrid);
    return;
  }
  pShop.RemoveAndDeleteChildren();
  pShop2.RemoveAndDeleteChildren();
}

(function () {
  TryFixShopGrid();
})();
