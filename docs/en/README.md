# Documentation

- [Architecture: data flow](architecture/README.md)
- [Project setup and development](../../README.md)

Translations use matching paths under `docs/<language>/`, for example
`docs/en/architecture/README.md` and `docs/ru/architecture/README.md`.
Use language codes such as `en`, `ru`, and `zh-CN`; add another directory for another language.
Share diagrams and attachments through `docs/shared/` rather than copying them into translations.
`docs/reference/` holds local vanilla Dota snapshots and is excluded from Git.

Artwork sources live in `assets/sources/`, retained compiled assets in `assets/compiled/`,
item working notes in `notes/items/`, and the resource compilation script in
`scripts/compile-resources.bat`. Runtime addon resources remain in `content/` and `game/`.
