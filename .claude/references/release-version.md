# Release Note 目标版本

目标版本由 Steam 已发布的最新版本与聚合 release PR 的版本号算出，结果唯一，不让用户选轨道。用户指定了版本号时直接采用。

## 1. 取两个版本号

**Steam 最新版本**是唯一可信的发布状态。用户手动发布到 Steam，发布后不一定马上合并 release PR，所以 git tag 与 GitHub Release 判断不了是否已发布。

```bash
curl -s -m 15 https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570 | grep -oE '(Gameplay update|游戏性更新) v[0-9]+\.[0-9]+[a-z]?' | head -1
```

首条匹配即最新版本。用 curl 而不是 WebFetch：WebFetch 把整页交给模型总结，经常失败。curl 失败或无匹配时，向用户要 Steam 当前版本号（SubAgent 里停下回报）。

**release PR 版本**：`gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url`，标题即大版本号（如 `v5.65`）。它在任意 PR 合入 `develop` 后自动创建，`develop` 上的代码就是这个版本。有多条时问用户；没有时按创建工作流的公式算：`git tag -l "v*.*" | sort -V | tail -1` 的小版本号加 1（如 `v5.69` 得 `v5.70`），同时记下「release PR 未创建」，`create-pr` 的写回选项按它出。release PR 存在时同时读正文（`gh pr view <N> --repo windy10v10ai/game --json body -q .body`），取目标版本块里的现有条目，供 `release-note` 对照合并、定位置。

## 2. 算目标版本

| Steam 最新 | 目标版本 | 写进 release PR 的位置 |
|---|---|---|
| 低于 release PR（Steam `v5.64`、PR `v5.65`） | release PR 版本 `v5.65` | 大版本块 |
| 与 release PR 同大版本（`v5.65` / `v5.65a`） | 用户明确要求小版本时取下一个补丁字母 `v5.65a` / `v5.65b`，否则取 release PR 版本 `v5.65` | 补丁版本不写入 release PR，写回只能选「仅写入功能 PR」或「不写」 |
| 高于 release PR | 问用户 | — |

完成：目标版本是具体的 `v…` 字符串。
