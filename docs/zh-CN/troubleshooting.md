# 故障排查

## 地图无法启动或修改未生效

对照 `.nvmrc` 检查 Node 版本，确认 Dota 和 Workshop Tools 已安装，并查看
`npm install` 是否跳过目录链接。仓库与 Dota 必须位于同一分区。
重装依赖前先检查两条地图目录链接及构建错误；参考[环境配置](development/setup.md)。

若现有地图目录阻碍安装，同意替换前先备份修改。
不要将删除已链接的 `game/` 或 `content/` 当作通用修复方法。
修复后执行 `npm run start`，确认地图可以加载。

## 粒子资源错误

原项目文档中的示例：

```text
Failed loading resource "particles/units/heroes/hero_skywrath_mage/skywrath_mage_mystic_flare_ambient.vpcf_c" (ERROR_BADREQUEST: Code error - bad request)
```

先确认失败资源的来源。若为本地生成的地图资源，备份到地图目录之外，重新编译并重启 Dota。
不要删除 Valve VPK 内的资源。旧 README 建议删除，但这并不能证明故障原因或保证修复。
确认报错消失且特效恢复显示。

## 报告问题

提供复现步骤、预期与实际结果、地图版本、房间设置以及相关 VConsole 日志或截图。
分享前移除密钥和个人数据。参考[贡献指南](../../.github/CONTRIBUTING.md)选择合适的问题跟踪器。
