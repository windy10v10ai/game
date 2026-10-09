---
name: add-image
description: >-
  给游戏加自定义图标或 UI 图片：png 放哪、要不要 content 副本、要不要登记 xml。
  触发：用户说「加个图标」「加张图」「图标显示成紫块」，或新建技能/物品需要自定义图标时。
---

# 加图片

## 第一步：判断要不要放 png

`AbilityTextureName` 引用的若是 **Dota2 已有的原版 texture**（原版技能名 / 物品名），直接写名字引用即可，**不放任何 png、不登记 xml**，到此结束。

只有**自制或从 Dota2 资源解包提取**的图标才继续往下走。

## 第二步：按类型选流程

三类图片的存放规则不同，**不要互相照抄**。

### A. 技能图标（技能 `ability_xxx` 的 `AbilityTextureName`）

放 `game/resource/flash3/images/spellicons/<name>.png`，KV 中用文件名引用：

```
"AbilityTextureName"    "axe_auto_culling_blade"
```

引擎自动在 `spellicons/` 下查同名 `.png`，**不需要**登记 xml，也**不需要** content 副本。

### B. 物品图标（物品 `item_xxx` 的 `AbilityTextureName`）

图标名 = 物品名去掉 `item_` 前缀。三步缺一不可，**少任一步都是紫块**：

1. `game/resource/flash3/images/items/<name>.png`
2. 同一张 png 复制到 `content/panorama/images/items/<name>.png`
3. 在 `content/panorama/layout/custom_game/images_items.xml` 加一行，`id` 与文件名一致：

```xml
<Image id="awaken_stone" class="SeqImg" src="file://{images}/items/awaken_stone.png" />
```

登记表与 png 不同目录，是因为引擎只允许从 `layout/custom_game/` 加载 layout。

### C. Panorama UI 图片

放 `content/panorama/images/custom_game/<module>/`，按功能模块分二级目录（`lottery/`、`profile/`、`battlepass/` 等）：

1. 文件命名小写下划线，前缀按类型（`icon_` `bg_` `frame_` `decor_`）
2. 在 `content/panorama/layout/custom_game/images.xml` 隐藏 Panel 内加一行 `<Image>` 声明（id 在该文件内唯一），用于触发 `.vtex_c` 编译
3. **不再**为每张图创建单独的 `<name>.xml` 编译壳

在 React 或 less 中用 `file://{images}/custom_game/<module>/<file>.png` 引用。

## 第三步：校验

```bash
npm run lint:images
```

校验物品图标三处一致（已并入 `npm run lint`）。

## 排查紫块

按顺序查：png 是否在对应目录 → 物品图标是否漏了 content 副本或 xml 登记 → 文件名与 KV 中引用是否完全一致 → 是否还没用 Dota tools 编译过。

若整个技能与 modifier 的图标**集体**消失，先怀疑 TS 模块加载失败（见 `src/vscripts/CLAUDE.md`「引擎枚举不要在模块顶层求值」），不是图标资源问题。

## 发布前提醒

编译产物 `game/panorama/images/items/*.vtex_c` 已 gitignore，由 Dota tools 本地生成。**换机器 clone 后必须先用 Dota tools 完整编译一次才能发布**，否则 workshop 包会缺图标 —— `custom_game/` 下 lottery、profile、member 等目录同理。
