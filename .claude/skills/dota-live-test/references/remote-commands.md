# 远程命令：验物品与技能

`npm run dota:cmd` 经远程控制台往运行中的 Dota 发命令，发完把这批命令触发的新日志打印出来（默认只留 `[test]` / `[Debug]` / 报错行，`--all` 看全部，`--settle <毫秒>` 调等待时长）。Dota 必须由 `npm run launch` 或带 `-netconport 29000` 的命令启动。

```bash
npm run dota:cmd -- "say -item item_blink" "say -stat"
```

聊天命令要包成 `say <命令>`；控制台命令（`script_reload`、`dota_launch_custom_game`）直接写。

## 命令

| 命令                                    | 用途                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `-item <物品名>`                        | Dota 自带作弊命令，给当前英雄发物品                                       |
| `-stat` / `-watch` / `-cast` / `-dummy` | 本仓调试命令，参数以 `src/vscripts/modules/debug/debug-cmd.ts` 的注释为准 |
| `-m`                                    | 打印英雄当前全部 modifier                                                 |
| `-aioff` / `-aion`                      | 停掉 / 恢复自定义 AI，避免电脑来打假人                                    |
| `-g`                                    | 加钱升满级                                                                |
| `-clearunits`                           | 清掉小兵、野怪、召唤物                                                    |

`-stat` / `-watch` / `-cast` / `-dummy` 只在工具模式生效，输出带 `[test] t=<游戏时间>` 前缀。

## 标准流程

1. **准备**：`say -aioff`、`say -clearunits`，需要靶子时 `say -dummy <x偏移> <y偏移>`
2. **发物品并看被动**：`say -item <物品名>` 后 `say -stat`，对照 KV 核对属性（复用原版 modifier 时数值翻倍是静默的，这一步必须做）
3. **打开监视**：`say -watch`；要盯塔或敌方英雄时 `say -watch <半径>`，以开启那一刻英雄周围的敌人为准
4. **施法**：`say -cast <物品名> <x偏移> <y偏移>`、`say -cast <物品名> @dummy`，备用施法末尾加 `alt`
5. **读结果**：`+modifier dur=` / `-modifier` 看状态何时上、何时掉，`hp a->b (差值)` 看伤害与回复
6. **收尾**：`say -watch` 关监视，`say -aion` 恢复 AI

完成判据：每个要验的效果都在 `[test]` 日志里找到对应行，或明确指出缺哪一行。

## 陷阱

- `script_reload` 会清空假人列表，但停不掉重载前开着的监视计时器，旧单位会继续刷日志。改动后要干净数据就重启 Dota
- `-dummy` 是异步创建，`dummy <单位名>#<编号>` 那行出现后才能 `-cast ... @dummy`
- 只有 `-watch` 时选中的单位才会被盯；之后新刷的假人自动加入，其余单位要关掉重开
- 生命、魔法的增长只输出超出自然回复的部分，减少一律输出
