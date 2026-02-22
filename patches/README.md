# Patches 目录

此目录用于存放项目依赖的 patch 文件，这些文件会被提交到 git 进行版本管理。

## 当前 Patch

- `typescript-to-lua+1.28.1.patch` - 修复生产环境中 `debug` 为 `nil` 的问题

## 使用方法

### 首次应用 patch

1. 将 patch 文件放到此目录
2. 运行 `node src/scripts/apply-patch.js` 应用 patch
3. 运行 `npx patch-package typescript-to-lua` 生成 patch-package 格式的文件

### 自动应用

每次运行 `npm install` 时，`patch-package` 会自动应用此目录中的 patch 文件（通过 `postinstall` 脚本）。

## 注意事项

- 此目录中的文件会被提交到 git
- 不要手动修改此目录中的 patch 文件
- 如果需要更新 patch，请使用 `npx patch-package typescript-to-lua` 重新生成
