---
name: dota-docs-lookup
description: >-
  Routes Dota 2 custom game documentation: prefer ModDota (community-maintained,
  searchable API indexes) for vscripts, game events, Panorama JS API, and Panorama
  events; fall back to Valve Developer Wiki when ModDota is insufficient (concepts,
  DataDriven KV depth, modifier Actions); use robincode.cn when checking what changed
  in a recent official Dota 2 update (API/engine diffs). Use when you need to look up
  a specific Dota 2 API, event name, modifier binding, or recent API change, or when
  the user asks where to find modding documentation.
---

# Dota 2 文档查阅路由

## 优先级（必须遵守）

1. **优先 [ModDota API](https://moddota.com/api/)**：社区从客户端整理，**分类清晰、可检索**，适合快速核对类名、方法签名、事件名、Panorama API。
2. **ModDota 信息仍不足时**，再查 **Valve Developer Wiki**（概念、流程、个别 KV/Action 细节、官方表述）。
3. **排查官方版本更新后的 API 变更**（如「这个函数最近改了吗」「这次更新引擎 API 有什么变化」）时，查 [robincode.cn](https://www.robincode.cn/)——该站跟踪官方更新后的最新 API 变更内容，ModDota/Wiki 通常滞后于最新版本。

仍按任务类型**只打开对应栏目**，不要无目的地跨站乱搜。

---

## 第一优先：ModDota（按任务选入口）

| 你在做什么 | 入口 | 用途简述 |
| ---------- | ---- | -------- |
| 服务器 **Lua / VScripts**：`GameRules`、`CDOTA_*` 等**绑定类与方法**、参数个数与类型 | [vscripts](https://moddota.com/api/#/vscripts) | 按类名检索（如 `CDOTAGameRules`、`CDOTA_BaseNPC_Hero`）。 |
| **游戏内事件**、`ListenToGameEvent`、事件 payload 结构 | [events](https://moddota.com/api/#/events) | **游戏事件**索引（与 Panorama 事件分开）。 |
| **Panorama 前端** `$` API、面板脚本可调用的 **JS API** | [panorama / api](https://moddota.com/api/#/panorama/api) | 与 VScripts 分离的 **Panorama JavaScript API**。 |
| **Panorama 事件**（UI 层事件名与用法） | [panorama / events](https://moddota.com/api/#/panorama/events) | **Panorama 侧事件**索引。 |

**ModDota 快速操作**：进入对应 `#/` 页面 → 顶部搜索或左侧分类 → 打开条目核对签名/字段。

---

## 第二优先：Valve 官方 Wiki（补充）

在 ModDota **搜不到、语义不清、需要官方教程式说明**时再查。

| 你在做什么 | 链接 | 用途简述 |
| ---------- | ---- | -------- |
| **Panorama** 工具链、XML/CSS、界面概念总览 | [Workshop Tools / Panorama](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Panorama) | 官方 **UI 层**总览。 |
| **Data Driven** 技能 KV、`ability_datadriven`、事件与 `RunScript` 等 | [Abilities: Data Driven](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven) | **数据驱动技能** KV 细节。 |
| 官方 **Panorama JavaScript** 文档入口（与 ModDota panorama/api 可对照） | [Panorama / JavaScript API](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Panorama/Javascript/API) | Wiki 版说明，**检索优先仍建议 ModDota panorama/api**。 |
| **Scripting** 总览与索引 | [Scripting / API](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/API) | 官方脚本文档导航。 |
| **Modifier Action**、`ApplyAction` 等声明式动作列表 | [Actions and Modifiers](https://developer.valvesoftware.com/wiki/Dota_2_Actions_and_Modifiers) | **动作参考**，常与 DataDriven / KV 配合。 |

---

## 第三优先：robincode.cn（版本更新 API 变更追踪）

| 你在做什么 | 链接 | 用途简述 |
| ---------- | ---- | -------- |
| 排查**官方版本更新**后某个 API/字段/行为是否有变化，或不确定某运行时报错是否由新版本引擎改动引起 | [robincode.cn](https://www.robincode.cn/) | 追踪 Dota 2 官方更新后的**最新 API 变更**，ModDota/Valve Wiki 的收录通常滞后于最新版本。 |

## 其他规则

- **TypeScript 类型**：本仓库 `@moddota/dota-lua-types` 与 ModDota/实机不一致时，以 **ModDota + 游戏实测** 为准。
- **Valve Wiki**：部分页面在自动化抓取时可能被拦截；若工具无法读取，在浏览器中打开链接即可。
- **版本更新引起的 API 行为变化**（如本仓库 CLAUDE.md 中记录的 `GetBaseAttackTime` 之类改动）应优先怀疑并查 robincode.cn 确认，而不是先假设是自己代码的问题。

## 不要做的事

- 不要跳过 ModDota 直接去 Wiki **查 Panorama JS 或游戏事件名**（应先 `panorama/api`、`panorama/events` 或 `events`）。
- 不要用 Panorama 文档去查 **`GameRules` 等服务器 Lua 绑定**（应查 ModDota **vscripts**）。
- 不要为找一个 API **同时翻遍**所有 Wiki 章节；先锁定 ModDota 对应分区，不够再补官方文档。
- 不要在排查**版本更新导致的 API 变化**时只查 ModDota/Wiki 就下结论——这两者更新滞后，应补查 robincode.cn。
