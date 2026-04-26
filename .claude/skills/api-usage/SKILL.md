---
name: api-usage
description: Windy10v10AI 的 VScripts API 调用规范与工作流（ApiClient、重试机制、Analytics 事件采集与发送模式）。
disable-model-invocation: true
---

# API Usage

本技能用于在本项目中新增/修改 VScripts 侧 API 调用时，遵循既有架构与最佳实践，避免随意拼接口与重复造轮子。

## 使用时机

- 需要新增/修改后端 API 请求（游戏开始/结束、统计、埋点等）
- 需要新增 Analytics DTO、事件监听、批量/延迟发送逻辑
- 需要定位项目中现有 API 调用方式并保持一致

## 参考资料（必须优先参考）

- `references/api-usage.md`

## 核心约束（摘要）

- 统一通过 `src/vscripts/api/api-client.ts` 的 `ApiClient.sendWithRetry()` 发送请求（含重试）
- 需要认证的端点使用 API Key（`x-api-key`），由 `ApiClient` 统一注入
- 常用两种模式：
  - **模式 1**：静态方法一次性发送
  - **模式 2**：事件监听→收集数据→在特定游戏状态统一发送

## 执行步骤（建议）

1. 明确要调用的端点、请求方法、body 结构、触发时机
2. 查找现有同类调用（优先复用/对齐）
3. 若需要新 DTO：
   - 放到 `src/vscripts/api/**/dto/`
   - 保持字段清晰，发送前补齐 `matchId`、`version` 等元数据（如适用）
4. 选择调用模式并实现：
   - 模式 1：提供 `static` 方法，构造 `ApiParameter`，调用 `sendWithRetry`
   - 模式 2：注册事件监听器，使用静态变量累积数据，在合适状态发送并记录日志
5. 确保日志包含关键可排查信息（成功、失败、数量、玩家等）

