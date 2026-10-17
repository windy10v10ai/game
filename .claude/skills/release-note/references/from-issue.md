# 从 Issue 生成

参数 URL 含 `/issues/` 时用这份。

**A. 标准路径**（正文含 `### 7.41 同步核对` 与 `- [x]` / `- [ ]` 清单）：

1. `gh issue view <N> --repo windy10v10ai/game --json body`，解析 JSON 时去掉 BOM（`﻿`）
2. 截取 `### 7.41 同步核对` 至首个 `**说明**` 之间的清单行
3. 统计已完成 `- [x]` 与未完成 `- [ ]`，总数 = 二者之和
4. 只列已勾选的英雄，用「多英雄并列」句式，进度紧跟「技能更新」之后、冒号之前：

```
- 同步 Dota 2 7.41 英雄的技能更新（x/总数）：英雄A，英雄B，英雄C
```

```
- Synced Dota 2 7.41 ability updates (x/total): Hero A, Hero B, Hero C
```

**B. 回退路径**（无 checklist）：据 Issue 标题与描述写 2–5 条玩家向 bullet，不写 `x/总数`。
