# Установка

Нужны Windows 10/11, Steam, Dota 2 и [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Installing_and_Launching_Tools).
Для игры в [опубликованный аддон](https://steamcommunity.com/sharedfiles/filedetails/?id=2307479570) среда разработки не требуется.

Установите Node.js версии из [`.nvmrc`](../../../.nvmrc).
При использовании [nvm-windows](https://github.com/coreybutler/nvm-windows) выполните в PowerShell из корня репозитория:

```powershell
nvm install $(Get-Content .nvmrc)
nvm use $(Get-Content .nvmrc)
node --version
```

Клонируйте свой форк на тот же раздел диска, где находится Dota 2. Дополнительные инструменты:
[VS Code](https://code.visualstudio.com/), [GitHub Desktop](https://desktop.github.com/)
и [Source 2 Viewer](https://valveresourceformat.github.io/).

Из корня репозитория выполните:

```powershell
npm install
```

Установщик применяет патчи зависимостей, копирует `game/` и `content/` в соответствующие каталоги
`dota_addons/windy10v10ai/` внутри Dota и заменяет папки в репозитории ссылками junction.
Если каталог аддона уже существует, установщик спрашивает, удалить ли его: перед согласием сохраните свои изменения.
Если Dota не найдена, зависимости могут установиться, но привязка каталогов будет пропущена.

Проверьте сообщения о двух созданных ссылках, затем переходите к [рабочему процессу](workflow.md).
