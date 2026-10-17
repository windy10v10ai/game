# src/panorama/ UI（React 16.14 + TypeScript → JavaScript）

Webpack 构建，输出到 `content/panorama/scripts/custom_game/`，函数式组件 + hooks。跨层契约见 `src/CLAUDE.md`，hud_main 页面约定见 `react/hud_main/CLAUDE.md`。

## 结构

| 路径                       | 内容                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `react/shared/components/` | 跨 entry 通用组件、对话框骨架（TabNavigation 等）                                                                                               |
| `react/shared/hooks/`      | net table 订阅（`useNetTable`）、客户端事件订阅                                                                                                 |
| `react/shared/styles/`     | 设计 token 与通用 class（`tokens.less`、`.btn-primary`、`.modal-panel`），在 layout.xml 里 `<include src="../shared/styles/index.less" />` 引入 |
| `react/hud_lottery/` 等    | **常驻 HUD 浮窗**：独立 webpack entry + layout.xml，常驻屏幕一角                                                                                |
| `react/hud_main/`          | **中心化界面**：单一 entry，内部切页面                                                                                                          |
| `utils/`                   | 全局 utils，别名 `@utils/*` 指向这里（不是 `react/utils`）                                                                                      |

**跨 entry 唤起 hud_main 页面**：服务端广播 `GameEvents.SendCustomGameEventToAllClients('hud_open_page', { page, playerId })`，hud_main 的 `NavigationProvider` 订阅后按 `playerId === Game.GetLocalPlayerID()` 过滤再切页。事件类型声明在 `src/common/events.d.ts`。

## 写 UI

- Net Table 订阅用 `utils/net-table.ts` 或 `useNetTable`；发服务端事件用 `GameEvents.SendCustomGameEventToServer()`，UI 间通信用 `GameEvents.SendEventClientSide()`
- **新界面先出设计稿，用户确认后再写代码**：以实机截图为底图、用仓库里的真实图标，只替换要改的区域，配色取 `shared/styles/tokens.less`
- 图片引用 `file://{images}/custom_game/<module>/<file>.png`，新增图片走 `add-image` skill
- **HUD 左右翻转用纯 CSS**：玩家开启翻转 HUD 时 Dota 给 HUD 根节点挂 `HUDFlipped`，写 `.HUDFlipped .xxx { horizontal-align: right; }` 即可跟随，中途改设置也自动生效（参考 `content/panorama/layout/custom_game/eyeherodemo/eyeherodemo.css` 的 `.ControlPanel`）
- **外部网页用 `ExternalBrowserGoToURL`**：内置浏览器 `BrowserGoToURL` 已实机否决，网页外链打不开、国内网络下 Steam 授权页也没验证。自建 `DOTAHTMLPanel` 的已知做法：移动手柄子图片 `MousePanningImage` 设 `visibility: collapse` 隐藏；`target=_blank` 外链触发 `HTMLOpenLinkInNewTab`（带完整网址），可转给 `ExternalBrowserGoToURL`。重提前要有外链与国内网络的新证据

## Panorama 陷阱

- **组件始终渲染同一棵 panel 树**，用 `style={{ visibility: cond ? 'visible' : 'collapse' }}` 切显隐。按状态 return 完全不同的 JSX 结构，panel 会在 Panorama DOM 里一直缺失
- **`TextEntry` 的 `placeholder` `multiline` `maxchars` 只在创建时生效**，渲染后改值会抛错、整个 hud_main 崩掉。要随状态变的，换 `key` 让它重建
- **`TextEntry` 用 ref 写初值，不用 `text` 受控**：每次渲染回写会打断输入法组字。代码改 `text` 也会触发 `ontextentrychange`，回调里分清是不是玩家输入
- **画图形用 `<GenericPanel type="UICanvas">`**，脚本只开放 `ClearJS` 与 `DrawSoftLinePointsJS`：填充用逐行 1px 横线铺满，描边逐段画两点线（多点折线一次画会错位），`ClearJS` 只传全透明色（参考 `react/hud_main/pages/profile/tabs/RecentFormRadar.tsx`）
- 构建输出看起来过时时删 `node_modules/.cache`。构建检查 `npm run build:panorama`
