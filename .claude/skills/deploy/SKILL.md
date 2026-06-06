---
name: deploy
description: 发布 windy10v10ai 到 Steam Workshop。用户说"发布"、"deploy"、"上传 Steam"、"更新 Workshop"时触发。支持 Claude Code（运行命令）和 Cowork（运行命令 + Chrome 自动更新中文日志）两种环境。
---

# Steam Workshop 发布流程

## 环境信息

- SteamCMD: `C:\App\steamcmd\steamcmd.exe`
- 账号: 自动从 `C:\App\steamcmd\config\config.vdf` 的 `Accounts` 节点读取
- Workshop Item ID: `2307479570`
- 项目路径: `C:\Users\windy\Documents\GitHub\windy10v10ai`
- 发布脚本: `src/scripts/publish.js`

---

## Step 1：询问发布内容

向用户询问：
- **英文 changenote**（必填）
- **中文日志**（可选，Cowork 环境下可自动写入网页）

changenote 支持多行，用 `\n` 表示换行（脚本会自动转为真实换行写入 VDF）。格式参考 PR 的 Release Note 段落。

---

## Step 2：执行发布命令

**Claude Code 环境**（在终端运行）：
```bash
cd C:\Users\windy\Documents\GitHub\windy10v10ai
npm run deploy -- "<英文changenote，换行用\n>"
```

**Cowork 环境**（用 Windows-MCP PowerShell 或 bash）：
```
cd C:\Users\windy\Documents\GitHub\windy10v10ai
npm run deploy -- "<英文changenote，换行用\n>"
```

命令自动完成：
1. `npm run build`（编译 VScripts + Panorama）
2. 清理 `game/` 下 SQLite 缓存文件（tools_thumbnail_cache.sqlite3 等）
3. SteamCMD 生成临时 VDF → 上传 Workshop → 删除临时 VDF

---

## Step 3：Chrome 更新中文 changelog（仅 Cowork）

Claude Code 中跳过此步，用户手动操作或另行处理。

Cowork 中，发布成功后：

1. 打开 Chrome：`mcp__computer-use__open_application("Google Chrome")`
2. 连接扩展：`mcp__Claude_in_Chrome__tabs_context_mcp(createIfEmpty: true)`
3. 导航到 changelog 页面：
   `https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570`
4. `read_page(filter: "interactive")` 找最新条目的编辑链接
   - 格式：`https://steamcommunity.com/sharedfiles/editchangelogentry/2307479570/<timestamp>/`
   - 选 timestamp 数字最大的（最新发布）
5. 导航到该编辑链接
6. `read_page` 找语言 combobox 和 textbox 的 ref
7. `form_input` 设语言为 简体中文（value="6"）
8. **重新** `read_page`（切换语言后 ref 会刷新，旧 ref 失效）
9. `form_input` 填入中文日志内容
10. `javascript_tool` 执行 `SaveChanges()`
11. 导航回 changelog 页验证

---

## 定时发布 prompt 模板

用户想在指定时间自动发布时，用以下模板创建 scheduled task（`mcp__scheduled-tasks__create_scheduled_task`）：

```
## 任务：发布 windy10v10ai 到 Steam Workshop

## Step 1：构建并上传

使用 Windows-MCP PowerShell（先通过 ToolSearch 加载 mcp__Windows-MCP__PowerShell）：

cd C:\Users\windy\Documents\GitHub\windy10v10ai
npm run deploy -- "<英文changenote，换行用\n>"

## Step 2：Chrome 更新中文 changelog

Step 1 成功后执行：
1. ToolSearch 加载 mcp__computer-use__open_application，打开 "Google Chrome"
2. ToolSearch 加载 mcp__Claude_in_Chrome__tabs_context_mcp，createIfEmpty: true
3. 导航到 https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570
4. read_page(filter:"interactive") 找最新条目的 editchangelogentry 链接（timestamp 最大）
5. 导航到该链接
6. read_page 找 combobox 和 textbox ref
7. form_input 设语言为简体中文（value="6"）
8. 重新 read_page（ref 已刷新）
9. form_input 填入中文日志：
<中文日志内容>
10. javascript_tool 执行 SaveChanges()
11. 导航回 changelog 页验证

## 注意
- changenote 中 \n 会被 publish.js 自动转为真实换行
- SteamCMD session 过期时报错停止
- Chrome 扩展未连接时报错停止
```

---

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| SteamCMD session 过期 | session 缓存失效 | 运行 `C:\App\steamcmd\steamcmd.exe +login <username> +quit` |
| build 失败 | 编译错误 | 先单独跑 `npm run build` 排查 |
| changenote 换行显示异常 | 参数传入方式 | 用 `\n`（两字符），脚本会转换 |
| Chrome 扩展未连接 | Chrome 未开或未登录 | 先打开 Chrome，确认扩展已登录 |
| form_input ref 失效 | 切换语言后页面刷新 | 切换语言后必须重新 read_page |
