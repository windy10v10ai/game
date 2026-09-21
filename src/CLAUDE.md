# src/ 跨层约定

VScripts（服务端，TS→Lua）与 Panorama（客户端，React→JS）之间的契约。只写两层都要遵守的规则，各自专属规则见 `vscripts/CLAUDE.md` 与 `panorama/CLAUDE.md`。

## 共享类型

`src/common/` 中的 TypeScript 接口定义各层之间的契约：

- `net_tables.d.ts` — `CustomNetTableDeclarations`，新增 Net Table 键
- `events.d.ts` — `CustomGameEventDeclarations`，新增自定义事件
- `dto/` — 复杂数据结构的 DTO

## 数据流

**服务器 → 客户端（Net Tables）**:

```typescript
// VScripts (server)
CustomNetTables.SetTableValue("lottery_status", playerId.toString(), data);

// Panorama (client)
CustomNetTables.SubscribeNetTableListener("lottery_status", callback);
const data = CustomNetTables.GetTableValue("lottery_status", playerId);
```

**客户端 → 服务器（Custom Events）**:

```typescript
// Panorama (client)
GameEvents.SendCustomGameEventToServer("lottery_pick_ability", { name, type, level });

// VScripts (server)
CustomGameEventManager.RegisterListener("lottery_pick_ability", (userId, event) => {
  // Handle ability pick
});
```

## 常见陷阱

- **Net Table 类型不匹配**: 布尔值以 0/1 传输，使用辅助转换
- **新建 Net Table 必须双注册**: 在 `src/common/net_tables.d.ts` 的 `CustomNetTableDeclarations` 加类型只是 TS 契约，引擎运行时还要在 `game/scripts/custom_net_tables.txt` 注册表名，否则服务端 `SetTableValue` 会报 `Unknown custom nettable` 且客户端永远收不到。改完后必须**重启 Dota Tools**（script_reload 不重读 KV）
- **Net Table 清行不能传 nil**: `CustomNetTables.SetTableValue(table, key, nil)` 在 Dota 引擎下是 **noop**，不会删除或同步空值给客户端。如需清行，传**空 table**（数组类用 `[]`、对象类用 `{}`），客户端 `Object.values(value).length === 0` 即可识别为空
- **jest 用的是 vscripts 的 tsconfig，测不了引用 `$` 的 panorama 模块**: `package.json` 的 `jest.globals` 指定 `src/vscripts/tsconfig.json`，其中没有 panorama 类型。任何在**模块顶层**引用 `$` 的文件（如各 tab 的 `constants.ts` 用 `$.Localize` 初始化标签表）都不能被待测模块 import，否则报 `Cannot find name '$'`。要写单测的纯逻辑必须放在 `$`-free 的模块里；发现待测模块需要某个常量而它恰好和 `$.Localize` 混在同一文件时，把常量挪到同目录的 `$`-free 模块，而不是给 jest 加全局 stub
