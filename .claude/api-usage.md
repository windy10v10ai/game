# API 调用文档

本文档记录 Windy10v10AI 项目中的 API 调用模式、最佳实践和学习要点。

## 目录

- [API 架构概览](#api-架构概览)
- [核心组件](#核心组件)
- [API 调用模式](#api-调用模式)

---

## API 架构概览

### 目录结构

```
src/vscripts/api/
├── api-client.ts           # 核心 API 客户端实现
├── analytics/              # 分析相关 API
│   ├── analytics.ts        # Analytics 主类
│   └── dto/                # Analytics 数据传输对象
│       ├── pick-ability-dto.ts
│       └── player-language-dto.ts
└── ...
```

### 通信流程

```
VScripts (Server) → ApiClient → HTTP Request → Backend API (localhost:3001 / windy10v10ai.com)
                  ↓
            sendWithRetry()
                  ↓
          successFunc / errorFunc
```

### 认证机制

后端 API 使用 **API Key** 认证方式：

- **Header 名称**: `x-api-key`
- **测试 API Key**: `apikey`
- **安全方案**: API Key (在 header 中)

**需要认证的端点**:

- 所有 Analytics API (`/api/analytics/*`)
- 游戏相关 API (`/api/game/start`, `/api/game/end`)

**示例**:

```typescript
// ApiClient 会自动添加 x-api-key header
// 具体实现见 api-client.ts
```

---

## 核心组件

### ApiClient

位置: `src/vscripts/api/api-client.ts`

**主要职责**:

- 发送 HTTP 请求到后端 API
- 支持重试机制
- 处理成功/失败回调

**核心方法**:

```typescript
ApiClient.sendWithRetry(apiParameter: ApiParameter): void
```

**参数结构 (ApiParameter)**:

```typescript
interface ApiParameter {
  method: HttpMethod; // GET, POST, PUT, DELETE
  path: string; // API 端点路径
  body?: any; // 请求体 (对象会被序列化为 JSON)
  successFunc?: () => void; // 成功回调
  errorFunc?: () => void; // 错误回调
}
```

### 现有 API 端点

- 从本地 API 服务器 (http://localhost:3001/api-docs-json) 获取完整 OpenAPI 3.0 文档

---

## API 调用模式

### 模式 1: 静态方法调用

**适用场景**: 发送一次性数据、游戏事件统计

**示例**: 发送游戏结束时的技能选择数据

```typescript
// 位置: src/vscripts/api/analytics/analytics.ts:35-46

public static async SendGameEndPickAbilityEvent(pickDto: PickDto) {
  const apiParameter: ApiParameter = {
    method: HttpMethod.POST,
    path: this.POST_GAME_END_PICK_ABILITY_URL,  // '/analytics/game-end/pick/ability'
    body: pickDto,
    successFunc: () => {
      print(`[Analytic] SendGameEndPickAbilityEvent success`);
    },
  };

  ApiClient.sendWithRetry(apiParameter);
}
```

**关键要点**:

- 使用 `static` 方法便于在任何地方调用
- 端点路径定义为常量 (`POST_GAME_END_PICK_ABILITY_URL`)
- 使用 `successFunc` 回调记录成功日志
- `sendWithRetry` 自动处理重试逻辑

---

### 模式 2: 事件监听 + 数据收集 + 延迟发送

**适用场景**: 收集多个玩家数据，在特定时机统一发送

**示例**: 收集并发送玩家语言信息

**步骤 1: 在构造函数中注册事件监听器**

```typescript
// 位置: src/vscripts/api/analytics/analytics.ts:20-22

CustomGameEventManager.RegisterListener("player_language", (userId, event) => {
  Analytics.ListenToPlayerLanguageEvent(userId, event);
});
```

**步骤 2: 收集数据到静态变量**

```typescript
// 位置: src/vscripts/api/analytics/analytics.ts:51-64

private static PLAYER_LANGUAGES: PlayerLanguageListDto = {
  players: [],
  matchId: '',
  version: '',
};

public static ListenToPlayerLanguageEvent(
  _userId: number,
  event: PlayerLanguageEventData & CustomGameEventDataBase,
) {
  const playerId = event.PlayerID;
  const language = event.language;
  const steamId = PlayerResource.GetSteamAccountID(playerId);

  print(`[Analytic] ListenToPlayerLanguageEvent playerId ${playerId} language ${language}`);
  this.PLAYER_LANGUAGES.players.push({
    steamId,
    language,
  });
}
```

**步骤 3: 在特定游戏状态发送数据**

```typescript
// 位置: src/vscripts/api/analytics/analytics.ts:24-32

ListenToGameEvent(
  "game_rules_state_change",
  () => {
    if (GameRules.State_Get() === GameState.GAME_IN_PROGRESS) {
      Analytics.SendUserLanguageStatistics();
    }
  },
  this,
);
```

**步骤 4: 发送收集的数据**

```typescript
// 位置: src/vscripts/api/analytics/analytics.ts:69-84

public static async SendUserLanguageStatistics() {
  Analytics.PLAYER_LANGUAGES.matchId = GameRules.Script_GetMatchID().toString();
  Analytics.PLAYER_LANGUAGES.version = GameConfig.GAME_VERSION;

  const apiParameter: ApiParameter = {
    method: HttpMethod.POST,
    path: this.POST_PLAYER_LANGUAGE_URL,  // '/analytics/player/language'
    body: Analytics.PLAYER_LANGUAGES,
    successFunc: () => {
      print(
        `[Analytic] SendUserLanguageStatistics success for ${Analytics.PLAYER_LANGUAGES.players.length} players`,
      );
    },
  };

  ApiClient.sendWithRetry(apiParameter);
}
```

**关键要点**:

- 使用静态变量 (`PLAYER_LANGUAGES`) 在多次事件中累积数据
- 监听游戏事件 (`player_language`) 收集数据
- 监听游戏状态变化 (`game_rules_state_change`) 确定发送时机
- 发送前填充 `matchId` 和 `version` 等元数据
- 日志中包含具体信息（如玩家数量）便于调试
