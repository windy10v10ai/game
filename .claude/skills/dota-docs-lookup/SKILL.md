---
name: dota-docs-lookup
description: >-
  Routes Dota 2 custom game documentation: prefer ModDota (community-maintained,
  searchable API indexes) for vscripts, game events, Panorama JS API, and Panorama
  events; fall back to Valve Developer Wiki when ModDota is insufficient (concepts,
  DataDriven KV depth, modifier Actions). Use when implementing or debugging VScripts,
  Panorama, game/panorama events, npc_abilities KV, or verifying bindings; when
  the user asks where to look up Dota modding docs.
---

# Dota 2 文档查阅路由

## 优先级（必须遵守）

1. **优先 [ModDota API](https://moddota.com/api/)**：社区从客户端整理，**分类清晰、可检索**，适合快速核对类名、方法签名、事件名、Panorama API。
2. **ModDota 信息仍不足时**，再查 **Valve Developer Wiki**（概念、流程、个别 KV/Action 细节、官方表述）。

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

## 其他规则

- **TypeScript 类型**：本仓库 `@moddota/dota-lua-types` 与 ModDota/实机不一致时，以 **ModDota + 游戏实测** 为准。
- **Valve Wiki**：部分页面在自动化抓取时可能被拦截；若工具无法读取，在浏览器中打开链接即可。

## 不要做的事

- 不要跳过 ModDota 直接去 Wiki **查 Panorama JS 或游戏事件名**（应先 `panorama/api`、`panorama/events` 或 `events`）。
- 不要用 Panorama 文档去查 **`GameRules` 等服务器 Lua 绑定**（应查 ModDota **vscripts**）。
- 不要为找一个 API **同时翻遍**所有 Wiki 章节；先锁定 ModDota 对应分区，不够再补官方文档。
