# 地图文件

官方更新地形后的完整流程（覆盖官方 vmap、脚本重做手改、编译、合并不朽庭院特效、小地图、验证）见 `.claude/skills/dota-map-update/SKILL.md`。

## 目录

- `dota.vmap`：与官方一致，不手改。hard / custom 两张图编译时复制成同名 vmap
- `prefabs/dota_pvp_prefab.vmap`：官方版加两处手改，由脚本生成，不要用 Hammer 手改
  - 6 个营地改成远古
  - 天辉、夜魇两个泉水的 `trigger_shop` 放大，两块互不重叠、拼起来覆盖全图（天辉那块右上角是斜角），z 轴须覆盖高地与河道落差，只拉 xy 会导致英雄上高地后脱离触发器
- `prefabs/shop_keeper_*.vmap`：我方手改（各删了 1 个秘密商店），官方不更新，保持不动

## 说明

- 编译用 `resourcecompiler.exe`，不必打开 Hammer
- 不朽庭院特效只有 dota 图有，hard / custom 做不到，原因见 skill
