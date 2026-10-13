# checkout 被 review 的 PR

只 fetch 目标分支，同时保留向原 PR 分支 push 的能力。

- **有 PR 号**：`gh pr view <PR号> --json headRefName,headRepository,headRepositoryOwner` 取 head 分支与仓库 URL。为该 PR 建独立 remote，fetch refspec 限定为这一个分支：

  ```bash
  git remote add --no-tags -t "<headRefName>" "review-pr-<PR号>" "<headRepositoryUrl>"
  git fetch --no-tags "review-pr-<PR号>"
  ```

  作者 fork 的通配 remote（`+refs/heads/*`，`gh pr checkout` 也会建这种）会让本地 Git 自动同步拉取整个 fork，所以用上面这种单分支 remote。
- 从 `review-pr-<PR号>/<headRefName>` 建**同名本地分支**并设 upstream，修改后可直接 `git push` 回原 PR。本地同名分支或同名 remote 已存在时，先检查 URL、upstream 和工作区状态，再决定复用还是换名
- 验证：`git config --get-all remote.review-pr-<PR号>.fetch` 只有 `+refs/heads/<headRefName>:refs/remotes/review-pr-<PR号>/<headRefName>`，`git for-each-ref refs/remotes/review-pr-<PR号>` 只有目标分支
- PR 完成、不再需要 push 后，问用户是否 `git remote remove review-pr-<PR号>`
- **只有分支名（同仓库）**：`git switch <branch>`
