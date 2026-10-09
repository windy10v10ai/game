# Разработка с ИИ

ИИ-инструменты необязательны. Общие инструкции находятся в [`AGENTS.md`](../../../AGENTS.md);
[`CLAUDE.md`](../../../CLAUDE.md) импортирует их. Подробные агентские правила находятся в
`.agents/docs/`, скилы проекта — в `.claude/skills/`.

Для Claude Code установите [CLI](https://claude.com/claude-code) или
[расширение VS Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) и войдите в аккаунт.
Для совместимого стороннего сервиса создайте локальный файл `.claude/settings.local.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-api-endpoint",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key"
  }
}
```

Подставьте адрес и ключ своего провайдера вместо примеров. Файл исключён из Git;
не коммитьте ключи. См. [справочник настроек Claude](https://code.claude.com/docs/en/settings).
После настройки убедитесь, что Claude авторизуется и читает инструкции репозитория.

Для операций GitHub установите [GitHub CLI](https://cli.github.com/) и выполните `gh auth login`.
Используйте свой аккаунт и проверьте доступ к репозиторию; вход не даёт доступ к сервисам оригинального проекта.
