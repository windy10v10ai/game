# PR 界面截图

改了界面时才放（Panorama 布局、样式、玩家能看到的文案）。PR 正文是实机截图的存档处，跟代码一起 review、合并后仍可翻到；设计画布（Artifact）只用于动手前让用户挑方案。

## 拍什么

- 默认只拍中文；改了界面文案时中、英、俄各拍一组，确认长文本不溢出、不挤掉旁边的元素
- 只放改动后的画面，要对比时才放改动前
- **拍图派子代理，`model: "sonnet"`**（haiku 判断不了排版）：起服、等加载、截图、裁图是固定流程，图片在主会话里来回读很贵。交接里写全要拍的状态、裁剪区域、存放目录（会话 scratchpad），子代理回报文件路径和「有没有溢出、截断、白屏」，主会话只看裁好的小图
- **截图回来主会话要审图，不只确认拍到了**：逐张对照设计稿（画布或用户确认过的方案）看布局与对齐（同组元素对齐方式一致、该居中的没偏一边）、文字（截断、挤成一行、缺字、单复数）、图片（拉伸、挤压变形、尺寸与设计稿差太多）。有问题先修再重拍，带问题的图不进 PR。交接里也让子代理按这三项逐张回报
- 本机专用服 + 客户端的启动方式见 `dota-live-test` skill；客户端加 `-language english` / `-language russian` 切语言，每种语言单独起一次

## 放哪

图片放 `assets` 孤儿分支的 `pr/<PR 编号>/`，不进 `develop` 源码树。路径里有 PR 编号，所以顺序是**先建 PR，再推图，再 `gh pr edit` 更新正文**：

```bash
git worktree add --detach <临时目录>/wt-assets origin/assets
cd <临时目录>/wt-assets && git checkout -B assets origin/assets
mkdir -p pr/<PR 编号> && cp <图片> pr/<PR 编号>/
git add -A && git commit -m "Add screenshots for PR #<PR 编号>" && git push origin assets
```

用完 `git worktree remove <临时目录>/wt-assets --force`。正文用 `https://raw.githubusercontent.com/windy10v10ai/game/assets/pr/<PR 编号>/<名字>.png` 引用，推完先 `curl -o /dev/null -w '%{http_code}'` 确认 200。重拍的图换新文件名：GitHub 按网址缓存 PR 里的图，同名覆盖后仍显示旧图。

截图放在 `## Checklist` 之前，单独一段 `## Screenshots`。
