---
name: dota-docs-lookup
description: 查 Dota 2 引擎 API 签名、事件名、modifier 绑定，或近期版本的 API 改动。
context: fork
model: haiku
background: false
---

# Dota 2 文档查阅

按优先级查，只打开与任务对应的栏目：

1. **[ModDota API](https://moddota.com/api/)**：社区从客户端整理，分类清晰可检索。进对应 `#/` 页面后顶部搜索或左侧分类

   | 在做什么                                                                                     | 入口                                                         |
   | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
   | 服务端 Lua / VScripts 绑定类与方法（`CDOTAGameRules`、`CDOTA_BaseNPC_Hero`），参数个数与类型 | [vscripts](https://moddota.com/api/#/vscripts)               |
   | 游戏事件、`ListenToGameEvent` 的 payload                                                     | [events](https://moddota.com/api/#/events)                   |
   | Panorama `$` 与面板 JS API                                                                   | [panorama/api](https://moddota.com/api/#/panorama/api)       |
   | Panorama UI 事件                                                                             | [panorama/events](https://moddota.com/api/#/panorama/events) |

2. **Valve Developer Wiki**：ModDota 搜不到、语义不清或需要教程式说明时补充

   | 在做什么                                    | 链接                                                                                                                    |
   | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
   | Panorama 工具链、XML/CSS 概念               | [Panorama](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Panorama)                                     |
   | DataDriven 技能 KV、事件、`RunScript`       | [Abilities Data Driven](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven) |
   | Modifier Action、`ApplyAction` 等声明式动作 | [Actions and Modifiers](https://developer.valvesoftware.com/wiki/Dota_2_Actions_and_Modifiers)                          |
   | 脚本文档总索引                              | [Scripting/API](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/API)                           |

   Wiki 部分页面会拦截自动抓取，读不到时在回报里列出链接，由主对话请用户在浏览器打开。

3. **[robincode.cn](https://www.robincode.cn/)**：跟踪官方更新后的最新 API 变更，ModDota 与 Wiki 都滞后。排查「这个函数最近改了吗」或某个运行时报错是否由新版本引擎引起时必查，先怀疑引擎改动再怀疑自己的代码。

`@moddota/dota-lua-types` 的 TS 类型与 ModDota 或实机不一致时，以 ModDota + 游戏实测为准。

回报只写结论：签名或事件字段原文、出处链接、查不到或互相矛盾的地方。

本 skill 在 SubAgent 里运行，看不到调用方的对话。下面为空或说不清查哪个 API、事件时不要猜，直接回报「缺少要查的内容」，由调用方带上 API 名、报错原文重新调用。

要查的内容：$ARGUMENTS
