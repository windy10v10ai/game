# AI-assisted development

AI tools are optional. Shared repository instructions are in [`AGENTS.md`](../../../AGENTS.md);
[`CLAUDE.md`](../../../CLAUDE.md) imports them. Detailed agent guides are under `.agents/docs/`
and project workflow skills under `.claude/skills/`.

For Claude Code, install the [CLI](https://claude.com/claude-code) or
[VS Code extension](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) and sign in.
For a compatible third-party endpoint, create `.claude/settings.local.json` locally:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-api-endpoint",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key"
  }
}
```

Use values supplied by your provider, not the placeholders above. This file is ignored by Git;
do not commit credentials. See the [Claude settings reference](https://code.claude.com/docs/en/settings).
After configuration, verify that Claude can authenticate and read the repository instructions.

For GitHub operations, install [GitHub CLI](https://cli.github.com/) and run `gh auth login`.
Authenticate with your own account and verify repository access; signing in does not grant access to upstream services.
