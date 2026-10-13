# hud_main 中心化界面

单一 entry，`router/` 的 `PageRouter` 切换 home / shop / achievements 等页面。新的模态或中心化界面做成这里的一个页面，不开新 entry。

## 页面拆分

- 每个页面是 `pages/<name>/` 一个文件夹，至少有 `<Name>Page.tsx` 和聚合入口 `styles.less`
- 简单 tab：`tabs/<TabName>.tsx` 单文件，样式归并到页面级 less（如 `pages/profile/stats.less`）
- 复杂 tab（>200 行 / 含多个子页 / 多个内部组件）：拆为 `tabs/<tabName>/` 子目录，按职责分文件（`Tab.tsx` + 各 `*Page.tsx` + 共享组件 + `constants.ts` + 自带 `styles.less`），`index.ts` 重新导出
- **样式与拥有者同级**：页面级样式放页面根目录，复杂 tab 的样式跟随其子目录。页面根 `styles.less` 只用 `@import` 聚合，layout.xml 只引用这一个文件
- 只有当前 tab 用到的子组件留在 tab 文件夹，跨 tab 复用才提到 `react/shared/`
- `param` 支持 `'tab:subTab'` 定位子页：页面组件 `split(':')` 后把 subTab 透传给 tab 组件（如 `ProfilePage` 把 `'member:points'` 拆出传给 `MemberTab` 的 `initialSubTab`）

## 约定

- 左上角按钮栏入口在 `components/ButtonBarEntries.tsx` 的列表里加一项，列表先后即按钮栏先后
- 个人主页弹窗底色半透明，tab 内容放在 `.stats-card` 深色卡片上，避免游戏画面透出来干扰阅读
- **页面动画用 JS 驱动**（如 `$.Schedule` 定时改 prop）：webpack `additionalData` 给 keyframe 名加 Valve 要求的引号，只作用于 layout.xml 直接引用的那个 `styles.less`。`@import` 进来的页面 less 里写 `@keyframes` 会让整张 styles.css 解析失败、该页样式全丢（图标变紫块等）。`transform` / `scale3d` Panorama 本就不支持
