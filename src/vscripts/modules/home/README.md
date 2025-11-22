# Home Module

Home 模块是一个空的机能框架，按照 Lottery 模块的架构创建。

## 文件结构

### 后端（VScripts）
- `src/vscripts/modules/home/home.ts` - 主控制器类

### 数据类型（Common）
- `src/common/dto/home-status.d.ts` - Home 状态数据类型
- `src/common/net_tables.d.ts` - 添加了 `home_status` Net Table
- `src/common/events.d.ts` - 预留了 Home 事件定义（已注释）

### 前端（Panorama React）
- `src/panorama/react/hud_home/Home.tsx` - 主 React 组件
- `src/panorama/react/hud_home/script.tsx` - 入口文件
- `content/panorama/layout/custom_game/react/hud_home/layout.xml` - Panorama 布局文件

### 配置文件
- `src/vscripts/modules/index.ts` - 已注册 Home 模块到 GameRules
- `src/panorama/webpack.dev.js` - 已添加 hud_home 入口
- `content/panorama/layout/custom_game/custom_ui_manifest.xml` - 已添加 Home UI

## 使用方法

### 1. 在 VScripts 中访问 Home 模块

```typescript
// 通过 GameRules 单例访问
GameRules.Home.initHome(playerId);
```

### 2. 添加自定义事件

**Step 1**: 在 `src/common/events.d.ts` 中定义事件：
```typescript
interface CustomGameEventDeclarations {
  // ... 其他事件
  home_your_event: HomeYourEventData;
}

interface HomeYourEventData {
  yourField: string;
}
```

**Step 2**: 在 `src/vscripts/modules/home/home.ts` 中监听事件：
```typescript
CustomGameEventManager.RegisterListener('home_your_event', (userId, event) => {
  this.handleYourEvent(userId, event);
});
```

**Step 3**: 在前端发送事件：
```typescript
GameEvents.SendCustomGameEventToServer('home_your_event', {
  yourField: 'value',
});
```

### 3. 扩展 HomeStatusDto

在 `src/common/dto/home-status.d.ts` 中添加字段：
```typescript
export interface HomeStatusDto {
  initialized: boolean;
  yourNewField?: string;  // 添加新字段
}
```

### 4. 更新 Net Table

在 `src/vscripts/modules/home/home.ts` 中：
```typescript
CustomNetTables.SetTableValue('home_status', steamAccountID, {
  initialized: true,
  yourNewField: 'value',
});
```

在前端订阅数据变化：
```typescript
// 已在 Home.tsx 中实现
useEffect(() => {
  const listenerId = CustomNetTables.SubscribeNetTableListener(
    'home_status',
    (_tableName, key, value) => {
      if (key === steamAccountId) {
        setHomeStatus(value as HomeStatusDto);
      }
    },
  );
  return () => CustomNetTables.UnsubscribeNetTableListener(listenerId);
}, [steamAccountId]);
```

## 数据流

```
游戏开始 (PRE_GAME)
    ↓
[VScripts] Home.initHomeAll()
    ↓
为每个玩家初始化 Home
    ↓
写入 Net Table: home_status
    ↓
[UI] Home.tsx 订阅 home_status
    ↓
渲染 UI
    ↓
玩家操作
    ↓
[UI] 发送 Custom Event
    ↓
[VScripts] 处理事件
    ↓
更新 home_status Net Table
    ↓
[UI] 自动刷新显示
```

## 开发建议

1. **添加新功能前**，先在 `home-status.d.ts` 中定义数据结构
2. **事件命名规范**：使用 `home_` 前缀（例如 `home_button_click`）
3. **Net Table 更新**：使用 `CustomNetTables.SetTableValue('home_status', steamAccountID, data)`
4. **前端组件**：在 `src/panorama/react/hud_home/components/` 目录下创建子组件
5. **样式文件**：可以创建 `src/panorama/react/hud_home/styles.css` 添加自定义样式

## 构建和运行

```bash
# 构建所有代码
npm run build

# 开发模式（自动构建 + 启动 Dota 2）
npm run start

# 仅构建 Panorama UI
npm run build:panorama

# 仅构建 VScripts
npm run build:vscripts
```

## 下一步

这是一个空的框架，你可以：

1. 添加具体的业务逻辑到 `home.ts`
2. 创建更多的 React 组件
3. 定义自定义事件和数据结构
4. 添加样式和动画效果

参考 Lottery 模块的实现方式来扩展 Home 模块的功能。
