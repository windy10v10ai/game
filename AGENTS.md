# AGENTS.md

本仓库唯一项目规范文件是 `.claude/CLAUDE.md`。

在进行任何代码修改、issue 处理、review、测试、构建或发布前，必须先读取 `.claude/CLAUDE.md`，并遵守其中规则。如果上下文或工具行为导致没有自动读取到 `.claude/CLAUDE.md`，也必须在动手前主动读取。

不要在本文件维护重复项目规范；规范变更只修改 `.claude/CLAUDE.md` 或对应 skill。

## 必读章节索引

读取 `.claude/CLAUDE.md` 后，优先关注与当前任务相关的章节：

- 语言偏好
- 开发命令
- 代码架构
- 开发指南
- 常见陷阱
- 图片资源管理
- Dota 2 参考文件速查
- KV Configuration
- 本地化文案规约
- Implementation Style
- 注释规约
- Plan 规范
- Git 工作流
- 文档自维护规范
- Skill 交互规范

## Skill 路由

如果任务涉及特定 workflow，必须继续读取对应 `.claude/skills/<skill-name>/SKILL.md`：

- 新增或修改自定义技能：`.claude/skills/custom-ability/SKILL.md`
- 克隆原版技能：`.claude/skills/clone-ability/SKILL.md`
- 觉醒技能：`.claude/skills/awaken-ability/SKILL.md`
- 新增或修改自定义物品：`.claude/skills/custom-item/SKILL.md`
- 克隆原版物品：`.claude/skills/clone-item/SKILL.md`
- 新增或修改英雄天赋：`.claude/skills/custom-talent/SKILL.md`
- bot 技能施法逻辑：`.claude/skills/bot-ability-usage/SKILL.md`
- bot 物品使用逻辑：`.claude/skills/bot-item-usage/SKILL.md`
- bot 出装配置：`.claude/skills/bot-item-build/SKILL.md`
- 抽奖池 Tier 调整：`.claude/skills/adjust-lottery-tier/SKILL.md`
- 技能 override 维护：`.claude/skills/update-abilities-override/SKILL.md`
- 英雄 custom 校验：`.claude/skills/update-heroes-custom/SKILL.md`
- 本地化格式与同步：`.claude/skills/localization-format-guide/SKILL.md`
- 外部 API 调用：`.claude/skills/api-usage/SKILL.md`
- Dota 文档/API 查询：`.claude/skills/dota-docs-lookup/SKILL.md`
- 创建 PR：`.claude/skills/create-pr/SKILL.md`，并按要求使用 `.claude/skills/release-note/SKILL.md`
- 文档规范沉淀：`.claude/skills/doc-update/SKILL.md`
