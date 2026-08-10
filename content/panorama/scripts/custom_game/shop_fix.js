// 7.41e 引擎 bug：商店会多渲染一层默认物品格子，覆盖显示为原版物品/贴图缺失
// https://github.com/ValveSoftware/Dota2-Gameplay/issues/34007
(function () {
  const pShop = FindDotaHudElement('GridBasicItems');
  if (pShop) pShop.RemoveAndDeleteChildren();

  const pShop2 = FindDotaHudElement('GridUpgradeItems');
  if (pShop2) pShop2.RemoveAndDeleteChildren();
})();
