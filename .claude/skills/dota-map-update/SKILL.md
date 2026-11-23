---
name: dota-map-update
description: Dota 2 官方更新了地形（地图改动）后，把本图地图同步到新版：覆盖官方 vmap、用脚本重做手改、编译 dota / hard / custom 三张图、合并不朽庭院特效、实机验证。
---

# 地图更新

官方更新日志「地图改动」要求更新地形时用。总流程与子 issue 拆分见 `dota-patch-sync`，实机验证细则见 `dota-live-test`。

## 源文件与产物

| 位置 | 内容 |
|---|---|
| `C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\content\dota\maps\` | 官方源文件：`dota.vmap`、`prefabs\dota_pvp_prefab.vmap`。Steam 更新后才是新版 |
| `content/maps/`（符号链接到 `content\dota_addons\windy10v10ai\maps`） | 本图源文件：`dota.vmap`（与官方一致，不手改）、`prefabs/dota_pvp_prefab.vmap`（官方版加手改）、`prefabs/shop_keeper_*.vmap`（我方手改，官方没更新过，不覆盖） |
| `game/maps/` | 编译产物：`dota.vpk`、`hard.vpk`、`custom.vpk`（`addoninfo.txt` 里 `maps` 为 `dota hard custom`） |
| `content/materials/overviews/dota.png`、`game/materials/overviews/*` | 小地图概览图及其编译产物 |

`.vmap` 是二进制 DMX。文本化用 `game\bin\win64\dmxconvert.exe -i <in> -o <out> -oe keyvalues2`，改完用 `-oe binary` 转回，Hammer 与 `resourcecompiler` 都能读。文本文件放 scratchpad，不放进仓库。

## 手改的三处（都在 `dota_pvp_prefab.vmap`）

| 手改 | 做什么 | 为什么 |
|---|---|---|
| 6 个营地改远古 | `neutralcamp_evil_12`、`evil_13`、`evil_20`、`good_12`、`good_16`、`good_20` 的 `NeutralType=3`、`MinSpawnType=1`、`MaxSpawnType=5`（与官方原生远古 `evil_8` / `good_8` 一致） | 提升地图外围营地等级。营地名字每版都要确认还在，位置变了不影响 |
| 天辉泉水 `trigger_shop` 放大 | 实体 origin 约 `-7584 -6688`，两个子 mesh 覆盖全图 xy，z 覆盖高地与河道落差，右上角是斜角（不是矩形） | 全图任意位置买卖。只拉 xy 不拉 z，英雄上高地后会脱离触发器（PR #2252） |
| 夜魇泉水 `trigger_shop` 放大 | 官方 7.42 里实体 origin 是 `7328 6400`（更新前 `7584 6656`），两个子 mesh 覆盖夜魇高地，世界坐标约 x 4096..7808、y 4352..7872 | 填满天辉那块让出的右上角 |

**两个泉水触发器的约束**：

- 不能重叠，重叠会有 bug。这是硬约束，优先于覆盖。天辉那块右上角是斜角，正是为夜魇这块让位的，夜魇高地由放大的夜魇商店负责
- 拼起来尽量覆盖全图，交界处（夜魇高地两侧）有少量买不了的空白可以接受，不要为了消除空白去扩大任何一块
- 不能用包围盒重建或判断：天辉块的包围盒看起来覆盖全图，实际右上角是斜角。脚本把旧版文件里两个子 mesh 的整套几何（顶点、面、子 mesh 的世界坐标）原样搬到新文件对应实体上，核对逐顶点比世界坐标。子 mesh 的 origin 是世界坐标，官方移动实体 origin 不影响它

**找手改的坑**：不能只对比「我方旧文件 vs 官方新文件」，差异里混着官方自己的改动，容易把手改误判成官方改动（这次夜魇泉水的放大就是这样漏掉的，夜魇高地出现一大块买不了的区域）。要拿官方旧版（上一版 `content/dota/maps/` 源文件或其快照）作基线，对比「我方旧文件 vs 官方旧版」才是手改的完整清单。没有官方旧版时，把每一处差异都列给用户确认，不自行归类。

`shop_keeper_dire.vmap` / `shop_keeper_radiant.vmap` 各删了 1 个秘密商店 `trigger_shop`，不随官方更新，保持不动。官方 prefab 里第三个 `trigger_shop`（薄片，约 y 7072..7104）不改。

## 步骤

1. 从最新 `develop` 切分支。备份现有 `dota.vmap` 与 `dota_pvp_prefab.vmap` 到 scratchpad
2. 把上一步备份的旧 prefab（带手改的版本，通常是 `git show develop:content/maps/prefabs/dota_pvp_prefab.vmap`）存成文件，跑 `python .claude/skills/dota-map-update/scripts/apply_map_edits.py --baseline <旧 prefab> --work <scratchpad>/work`：把官方 `dota.vmap` 复制过来，官方 prefab 文本化、改 6 个营地、从旧 prefab 搬两个泉水触发器的几何、转回二进制写入 `content/maps/prefabs/`，再转回文本核对。输出必须满足：28 个营地中只有上面 6 个带 `*`，两个泉水触发器逐顶点与旧版一致，其余触发器不变，脚本内置断言。官方改了触发器子 mesh 数量或营地名字时脚本会报错，先读报错再处理
3. 编译三张图，三张图用同一份 `dota.vmap`：

   ```bash
   cd "C:/Program Files (x86)/Steam/steamapps/common/dota 2 beta/game/bin/win64"
   cp <content>/maps/dota.vmap <content>/maps/custom.vmap; cp <content>/maps/dota.vmap <content>/maps/hard.vmap
   ./resourcecompiler.exe -i "<content>/maps/dota.vmap" -f -nop4
   ./resourcecompiler.exe -i "<content>/maps/custom.vmap" -f -nop4
   ./resourcecompiler.exe -i "<content>/maps/hard.vmap" -f -nop4
   ```

   命令行无界面可用，每张约 80 秒，末尾 `OK: 1021 compiled, 0 failed`。`generic.vfx` / `soundevents` 找不到的报错是 Tools 的常见噪音。编译后删掉临时的 `custom.vmap`、`hard.vmap`（不入库）。`<content>` 用绝对路径写 `C:/Program Files (x86)/.../content/dota_addons/windy10v10ai`，路径里的 `$变量` 别用反斜杠转义。**先编译 dota 再跑下一步**，因为 `game/maps/dota.vpk` 此时是原始产物
4. 合并不朽庭院特效：`python .claude/skills/dota-map-update/scripts/build_map_vpks.py --work <scratchpad>/map_build`。用 Source2Viewer-CLI（`C:\App\Source2Viewer`）解包原始 `dota.vpk` 与官方 `game\dota\maps\dota_coloseum.vpk`，以我方文件为底、官方特效包覆盖、再把我方 `entities/` 盖回去（营地与全图商店是实体，要保住），重新打包成 `game/maps/dota.vpk`。首次运行把原始产物存为 `<work>/dota_raw.vpk`，之后可用 `--raw` 重跑不用重新编译
5. 小地图：官方有新概览图时，从 `game\dota\pak01_dir.vpk` 解出 `materials/overviews/dota_psd.vtex_c`（`Source2Viewer-CLI -i <pak01_dir.vpk> -f materials/overviews/dota -d -o <dir>`，取 `dota_psd.png`）覆盖 `content/materials/overviews/dota.png`，再编译 `content\dota_addons\windy10v10ai\materials\overviews\*.vmat`（`dota.vmat` 引用已不存在的 `dota.tga`，编译失败是老问题，不用管，`custom` / `hard` 成功即可）
6. 实机验证，见下面清单

## hard / custom 没有不朽庭院特效

试过让 hard / custom 复用带特效的 dota 包，没有成功：引擎按地图名去 `maps/<地图名>/world.vwrld` 找世界，而资源里写死原路径 `maps/dota/`，只重命名入口文件会 `CREATE_SERVER_FAILED`。

- hard（名字也是 4 个字符）：把所有文件里的 `maps/dota` 原地替换成 `maps/hard`，并把顶层文件改名，仍有一批路径压缩在 KV3 数据块里改不到（`default_ents`、`world_layer_*`、几百个 `worldnodes/*.vmdl_c`），报 `Failed loading resource "maps/dota/..."`，整个原 `maps/dota/` 目录留作兜底后才能进游戏，包体翻倍到 65MB。不留兜底进不了游戏
- custom（6 个字符）：改长度会破坏资源偏移，没法同样处理

所以三张图只有 dota 带特效，hard / custom 保持 `resourcecompiler` 的原始产物。要想做到，需要能改写 KV3 压缩数据的工具，现有的 Source2Viewer 只能读、不能写。

## 验证清单

用 `dota-live-test`，不要用 `dota:check`（它不能指定地图名，hard / custom 要手动启动：`dota2.exe -novid -tools -condebug -conclearlog -netconport 29000 -addon windy10v10ai +dota_launch_custom_game windy10v10ai <地图名>`）：

- `GetMapName()` 返回 `dota` / `hard` / `custom`（模式逻辑依赖它）
- 全图商店：用天辉方英雄测即可（商店触发器双方共享，玩家只在天辉），点位含夜魇高地泉水以外的多个位置、斜角交界线两侧、河道、四角，`IsInRangeOfShop(DOTA_SHOP_HOME, true)` 为真。交界处少量买不了的点是预期，写明位置即可，不算失败。传送后要等约 1 秒再读，读太早会误报 0
- 6 个远古营地刷出远古野怪（黑龙、岩石 / 花岗岩傀儡、冰甲傀儡、豹猫萨满等），其余 22 个跟随官方
- 防御塔、双生之门、回城石、肉山坑与官方 7.42 一致。运行时导出实体坐标，回城石不是运行时实体，取自 prefab 的 `npc_dota_stone_of_recall`
- 小地图是新版，不朽庭院特效只在 dota 图出现
- 三张图都能开局到 `GAME_IN_PROGRESS`

## 电脑眼位不在地形 PR 里重做

地形更新后电脑的插眼点（`src/vscripts/ai/ward/ward-position-config.ts`）要按新地图重新规划，这件事单独开 Dota 更新子 issue（7.42 是 #2835），地形 PR 不做。地形 PR 只修新地图上走不到、落进不可走区域的眼位。

写死坐标的核对做法：把脚本里的点放进新旧两张图，用 `GridNav:IsTraversable`、`IsBlocked` 和从基地 `CanFindPath` 实机检测，只修新图比旧图多出来的失败点，旧图上就不可走的点留给眼位子 issue。新旧防御塔、双生之门、兵线出生点坐标取自 `game/maps/dota.vpk` 里的 `maps/dota/entities/default_ents.vents`（用 Source2Viewer-CLI 解包，旧版从 `git show develop:game/maps/dota.vpk` 取出）。

## 坑

- 运行中的 Dota 会占着 `game/maps/*.vpk`，写文件前先关掉自己起的那个实例（按进程号）
- `dota:check` 的 `IsInRangeOfShop` 类检查要在传送后等待，见上
- 7.42 的 `neutral_spawner` 营地 `Min/MaxSpawnType` 对整批营地也有改动，只改那 6 个的类型字段，其余用官方值
