---
name: doc-update
description: >-
  Capture-correction workflow: record valuable learnings from the current
  conversation into CLAUDE.md or the relevant SKILL.md so the same mistake never
  recurs. Reviews conversation for corrections, new conventions, and doc-reality
  mismatches; proposes targeted updates confirmed by user before writing. TRIGGER
  whenever the user corrects Claude's approach or rejects an action — signals like
  "不对", "不要这样", "应该是", "错了", "其实是", "no, do X instead", "that's wrong" —
  and the correction reflects a reusable convention rather than a one-off. Also use
  when a doc-vs-code discrepancy is found, or the user supplies a convention Claude
  could not infer.
---

# doc-update

对话结束前或触发条件满足时，把本次对话中**值得记录**的内容沉淀到文档中。

## 触发场景

自动触发：
- 用户纠正了 Claude 的做法，且根源是文档记载缺失/错误
- Claude 发现文档描述与实际代码矛盾（路径不存在、字段改名、规则冲突）
- 用户提供了 Claude 无法自行推断的约定/上下文

手动触发：`/doc-update`

---

## 执行流程

### 第一步：识别候选内容

回顾对话，找出以下类型的事件：

| 类型 | 典型信号 | 示例 |
|------|---------|------|
| **纠正** | 用户说"不对"、"不要这样做"、"应该是" | Claude 用了错误的路径或 API |
| **新约定** | 用户解释了某个规则，Claude 没有 | 文件命名约定、目录结构说明 |
| **文档矛盾** | CLAUDE.md 说 X 存在，但代码里没有 | 描述的路径不存在 |
| **工作流发现** | 某种做法在本项目特别有效或无效 | 某个 Skill 的触发条件需要调整 |

**排除以下内容**（不值得记录）：
- 代码中可直接读出的模式（命名规范、架构层次）
- 本次 task 的临时状态、当前进度
- 调试过程和 bug 修复配方（fix 在代码里，commit message 里）
- 已经在文档中有记载的信息

### 第二步：判断记录位置

| 内容类型 | 记录位置 |
|---------|---------|
| 项目级通用惯例、架构规则、常见陷阱 | `CLAUDE.md`（根目录） |
| 特定 skill 的执行细节、步骤修正 | 对应 `.claude/skills/<name>/SKILL.md` |
| 某个模块/子目录的专属约定 | 该目录下新建 `CLAUDE.md` |

> 优先更新已有条目，避免新增冗余段落。

### 第三步：用 AskUserQuestion 逐条确认

每条候选内容发起一次询问，说明：
- 发现了什么（哪里错了/缺了/新增了什么）
- 拟写入的具体内容（简明，不超过 3 行）
- 目标文件和位置

选项至少包含：**写入** / **跳过**。

> 每次最多 4 条并列询问，超过则分批。

### 第四步：实施确认的变更

- 更新内容时：找到目标章节，最小化修改（不重写整段）
- 新增内容时：插入语义最近的位置，不改变现有条目顺序
- 删除冗余时：仅删与代码现实矛盾的内容，其他保留

---

## 不要做的事

- 不要把对话摘要写入文档——只写**非显而易见的约束或发现**
- 不要重复已有记载——先搜索再写
- 不要为「可能有用」的信息写文档——没有明确使用场景则跳过
- 不要一次性写入大量内容——宁可少写，保持文档可扫读
