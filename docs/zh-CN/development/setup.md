# 环境配置

需要 Windows 10/11、Steam、Dota 2 和 [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Installing_and_Launching_Tools)。
游玩[已发布的地图](https://steamcommunity.com/sharedfiles/filedetails/?id=2307479570)不需要开发环境。

安装 [`.nvmrc`](../../../.nvmrc) 指定的 Node.js 版本。
使用 [nvm-windows](https://github.com/coreybutler/nvm-windows) 时，在仓库根目录的 PowerShell 中执行：

```powershell
nvm install $(Get-Content .nvmrc)
nvm use $(Get-Content .nvmrc)
node --version
```

将自己的 fork 克隆到与 Dota 2 相同的磁盘分区。

在仓库根目录执行：

```powershell
npm install
```

安装程序应用依赖补丁，将 `game/` 和 `content/` 复制到 Dota 对应的
`dota_addons/windy10v10ai/` 目录，然后用 junction 链接替换仓库中的目录。
若目标目录已经存在，程序会询问是否删除；同意前先备份自己的地图修改。
找不到 Dota 时可以安装依赖，但会跳过目录链接。

确认输出中包含两条目录链接信息，然后参考[开发流程](workflow.md)。
