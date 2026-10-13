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

- **布尔值以 0/1 传输**，用辅助函数转换
- **新建 Net Table 要双注册**：`src/common/net_tables.d.ts` 的类型只是 TS 契约，引擎还要在 `game/scripts/custom_net_tables.txt` 注册表名，否则 `SetTableValue` 报 `Unknown custom nettable`、客户端收不到。改完重启 Dota Tools（`script_reload` 不重读 KV）
- **清行传空 table**（数组 `[]`、对象 `{}`）：`SetTableValue(table, key, nil)` 是 noop，不会同步给客户端。客户端用 `Object.values(value).length === 0` 判空
- **要单测的 Panorama 纯逻辑放在不引用 `$` 的模块里**：jest 用 `src/vscripts/tsconfig.json`，没有 panorama 类型，待测模块 import 了顶层引用 `$` 的文件（如用 `$.Localize` 初始化标签表的 `constants.ts`）就报 `Cannot find name '$'`。需要的常量挪到同目录不引用 `$` 的模块，不给 jest 加全局 stub
