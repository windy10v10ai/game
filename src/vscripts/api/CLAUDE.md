# src/vscripts/api/ 后端 API 客户端

所有请求经 `api-client.ts` 的 `ApiClient.sendWithRetry()` 发送，它统一注入认证用的 `x-api-key`。端点字段以本地 API 服务器的 OpenAPI 文档为准（`http://localhost:3001/api-docs-json`），不按路由名猜。

改代发（客户端 HTTP relay）相关代码前先读同目录 `README.md`：游廊对局服务端发不出 HTTP，线上每一局都靠玩家客户端代发，那条链路的限制（只能 GET、标题长度上限、认响应头、线路可用性）决定了这一层能怎么写。

## 重试次数

`ApiParameter.retryTimes` 是**总尝试次数**：`1` = 只发一次，默认 `3` = 首次加两次重试。只有网络失败（状态码 0）、429 与 5xx 才重试，其余 4xx 直接走失败回调。

- **会扣积分、扣费或建订单的写入设 `1`**：重复执行是真实损失，宁可失败让玩家重点一次
- 结算（`/game/end/local` 与 `/game/end`）后端共用账户冷却，重发不会重复加分，重试 3 次
- 后端本身幂等的保持默认重试：`PUT /player/:id/property`（目标等级语义）、`PUT hero-awakening`（已觉醒直接 no-op）、`PUT setting` 与 `PUT game-preset`（覆盖式写入）
- 新增调用点先去后端确认是累加还是覆盖
