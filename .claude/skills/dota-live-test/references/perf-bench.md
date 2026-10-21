# 性能对比：基准场景与可信度核对

用 `npm run perf` 的步骤模式（`--mode steps`）比某个物品、modifier 或机制的每帧开销时读这份。全部选项见 `src/scripts/perf.js` 的 `parseArgs`，场景与条件定义在 `src/vscripts/modules/debug/perf-auto.ts`。

## 测法

标准命令（场景测试开局就拉满级发装备，热身默认 1.5 分钟，不跑到后期）：

```bash
npm run perf -- --scenes <场景> --conditions <条件,...> --swapItems <物品>
```

- 合成物品先拆部件测：`--swapItems <成品>` 量整件，`--itemModifiers <成品>:<modifier>:native`（原版）或 `<成品>:<modifier>:<脚本路径>`（Lua）以成品为来源单挂某个部件，组合条件 `a+b` 量几个部件合计
- 同一局里条件段与基线段交替、顺序打乱，结果读各条件相对前后基线的差，不拿不同对局的绝对值比
- 物品开销对比只用 `dmgbench` / `atkbench`：`fight` 逐轮波动可达几十 ms/tick，量不出单件物品。要跑 `fight` 时放在 `--scenes` 最后，打过团的英雄伤害结算变贵且不恢复，排在它后面的基准场景基线会失真（tick 掉到个位数）
- 物品开销用 `--swapItems <物品>` 的 `swap_<物品>` 减 `swap_empty`（空格对照），`swap_empty` 的逐轮波动就是这一轮的噪声
- 改动前后对比：每个版本一条测试分支，用同一套测试工具与参数各跑一局
- 默认固定跑 3 局，脚本不自动加局。读报告每个条件括号里的逐局值自行判断：各局同向、量级远大于 `swap_empty` 的波动即可下结论，单局离群就点出来；方向来回且量级与 `swap_empty` 相当，就是「≈0 / 测不出」，量级介于两者之间才用 `--appendTo runs/<时间>` 带同样参数追加局
- 放大某个 modifier 的开销时分散挂到不同单位各 1 份（参考 `bld_` 条件，全场建筑各挂 1 个），不在同一单位叠多份同名 modifier：叠挂测出的单个开销偏高一个数量级，只能看随层数增长的趋势（`meleebuff_x<N>` 属于这种）
- 已知结论（计在伤害结算 `CDOTA_BaseNPC::DamageImpact` 里，20 个实例）：Lua modifier 空壳 +0.3～1.6；只返回常量技能增强的 Lua modifier 在 `spellbench` +3.5～4.3（写成 KV +0.7），技能增强只在带技能来源的伤害里查、普攻不查；带全图受伤监听的约为空壳的 5 倍。测新机制时空壳与监听两档可用 `bld_empty` / `bld_takedamage`，或 `--itemModifiers <物品>:modifier_perf_empty:modules/debug/perf-building-modifier` 挂到英雄上作参照。原版物品 modifier 不一定便宜：`modifier_item_eternal_shroud`、`modifier_item_devastator` 单个比空 Lua modifier 贵十倍以上，同样计在伤害结算里；KV 光环（`Aura` + `Properties`）很便宜

## 基准场景

| 场景 | 内容 | 适用 |
|---|---|---|
| `atkbench` | 英雄在泉水每帧真实普攻对面 | 普攻命中、普攻吸血 |
| `dmgbench` | 每帧固定伤害，物理与魔法交替 | 受伤事件链路 |
| `spellbench` | 每帧固定伤害，全是带技能来源的魔法伤害 | 技能增强、法术暴击这类只对技能生效的逻辑 |
| `dotbench` / `dotbigbench` | 每帧 5 次 15 / 50 点魔法伤害，分别低于与高于共享分发的 20 点门槛 | 高频小额伤害、门槛是否生效 |
| `creepbench` | 天辉英雄（0 号玩家除外）站在河道己方兵线后，两队各 24 个近战兵单排对砍 | 光环、小兵数量相关开销 |

`--benchAttackers <N>` 限制伤害基准里出手的英雄数，服务器跑满后开销不再随负载线性增长时降负载用。

## 结果可信前先核对场景

- 日志里没有 `Script Runtime Error`，也没有测试自己用的 modifier 出现 `Attempted to create unknown modifier type`：引擎不认的 modifier 仍会产生开销，测出来的数字作废
- 光环类条件看 `creep bench aura` 行：带物品的段里光环 buff 覆盖到全部友方 / 敌方兵，基线段为 0
- 小兵用 `SetBaseMaxHealth` 放大血量（与出兵加强同一做法，不加 modifier），否则英雄几秒内清光一侧，兵数逐段起伏
- 近战兵间距至少 64 才排得成单排；挤成一团时只有前排在打，「每次攻击进 Lua」的实现会被低估
- 0 号玩家英雄不受 AI 开关控制、会自动攻击，留在泉水不参与场景
- 排兵线避开地形：站位落在石头或高低差上会被推到最近空地，开局后看一眼实际站位
