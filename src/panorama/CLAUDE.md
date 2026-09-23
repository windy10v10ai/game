# src/panorama/ UI（React 16.14 + TypeScript → JavaScript）

Webpack 构建，输出到 `content/panorama/scripts/custom_game/`。使用函数式组件和 hooks。跨层契约见 `src/CLAUDE.md`。

## 目录结构

```
panorama/
├── react/
│   ├── shared/            # 跨 entry 共享：通用组件 / hooks / 设计 token
│   │   ├── components/      # TabNavigation, SubTabNavigation
│   │   ├── hooks/           # useNetTable
│   │   └── styles/          # tokens.less, buttons.less, dialog.less
│   ├── hud_lottery/       # 常驻 HUD 浮窗：技能抽奖
│   └── hud_main/          # 中心化界面容器（home/shop/achievements 等）
│       ├── HudMain.tsx       # 顶层 Provider 组合
│       ├── router/           # PageRouter + PageId 类型
│       ├── store/            # NavigationContext / DialogContext
│       ├── components/       # 常驻入口按钮等容器级组件
│       └── pages/            # 各页面（home / shop / profile / ...）
│           └── profile/      # 页面 = 文件夹；样式与拥有者同级
│               ├── ProfilePage.tsx
│               ├── styles.less        # 聚合入口（layout.xml 引用此文件）
│               ├── layout.less        # 页面外框 / Tab 导航 / 内容区
│               ├── stats.less         # Stats Tab + 占位样式
│               └── tabs/
│                   ├── StatsTab.tsx   # 单文件 tab 直接放 tabs/
│                   └── member/        # 复杂 tab 拆为子目录，自带 styles.less
├── utils/                 # 全局 utils（@utils/* 别名指向这里）
└── webpack.{dev,prod}.js
```

## 两类 entry 的边界

- **常驻 HUD 浮窗**（`hud_lottery` 等）：独立 webpack entry + layout.xml，常驻屏幕一角，与游戏 HUD 并存。
- **中心化界面**（`hud_main`）：单一 entry，内部用 `PageRouter` 切换 home / shop / achievements 等页面。新增"模态/中心化界面"应作为 hud_main 的页面，**不开新 entry**。

## 跨 entry 通信

```ts
// 任意 entry → 唤起 hud_main 的某个页面
// 通过服务端广播给所有客户端，接收端用 playerId 过滤只响应本地玩家
GameEvents.SendCustomGameEventToAllClients('hud_open_page', { page: 'home', playerId: Game.GetLocalPlayerID() });
```

`hud_main` 的 `NavigationProvider` 通过 `GameEvents.Subscribe('hud_open_page', ...)` 监听，过滤 `playerId === Game.GetLocalPlayerID()` 后切换 currentPage。事件类型在 `src/common/events.d.ts` 的 `CustomGameEventDeclarations` 中声明。

`param` 支持 `'tab:subTab'` 复合格式定位一级 tab 内的子页：页面组件用 `split(':')` 拆解，将 subTab 透传给 tab 组件（如 `ProfilePage` 把 `'member:points'` 拆出后传给 `MemberTab` 的 `initialSubTab`）。

## 通用资源位置

- 通用组件 / 对话框骨架：`react/shared/components/`
- 通用 hooks（net table 订阅、客户端事件订阅）：`react/shared/hooks/`
- 设计 token / 通用 class（`.btn-primary` `.modal-panel` 等）：`react/shared/styles/`，通过 `<include src="../shared/styles/index.less" />` 引入到任意 entry 的 layout.xml
- 路径别名 `@utils/*` 指向 `src/panorama/utils/`（**不是** `react/utils`）

## hud_main 页面拆分约定

避免单文件膨胀：

- 每个页面是 `pages/<name>/` 一个文件夹，至少包含 `<Name>Page.tsx` 和 `styles.less`（聚合入口）
- 简单 tab：`tabs/<TabName>.tsx` 单文件，样式归并到页面级 less 中（如 `react/hud_main/pages/profile/stats.less`）
- 复杂 tab（>200 行 / 含多个子页 / 多个内部组件）：拆为 `tabs/<tabName>/` 子目录，按职责分文件（顶层 `Tab.tsx` + 各 `*Page.tsx` + 共享 `*.tsx` + `constants.ts` + 自带 `styles.less`），通过 `index.ts` 重新导出
- **样式与拥有者同级**：页面级样式（外框/导航/单文件 tab）直接放页面根目录；复杂 tab 的样式跟随其子目录。页面根 `styles.less` 仅用 `@import` 聚合，layout.xml 仍只引用此一个文件
- 仅当前 tab 用到的子组件留在该 tab 文件夹内（不下沉到 `shared/`）；跨 tab 复用才考虑提到 `shared/`

## 修改 UI 时

1. 使用 `utils/net-table.ts` 或 `react/shared/hooks/useNetTable` 处理 Net Table 订阅
2. 通过 `GameEvents.SendCustomGameEventToServer()` 发送服务端事件；UI 间通信用 `GameEvents.SendEventClientSide()`
3. **HUD 左右自适应用纯 CSS**：玩家开启翻转 HUD（小地图从左换到右）时，Dota 会在 HUD 根节点挂 `HUDFlipped` class。自定义 layout 都挂在 `Hud` 之下，用后代选择器 `.HUDFlipped .xxx { horizontal-align: right; }` 即可跟随，不需要 JS，也不用监听 `hud_flip_changed`，玩家中途改设置自动生效。参考 `content/panorama/layout/custom_game/eyeherodemo/eyeherodemo.css` 的 `.ControlPanel`
4. 引用图片用 `file://{images}/custom_game/<module>/<file>.png`；新增图片走 `add-image` skill（漏登记 xml 会变紫块）

## 常见陷阱

- **Webpack 缓存**: 如果构建输出看起来过时，删除 `node_modules/.cache`
- **React Panorama 条件返回不同 panel 结构会渲染失败**: 在 React 组件中根据状态返回**完全不同的 JSX 结构**（例如 `if (empty) return <Panel collapse />; return <Panel>...复杂子树...</Panel>;`）会导致 panel 在 Panorama DOM 中始终缺失。改为**始终渲染同一 panel 树**，用 `style={{ visibility: cond ? 'visible' : 'collapse' }}` 切换显隐
- **`@keyframes` 不能写在 `@import` 进来的页面/组件 less 里（如 `hud_main/pages/*/*.less`）**: webpack `additionalData` 会给 keyframe 名加 Valve 必需的引号（`@keyframes 'Name'`），但**只作用于 layout.xml 直接引用的那个 styles.less**；`@import` 进来的子 less 内容由 less 编译器后续合并，拿不到这层转换，keyframe 名未加引号被 Valve 拒绝，**导致整张 styles.css 解析失败、该页所有样式丢失**（图标变紫块等）。hud_lottery 的 keyframe 能用是因为它写在 entry 直载的 `styles.less` 里。**结论：hud_main 页面的动画一律用 JS 驱动**（如 `$.Schedule` 定时改 prop），不要在页面 less 写 `@keyframes`。另注：`transform`/`scale3d` 等属性 Panorama 本就不支持，更不能用

## 构建

Webpack 配合自定义插件，加载器 ts-loader / babel-loader / less-loader，`PanoramaTargetPlugin` 转换为 Valve 格式，启用 tree-shaking 和文件系统缓存。构建检查 `npm run build:panorama`。
