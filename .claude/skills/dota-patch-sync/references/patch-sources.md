# 取资料：更新日志与参考快照

两件事都派最便宜档，可并行。`docs/reference/` 被 gitignore，快照只在本机，不入库。

## 1. 更新日志

- 官方页面：`https://www.dota2.com/patches/<版本>`，中文加 `?l=schinese`。页面正文由前端动态加载，WebFetch 常拿不全，用浏览器读页面文本，或官方数据接口 `https://www.dota2.com/datafeed/patchnotes?version=<版本>`
- 存成 `docs/reference/<版本>/patchnotes.md`（英文）与 `patchnotes_schinese.md`（简中），文件头写来源 URL 与抓取日期
- 要求：完整，不翻译不概括，还原嵌套缩进（两个空格的嵌套列表）
- 抓完核对：英雄条目数中英一致、结尾完整、总行数合理。中文版里原文就有的全角分号保持原样，回报里说明数量
- 补丁版本（如 `7.41f`）覆盖前一版的对应条目，同一英雄同一技能以后出现的为准

## 2. 参考快照

从本机 Dota 2 的 `game/dota/pak01_dir.vpk` 解出原版 KV 与说明文本，放进 `docs/reference/<版本>/`，结构与上一版目录完全一致。

1. 先核对客户端版本：读 `<dota>/game/dota/steam.inf` 的版本日期，再确认解出内容确实是新版，而不是客户端还没更新。无法确认时仍可先解包，回报里醒目写「版本存疑」
2. 工具是 Source2Viewer-CLI，位置与用法见 `fix-asset-override` 与 `add-image`（`-i <vpk> -d -o <dir> -f <路径>`，`--vpk_list` 列文件）
3. 文件清单以上一版目录为准，逐个在 vpk 里找到原始路径解出：`scripts/npc/npc_abilities.txt`、`items.txt`、`neutral_items.txt`、`npc_heroes.txt`、`npc_units.txt`、`heroes/*.txt`、`resource/localization/abilities_*.txt` 等。上一版有而 vpk 没有的、vpk 新增的同类文件，都列出来
4. 先解到临时目录，核对后再拷进 `docs/reference/<版本>/`。行尾与编码保持与上一版一致，别自作主张转换。解包出来的目录里不要运行脚本
5. 完成后用 `git diff --no-index --stat docs/reference/<上一版> docs/reference/<版本>` 统计每个文件改动行数

回报：版本核对结论与依据、放入的文件数、缺失或新增的文件、改动最多的前 10 个文件及行数、遇到的问题。

## 3. 读完先给用户一段理解

两份资料到位后，主对话先简述对这次更新的理解：哪些章节改动大，初步看哪些会影响本图。用户确认后再进下一步。

## 坑

- 客户端版本可能比官方公告新或旧，以 `steam.inf` 与解出内容对比为准
- 更新日志文件可能很大，读的时候按章节切片，不要整份读入
