# Рабочий процесс разработки

Выполните [установку](setup.md), затем запустите в PowerShell из корня репозитория:

```powershell
npm run start
```

Команда запускает Dota в режиме Tools и отслеживание изменений Panorama и VScripts.
Убедитесь, что компиляция завершилась без ошибок и аддон запустился.
Если Dota уже работает, скрипт не перезапускает её; при необходимости перезапустите игру в режиме Tools.

Перед отправкой изменения выполните:

```powershell
npm run lint
npm test
npm run build
```

`npm run build` собирает оба слоя. Для отдельной сборки используйте `npm run build:panorama`
или `npm run build:vscripts`. `npm run lint:fix` применяет исправления ESLint.
Сборка и автоматические тесты не заменяют проверку игры или интерфейса в Tools.

## VConsole

Следующие команды выполняются в VConsole Dota, а не в PowerShell:

```text
dota_launch_custom_game windy10v10ai dota
dota_launch_custom_game windy10v10ai custom
dota_custom_ui_debug_panel 7
script_reload
host_timescale <float>
```

Первые две команды запускают аддон на карте `dota` или `custom`.
Следующие показывают панель завершения игры и перезагружают Lua. Вместо `<float>` укажите множитель скорости;
`host_timescale 1` возвращает обычную скорость.

## Исходники

- [`src/common/`](../../../src/common/): общие типы.
- [`src/vscripts/`](../../../src/vscripts/): игровая логика TypeScript, компилируемая в `game/scripts/vscripts/`.
- [`src/panorama/`](../../../src/panorama/): интерфейс TypeScript/React; текущая сборка Webpack помещается в `content/panorama/layout/custom_game/react/`.
- [`src/scripts/`](../../../src/scripts/): инструменты разработки.
- [`game/`](../../../game/) и [`content/`](../../../content/): игровые ресурсы аддона.

Меняйте исходники TypeScript, а не сгенерированный Lua. См. [потоки данных](../architecture/README.md)
и [правила участия](../../../.github/CONTRIBUTING.md); целевая ветка PR — `develop`.

## Дополнительные материалы

- [Шаблон аддона ModDota на TypeScript](https://github.com/ModDota/TypeScriptAddonTemplate)
- [X-Template](https://github.com/XavierCHN/x-template)
- [Примеры способностей и модификаторов](https://github.com/ModDota/TypeScriptAddonTemplate/tree/master/src/vscripts)
- [TypeScript-to-Lua](https://typescripttolua.github.io/)
- [TypeScript для VScripts](https://moddota.com/scripting/Typescript/typescript-introduction/)
- [TypeScript для Panorama](https://moddota.com/panorama/introduction-to-panorama-ui-with-typescript)
- [React в Panorama](https://moddota.com/panorama/react)
