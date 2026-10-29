# 交给 agent 自动做的 issue

`issue-triage`、`issue-spec`（用户在场时拍板）、`issue-impl`（做一条）与 `issue-autorun`（用户不在时批量做）之间的约定。`issue-impl` 与 `issue-autorun` 只认这里定义的标签、执行说明和它指向的 issue artifact，不读对话。

## 标签

| 标签 | 谁打 | 含义 |
|---|---|---|
| `agent-todo` | `issue-spec`，用户确认后 | spec 已拍板，等 agent 自动做 |
| `agent-done` | `issue-autorun` | 已开草稿 PR，等用户审；PR 里的「等你处理」只列用户本人要看或拍板的事 |
| `agent-block` | `issue-autorun` | 整条 issue 一点都做不了，原因写在 issue 留言里 |

一个 issue 同时只带其中一个。用户处理完 `agent-block` 的留言、补好执行说明后换回 `agent-todo`。

### 级别标签

`issue-spec` 定 spec 时同时打一个级别标签，按「最难判定的那一项」定级：

| 标签 | 含义 | 判据 |
|---|---|---|
| `L1-code` | 代码端完结 | 实机验证「不需要」，jest / lint / 编译就能判对错 |
| `L2-script` | 脚本实机验证 | 实机验证只有「脚本判定」项 |
| `L3-visual` | 截图判定 | 实机验证含「截图判定」项 |
| `L4-investigate` | 排查倒查 | 原因不明、要做假设反复试，或改动范围列不出来；不打 `agent-todo`，用户在场时在 Claude Desktop 用 Opus 做 |

「用户判定」项不影响级别，统一进「等你处理」。

## 执行说明

写在 issue 正文末尾，标题固定为 `## 执行说明`，agent 只按这一段（及它指向的 issue artifact）干活。每一项都要写到不用再问的程度：

```markdown
## 执行说明

- **目标**：做完后玩家或开发者能观察到的结果，可拆成几条，各条尽量互不依赖
- **做法**：先写用哪个 skill（如「按 `clone-ability`」；`AGENTS.md` 对照表里没有对得上的写「无」），再写已拍板的实现方案，含选型（如「用 KV Properties，不新增 Lua modifier」）
- **改动范围**：允许改的文件或目录，逐条列出
- **不做**：明确排除的相关改动
- **验收**：必须通过的命令（默认 `npm test`、`npm run lint`、`npm run build:vscripts`；改 Panorama 加 `npm run build:panorama`），以及要补的 jest 用例，每个用例写明输入与预期
- **实机验证**：需要 / 不需要；需要时逐项标层级（见下文「实机验证分三层」）并写到可判定
- **Release Note**：不写 / 要写，附用户确认过的中文要点原文（面向玩家的一句话，`issue-spec` 时给用户看草稿定稿）
```

目标拆成几条互不依赖的小项，agent 卡在其中一条时才能跳过它继续做别的。

执行者可能是能力一般的模型（见 `issue-autorun`），按「照做不走样」的标准写：

- **做法**给出要照抄的已有实现：提交号或同类条目名（如「照 `sniper_keen_scope2` 的写法克隆」）
- 档位、数值、等级这类平衡性取舍在执行说明里定死，不留给 agent 类比；定不下来的写明「agent 暂定，记为待你决定」
- **实机验证**逐项写到可判定：装到哪类英雄、做什么操作、哪个数值应该怎么变，而不是「能生效」
- 写到「agent 不需要做判断」为止：定「做什么」和「怎么判对错」，不写代码怎么改。要判断的地方要么在执行说明里定死，要么按下文交给调度员或用户

### 实机验证分三层

每一项实机验证标明属于哪一层，能放进上层的不放下层：

| 层 | 适用 | 执行说明里写什么 | 谁做、谁判 |
|---|---|---|---|
| **脚本判定** | 属性、移速、攻击距离、冷却、伤害、modifier 有无与层数、事件是否触发 | 操作步骤与每项预期值（含容差）；只要读数不判对错的写「只记录」 | 执行者写临时 Lua，每项打印 `[check] PASS` / `[check] FAIL`，`FAIL` 行数为 0 才算过 |
| **截图判定** | 图标、特效、面板布局、悬停或点击后才出现的 tooltip 与界面 | 截哪个状态、裁哪块、正确时应该看到什么 | 执行者操作并截图，只交图不下结论；调度员看图判定 |
| **用户判定** | 手感、动画节奏、需要连续观察的表现 | 要看什么、和什么对比 | 记进「等你处理」，用户回来测 |

### 复杂 issue：指向设计 artifact

上面几项写不进一屏、要讲数据流或跨多层改动时，按 `.claude/references/doc-writing.md`「设计 spec」把设计挂成该 issue 的 HTML artifact，issue 里只留指针：

```markdown
## 执行说明

- **设计文档**：设计（https://github.com/windy10v10ai/game/issues/<n>/artifacts/<编号>）
```

设计文档包含上面执行说明的全部七项。

## 子 issue

大 issue 拆成几批、或从 L4 拆出测量时，用 GitHub 原生的子 issue 关联，正文不写「父 issue：#n」：

```bash
gh issue create -R windy10v10ai/game --parent <父n> ...             # 新建时挂上
gh issue edit <父n> -R windy10v10ai/game --add-sub-issue <n>,<n>    # 挂已有 issue
gh issue view <n> -R windy10v10ai/game --json parent                 # 查父 issue
```

- 父 issue 管目标、进度与验证结论；几个子 issue 共用的规约挂成父 issue 的 Markdown artifact，子 issue 的执行说明写明指向它
- 子 issue 有先后依赖时只给当前一批打 `agent-todo`，前一批合并后再给下一批打

## 从 L4 拆出测量子 issue

L4 里能写成固定步骤的测量或验证（卡顿优化前后的 perf 基准、某机制的触发频率统计），拆成子 issue，按 L2 / L3 交给 agent 在用户不在时跑；排查的思路和要不要改仍留在父 issue，用户在场时定。

- 按上文「子 issue」挂到父 issue 下，执行说明照常写全：「目标」写要拿到的数据；「改动范围」写「无（只用临时脚本）」；「实机验证」写测量步骤、局数、要带回的数字和格式
- 交付不开 PR：结果写进子 issue 留言，并在父 issue 留言汇总一行。数据多、要表格或要和之前的测量对比时，报告挂成子 issue 的 Markdown artifact（名称 `<YYYY-MM-DD> <主题> 测量报告`），留言写结论摘要和 artifact 链接
- 测量只陈述数据和结论，不据此改代码

## 适合交给 agent 的 issue

适合：本地化、KV 数值、文档、有 jest 兜底的 bot 规则与模块逻辑、方案已定的小功能；靠实机才能判断对错的，执行说明里写清实机验证步骤也可以交。

不交：要排查或评估的（卡顿、设计评估）、改动范围列不出来的。这类打 `L4-investigate`，留给用户在场时做。
