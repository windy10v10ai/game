---
name: dota-patch-sync
description: Dota 2 官方发版（更新、版本同步、patch）后，本图同步工作的总流程：建主 issue、读更新日志、拆英雄与物品等子任务。
---

# Dota Patch Sync

Dota 2 官方发新版后，本图要核对并同步的改动很多，按类别拆成几块，各块分批做、分批合并。`<版本>` 目录按 `docs/reference/` 实际存在的取（含 `7.41f` 这类字母后缀），上一版指排在新版之前的那个目录。

## 整体流程

待补。主 issue 怎么建、怎么读更新日志、怎么生成本地摘要、怎么拆子 issue。

## 英雄改动

对照新版更新日志「英雄改动」一节，核对每名英雄的技能与天赋改动是否影响本图的克隆、觉醒、自制、抽奖技能和电脑 AI 配置。完整做法读 `references/hero-changes.md`，要点：

1. 手工列英雄清单，写成主 issue 正文的勾选清单
2. 只读摸底，按「本图要不要动手、动手要不要判断」分 A / B / C，不按官方改动大小分
3. A 直接勾掉，B 按批自动同步，C 每名或每类拆子 issue、先定方向再改
4. 同步数值与 `Bot.Build` 走 `update-abilities-override`「补丁日志同步」和 `update-bot-hero-build`
5. 更新日志不在各 PR 里写，发版 PR 合成一条

## 物品改动

待补。物品同步走 `update-items-override`，批次与流程待定。

## 其他章节

待补。
