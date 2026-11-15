# 性能对比：基准场景与可信度核对

用 `npm run perf` 的步骤模式（`--mode steps`）比某个物品、modifier 或机制的每帧开销时读这份。全部选项见 `src/scripts/perf.js` 的 `parseArgs`，场景与条件定义在 `src/vscripts/modules/debug/perf-auto.ts`。

## 测法

标准命令（场景测试开局就拉满级发装备，热身默认 1.5 分钟，不跑到后期）：

```bash
npm run perf -- --server tools --scenes <场景> --conditions <条件,...> --swapItems <物品>
```

必须带 `--server tools`：只有工具模式有引擎剖析器数据，不带则报告里「每 tick ms 差」那列是空的。

- 合成物品先拆部件测：`--swapItems <成品>` 量整件，`--itemModifiers <成品>:<modifier>:native`（原版）或 `<成品>:<modifier>:<脚本路径>`（Lua）以成品为来源单挂某个部件，组合条件 `a+b` 量几个部件合计
- 同一局里条件段与基线段交替、顺序打乱，结果读各条件相对前后基线的差，不拿不同对局的绝对值比
- 物品开销对比只用 `dmgbench` / `atkbench`：`fight` 逐轮波动可达几十 ms/tick，量不出单件物品。要跑 `fight` 时放在 `--scenes` 最后，打过团的英雄伤害结算变贵且不恢复，排在它后面的基准场景基线会失真（tick 掉到个位数）
- 物品开销用 `--swapItems <物品>` 的 `swap_<物品>` 减 `swap_empty`（空格对照），`swap_empty` 的逐轮波动就是这一轮的噪声
- 要分清开销算在出手方还是挨打方时加 `--benchSide attacker`（只换给不被选为目标的 18 人）或 `--benchSide victim`（只换给两队 1 号，各挨对面 10 人打），对 `--swapItems` 与 `--itemModifiers` 都生效。伤害基准里只有这 2 个挨打方，单件比较要按件数折算
- 改动前后对比：每个版本一条测试分支，用同一套测试工具与参数各跑一局
- 默认固定跑 3 局，脚本不自动加局。读报告每个条件括号里的逐局值自行判断：各局同向、量级远大于 `swap_empty` 的波动即可下结论，单局离群就点出来；方向来回且量级与 `swap_empty` 相当，就是「≈0 / 测不出」，量级介于两者之间才用 `--appendTo runs/<时间>` 带同样参数追加局
- 放大某个 modifier 的开销时分散挂到不同单位各 1 份（参考 `bld_` 条件，全场建筑各挂 1 个），不在同一单位叠多份同名 modifier：叠挂测出的单个开销偏高一个数量级，只能看随层数增长的趋势
- 已知结论（计在伤害结算 `CDOTA_BaseNPC::DamageImpact` 里，20 个实例）：Lua modifier 空壳 +0.3～1.6；只返回常量技能增强的 Lua modifier 在 `spellbench` +3.5～4.3（写成 KV +0.7），技能增强只在带技能来源的伤害里查、普攻不查；带全图受伤监听的约为空壳的 5 倍。测新机制时空壳与监听两档可用 `bld_empty` / `bld_takedamage`，或 `--itemModifiers <物品>:modifier_perf_empty:modules/debug/perf-building-modifier` 挂到英雄上作参照。原版物品 modifier 不一定便宜：`modifier_item_eternal_shroud`、`modifier_item_devastator` 单个比空 Lua modifier 贵十倍以上，同样计在伤害结算里；KV 光环（`Aura` + `Properties`）很便宜。永恒护符 20 件（issue #2697）：`item_lua` 版（Lua 被动挂原版永恒之盘、滋补，登记全局监听）+2.25 / +3.52 / +3.16（dmg / atk / spell），同效果的 `item_datadriven` 版 ≈0，只开全局监听 ≈0，开销在持有者挨打时的 `DamageImpact`

## 基准场景

| 场景 | 内容 | 适用 |
|---|---|---|
| `atkbench` | 英雄在泉水每帧真实普攻对面 | 普攻命中、普攻吸血 |
| `dmgbench` | 每帧固定伤害，物理与魔法交替 | 受伤事件链路 |
| `spellbench` | 每帧固定伤害，全是带技能来源的魔法伤害 | 技能增强、法术暴击这类只对技能生效的逻辑 |
| `castbench` | 全员学 5 级双刃剑，每帧真实普攻，每 3.5 秒全员放一次双刃剑 | 技能施放与技能事件监听（配合 `awaken_centaur` 条件） |
| `dotbench` / `dotbigbench` | 每帧 5 次 15 / 50 点魔法伤害，分别低于与高于共享分发的 20 点门槛 | 高频小额伤害、门槛是否生效 |
| `creepbench` | 天辉英雄（0 号玩家除外）站在河道己方兵线后，两队各 24 个近战兵单排对砍 | 光环、小兵数量相关开销 |

`--benchAttackers <N>` 限制伤害基准里出手的英雄数，服务器跑满后开销不再随负载线性增长时降负载用。

## 结果可信前先核对场景

- 日志里没有 `Script Runtime Error`，也没有测试自己用的 modifier 出现 `Attempted to create unknown modifier type`：引擎不认的 modifier 仍会产生开销，测出来的数字作废
- 各段的存活英雄数（`[perf] phase=` 行的 `heroes=`）要一致：`atkbench` 里英雄会被打死，加生命的物品让更多英雄活着出手，伤害结算次数变多、读数虚高。某个场景里条件段与基线段的 `heroes=` 对不上，该场景的读数记为不可信
- 光环类条件看 `creep bench aura` 行：带物品的段里光环 buff 覆盖到全部友方 / 敌方兵，基线段为 0
- 小兵用 `SetBaseMaxHealth` 放大血量（与出兵加强同一做法，不加 modifier），否则英雄几秒内清光一侧，兵数逐段起伏
- 近战兵间距至少 64 才排得成单排；挤成一团时只有前排在打，「每次攻击进 Lua」的实现会被低估
- 0 号玩家英雄不受 AI 开关控制、会自动攻击，留在泉水不参与场景
- 排兵线避开地形：站位落在石头或高低差上会被推到最近空地，开局后看一眼实际站位

## 测多久、测几次

- 每局用时 ≈ 场景数 × （1 + 2 × 条件数）× 45 秒 + 约 3 分钟启动，`--reps` 每多一轮再乘一次。实例：3 个场景、4 个条件、3 局共 68 分钟；1 个条件、2 个场景，每局约 8 分钟
- 噪音（单局摆动，三局平均后约减半）：`dmgbench` ±0.1～0.5，`spellbench` ±0.6，`atkbench` ±0.9 ms/tick。小于 0.5（`dmgbench`、`spellbench`）或 1.0（`atkbench`）读作约等于 0
- 测到决策够用就停：差距远大于噪音时一轮就够，不为 0.1 的差别加局数
- 两档：
  - **筛查（默认）**：`--games 1 --reps 2`，只选相关的 1～2 个场景和被测条件，不加对照，噪音用前后基线的摆动估计，只判断差距有没有到 1 ms/tick 以上
  - **加测**：只在结果落在噪音边缘（0.5～1 ms/tick）时才追加，用 `--appendTo` 补局数，需要时再加空白对照，不一开始就多局多轮

## 对照怎么选

对照组按测试对象定，不是每次都测空白对照：

| 测试对象 | 怎么测 | 对照 |
|---|---|---|
| 整件物品 | `--swapItems <物品>` | 筛查用前后基线；加测时再加 `swap_empty`（换成空物品），它同时检验换装动作本身 |
| 单个 modifier、技能、挂载方式 | `--itemModifiers` 或该机制自己的条件（如威压的 `meleebuff`） | 前后基线就够，没有换装动作，不测空白对照 |
| 眩晕、受伤这类被触发的机制 | 在对应场景里叠一个触发条件（如 `stunpulse`） | 同上 |

## 报告格式

写进 PR「验收结果」（放正文最下方）和 issue 留言的性能报告，读者只想知道修改前后是改好了还是没改好：

- **修改前 vs 修改后放最前**：同场景同参数各一条，每个场景一句结论：改好了 / 基本持平 / 变差了。差值远大于 `swap_empty` 的逐局波动才算变好或变差，量级相当写「基本持平」
- **用图，不用大段文字**：`python -I .claude/skills/dota-live-test/scripts/perf-chart.py <spec.json> <out.svg>` 出对比图（SVG 是文本，清晰、体积小，PR 正文可直接引用）。spec 有 `title`、`note`、`footer` 和 `panels`（每栏 `title`、`verdict`、`good`、`rows`，行里 `name`、`value`、`kind`）；`kind` 取 `before`（橙）、`after`（蓝）、`ref`（灰，参照组，排在后面）。各栏共用同一根坐标轴，零线和刻度上下对齐，便于比较场景之间的量级。图按 `create-pr/references/screenshots.md` 放 assets 分支，贴在 PR「验收结果」，图下最多两三行：结论，以及数据口径（修改前不是同批测的要写明）。数据多（逐局表、多个条件）时另做 HTML artifact 挂到 issue（命令见 `doc-writing.md`「issue artifact」），PR 里只放 SVG 加链接
- **噪音范围用 `noise` 画灰带**：panel 里填 `noise`（毫秒），带内的读数一律读作「约等于 0」。数值取同一条件前后两段基线之间差值的摆动幅度；不为它单独测空白对照
- **参照组只是附带**：空白对照、拆出的部件、同类做法的数据放在图里的灰条，不当修改前，也不写「某 issue 的数据」这类读者看不懂的来源；逐局值表放 PR 评论
- **用白话讲系统名**：报告和 PR 正文先用白话说清关键系统是谁、做什么（哪件装备、哪个技能、玩家看到什么），机制变化画一张前后示意图（SVG）；图下用一句话对照关键代码名，例如「隐藏技能的代码名是 `ability_x`，游戏自带的「泰坦强化」代码名是 `modifier_y`」，正文其余地方只用白话名，不堆代码名和文字
