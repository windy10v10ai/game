# 客户端 HTTP 代发（Client HTTP Relay）

游廊多人对局里服务端发不出 HTTP，改由玩家客户端代发。本文档记录设计与决策，
进度与步骤见 [issue #2435](https://github.com/windy10v10ai/game/issues/2435)。

## 为什么需要

发不出 HTTP 的分界是**启动方式**，不是「本地主机」：

| 启动方式 | 服务端能发 HTTP | 别人能连进来 |
| --- | --- | --- |
| 游廊创建的多人对局 | 否 | 能 |
| 控制台命令启动 | 能 | 不能 |
| Dota Tools | 能 | 不能 |

降级判定不靠猜启动方式，而是运行时看 `CreateHTTPRequestScriptVM` 有没有返回请求对象
（`ApiClient.sendTo`）。拿不到就转交 `sendThroughProxy`。

## 传输层：ApiHtmlProxy

服务端挑一名已就绪的真人玩家，把网址通过自定义事件发给他的客户端，客户端用隐藏的
`DOTAHTMLPanel` 加载该网址，页面的 `<title>` 里带着响应内容，再经事件回传服务端。

标题格式 `<requestId>|<JSON>` 或 `<requestId>|ERR:<code>`。API 恒返回 200，
成败全靠 `ERR:` 前缀区分（`parseProxyError`）。

### 由此带来的硬限制

- **只能 GET，带不了请求头**。认证改用 query 里的 `apiKey`，写入型路由的请求体要塞进 query
- **标题长度上限 4096**。后端 `TITLE_MAX_LENGTH` 超限直接返回 `ERR:too_long`，不做静默截断
- **走的是浏览器内核，会认 HTTP 响应头**。详见下面「中国大陆线路」
- **CEF 会缓存**。`buildUrl` 每条网址都拼一个随机 `_` 参数

### 两个计时

排队等客户端举手的时间**不占用**请求自己的超时预算：

| 计时 | 时长 | 从什么时候开始算 |
| --- | --- | --- |
| 排队上限 `QUEUE_TIMEOUT_SECONDS` | 60 秒 | 请求进入队列 |
| 请求预算 `TIMEOUT_SECONDS` | 10 秒（探测 5 秒） | 真正派发给某个客户端 |

原本两者共用同一个 10 秒。实测某轮客户端 44 秒才就绪，全部请求死在第 10 秒的队列里，
一次都没派发出去。游廊 10 人局里客户端加载慢于 10 秒完全正常。

60 秒对齐客户端脚本自己的就绪重试窗口（每秒一次最多 60 次），它等不到就不会再举手，
再等也没用。

### 代发人拉黑

代发失败（超时或客户端报错）就把这个玩家加入 `failedPlayerIds`，`findRelayPlayer`
跳过他，调用方已有的重试自然落到下一个人。后端返回的 `ERR:*` **不拉黑**——那说明网络是通的，
是业务错误，换谁都一样。

两个决策：

- **不在传输层另造重试循环**。传输层换 3 个人、业务层再整体重发 3 次，最坏 9 次请求，
  日志里也分不清哪次是谁。拉黑的价值不是省一次超时，而是让**已有的那个重试**变得有意义
- **全员都失败过就清空名单重来**（`selectRelayPlayer`）。候选通常只有三四人，一次抖动就永久
  排除会很快无人可用。清空即自愈，不需要计时器或恢复逻辑；三四个人配三次重试，一轮正好
  把人走一遍

**换人不能替代给连不上的地区准备线路**：同一房间的玩家网络状况是相关的，不是独立的，
中国大陆的房间通常全员都在墙内。换人只救个体故障，区域性问题要靠专门的线路。

### 应答归属

回传只认当初派发给的那名玩家（`isFromRelayPlayer`），别的客户端即便猜中 `requestId`
也顶替不了应答。

## 分层：传输层不认识业务

`ApiHtmlProxy` 只负责「把一个网址发出去、把标题拿回来」，不认识任何业务路径。
拆分与合并由各业务的 Proxy 类实现，通过 `ApiClient.RegisterProxyHandler` 注册：

```
ApiClient.sendThroughProxy
  └─ findProxyHandler(path)        按注册的路由模式匹配，字面路由优先
       └─ XxxProxy.Handle(...)     拆分 / 编码 / 合并
            └─ ApiHtmlProxy.Send   逐条发出
```

`ProxyHandler` 把整个 `ApiParameter` 递给处理器，处理器需要的东西（query、body）
自己从里面取，**不需要给 `ApiParameter` 加代理专用字段**。

已注册的处理器在 `modules/index.ts` 统一 `Register()`。

## 重试全在 TS

`ApiParameter.retryTimes` 是**总尝试次数**，不是重试次数：`sendWithRetry` 判断
`retryCount < maxRetryTimes`，所以 `1` = 只发一次不重试，默认 `3` = 共三次。401 任何情况都不重试。

panorama 脚本 `api_html_proxy.js` **没有任何重试逻辑**，只有 10 秒超时后发一个失败事件。
新增功能不要在客户端脚本里加重试——两层重试相乘会让次数和日志都不可读。

## 写入型代理路由的规约

网页控件只能发 GET，所以原路由是 POST / PUT / DELETE 的，代理侧全是「有副作用的 GET」。

### 命名：非 GET 一律加方法后缀

`/proxy/` + 原路径去掉路径参数拍平 + `-` + 方法小写。GET 不加后缀。

| 原路由 | 代理路由 |
| --- | --- |
| `GET /game/start` | `/proxy/game-start` |
| `POST /game/end` | `/proxy/game-end-post` |
| `PUT /player/:id/property` | `/proxy/player-property-put` |
| `DELETE /player/:id/property` | `/proxy/player-property-delete` |

**为什么一律加而不是只在撞车时加**：只在撞车时加，就没法从原路由直接推出代理路由名，
得先查有没有兄弟路由。而 `PUT` 和 `DELETE /player/:id/property` 确实会撞成同一个名字。
一律加是机械的；名字里带着方法也在持续提醒这条路由会改数据。

### 请求体：base64url 进 query

base64url 是网址安全字符集，不需要百分号编码，膨胀 1.33 倍；原始 JSON 全是括号引号冒号，
百分号编码要 1.5 倍。API 侧从 query 解出来再走原有的 class-validator 校验，
**DTO 与校验逻辑和原路由共用，不另写一套**。

不换更紧凑的格式（定长 CSV、msgpack 等）：省下的字符换不回后端两套解析与校验的代价，
而且长度上限实测余量充足。

### 幂等：不做后端去重，靠调用方不重试

代发只是客户端加载一次网址，自己不会重发；重复执行只可能来自 game 侧的重试逻辑。
所以不引入幂等键、去重表这类后端机制，改为在调用点把 `retryTimes` 设成 `1`。

已设成只发一次的四条：

| 调用点 | 后端实际行为 |
| --- | --- |
| `POST /game/end` | 累加积分、胜负、掉线场次，无 `matchId` 判重 |
| `DELETE /player/:id/property` | 每次都扣一份积分 |
| `POST /alipay/order/create` | 每次生成新的商户订单号 |
| `POST /player/member-points/use` | 纯扣费，无防重键 |

经确认后端本身幂等、保持默认重试的：`PUT /player/:id/property`（目标等级语义）、
`PUT hero-awakening` 与 `/random`（已觉醒 no-op / ensure 语义）、
`PUT setting` 与 `PUT game-preset`（覆盖式写入）。

**新增调用点时先去后端确认是累加还是覆盖，不要按路由名猜。**

## 选路与中国大陆线路

`ApiRoute` 维护三个目标：`local` / `direct` / `cn-proxy`。开局各发一次探测
（`/proxy/game-probe`），国家码从响应体 JSON 读，判定是中国大陆就走 `cn-proxy`。

### 现状：中国大陆线路在代发通道上不可用

腾讯云函数的默认域名（`*.tencentscf.com`）给**每一个**响应无条件加
`Content-Disposition: attachment`。代发靠的是浏览器内核，它认这个头：不渲染页面 →
`<title>` 永远不会被设置 → 必然超时；同时下载流程会在游戏里弹出文件选择对话框。

排查证据：

- curl 对比两条线路同一接口：主 API 域名无此头，腾讯云有
- 换 `text/html`、`application/json`、`text/plain` 三种响应，全都带
- 打一个不经上游、完全由函数自己生成的 404，照样带 → 平台层注入，与业务代码无关
- 在 server 项目里显式返回 `Content-Disposition: inline` 尝试覆盖，无效，被强制覆盖

**为什么以前没暴露**：服务端直连用的 `CreateHTTPRequestScriptVM` 是裸 HTTP 客户端，
根本不看这些头。这个头八成一直都在，阶段 2 才第一次换上会认它的客户端。

> 教训：**不能用直连结果推断代发能不能用**。新接一个代发地址前先 `curl -D -` 看响应头。

处置是在 `sendThroughProxy` 入口直接跳过 `cn-proxy`，不再发出请求。游廊对局永远选直连——
这本来就是阶段 2 之前的现状。本地主机对局走裸 HTTP 客户端，中国大陆线路在那里照常可用。

### 后续方向

绑已备案的自定义域名（要等备案）、换腾讯云其他产品（默认域名大概率同样限制，待验证）、
**买一台境外 VPS 自己反代**（不需要备案、响应头自己说了算，推荐）。单独立项，不挡阶段 3。

另有一个未处理问题：腾讯云函数冷启动会返回 502。换线路方案后一并处理。

## 阶段 3：结算的拆分设计

方针：**不切片**，按玩家拆成自包含请求（每条 base64url 后约 984 字符），API 保持无状态。

### game 侧只新增一个类

新增 `GameEndProxy`，与 `GameStartProxy` 平级，注册到 `/game/end`。
`ProxyHandler`、`ApiParameter`、`ApiHtmlProxy.Send`、`Game.EndGame` 都不用改。

**去 bot 行放在 `GameEndProxy` 里**，另外两个位置都不行：

- `GameEnd.BuildGameEndDto` 里滤掉 → GA4 的技能选择、每日任务两个 tracker 还要读 bot 行
- `Game.EndGame` 里滤掉 → 那一层不知道这局会不会走代发，直连的局会被误伤

顺带去掉 `playerId` 字段，后端 DTO 没声明它，进了 query 就是白占字符。

### API 侧把编排拆成两个内部方法

- **对局级记录**：GA4 的 `game_end_match`。一个事件里装着 `player_1`…`player_10`，
  单玩家请求凑不齐，**代发路径不调用**
- **单玩家结算**：积分战绩、每日任务、生涯统计。两条路都调

`/game/end` 与 `/game/end/local` 调两个方法，行为不变；`/proxy/game-end-post` 只调后一个。

**不需要按 `matchId` 做幂等**：代发路径既然不写对局级记录，就没有任何东西会被 N 条请求
重复写，每条只碰自己那个玩家。

### 接受的断供

| 丢的 | 影响 |
| --- | --- |
| GA4 全场对局事件 | 对局维度统计断供 |
| bot 行统计 | 按玩家拆后去重键全撞成 `matchId + 0`，不换去重键、不为 bot 多发请求 |
| 后端行为分数值更新 | 组队积分加成在 game 侧算，不受影响；只是行为分本身不再变动 |

三条都只限走客户端代发的对局。本机主持与控制台启动的局走原路由，统计照常。

## 不做

- `GET /player/ranking`：`Ranking.LoadRankingInfo` 全仓库没有调用方，是死代码
- GA4 埋点与 cloudflare 取时间：不走 `ApiClient`，游廊对局接受丢失
- 分片：按玩家拆之后不需要，API 保持无状态
- 签名：沿用 `x-api-key`，本机主持本来就不可信
