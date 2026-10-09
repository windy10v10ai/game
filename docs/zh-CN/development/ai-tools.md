# AI 辅助开发

AI 工具是可选项。共享规则位于 [`AGENTS.md`](../../../AGENTS.md)，
[`CLAUDE.md`](../../../CLAUDE.md) 导入这些规则。详细代理规则位于 `.agents/docs/`，
项目技能位于 `.claude/skills/`。

使用 Claude Code 时安装 [CLI](https://claude.com/claude-code) 或
[VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)，然后登录。
使用兼容的第三方服务时，在本地创建 `.claude/settings.local.json`：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-api-endpoint",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key"
  }
}
```

使用服务提供方给出的地址和密钥替换示例。该文件被 Git 忽略，不要提交密钥。
参考 [Claude 设置文档](https://code.claude.com/docs/en/settings)。
配置后确认 Claude 可以认证并读取仓库规则。

进行 GitHub 操作时安装 [GitHub CLI](https://cli.github.com/) 并执行 `gh auth login`。
使用自己的账号并确认仓库权限；登录不会授予原项目服务的访问权限。
