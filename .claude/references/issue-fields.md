# issue 字段与项目配置

issue 的 Type、Priority、Effort、标签和「开发计划」项目（`gh project` 编号 3）里的 Status。`issue-triage`（整批整理）、`issue-spec`（单条补齐）、`issue-impl`（开工改 Status）、`issue-autorun`（按优先级排序）共用，字段含义、ID、查询与修改命令只在这里维护，改了 ID 或选项只改这一处。

## 前提

`gh auth status` 的 scopes 要含 `project`，缺了让用户在终端跑 `gh auth refresh -s project`（会先问是否给 Git 认证，回车即可，再在浏览器填验证码）。

## 字段

| 字段 | 归属 | 取值 |
|---|---|---|
| Type | 组织级 issue 类型 | Task / Bug / Feature |
| Priority | 组织级 issue 字段（存在 issue 上，项目里没有同名字段） | Urgent / High / Medium / Low |
| Effort | 组织级 issue 字段 | High / Medium / Low |
| Labels | 各仓库一套 | game：ability、item、hero、awaken、bot、system、UI/UX、balance 等；firebase：web、API、launcher 等 |
| Status | 「开发计划」项目字段 | 见下表 |

| Status | 含义 |
|---|---|
| Backlog | 尚未计划；等日志、等前置条件的也放这里 |
| Plan | 几个月内上线 |
| Todo | 最优先事项，只放少数几条 |
| In progress | 正在做 / 下次更新上线 |
| Done | 最近一周完成 |

**每条未关闭 issue 都要有**：Type、Priority、Effort、至少一个仓库标签、项目 Status。总跟踪帖（如 firebase#1404 玩家反馈跟踪）不入项目。

## ID

GraphQL 报 ID 不存在时用下面的「重取 ID」。

| 对象 | ID |
|---|---|
| 项目 | `PVT_kwDOBviRE84Arg93` |
| Status 字段 | `PVTSSF_lADOBviRE84Arg93zgilol8`：Backlog `16ae42aa`、Plan `e8b70f57`、Todo `f75ad846`、In progress `f2f345f2`、Done `2936bddd` |
| Priority 字段 | `IFSS_kgDOAWdNCQ`：Urgent `IFSSO_kgDOAnSvXQ`、High `IFSSO_kgDOAnSvXg`、Medium `IFSSO_kgDOAnSvXw`、Low `IFSSO_kgDOAnSvYA` |
| Effort 字段 | `IFSS_kgDOAWdNDA`：High `IFSSO_kgDOAnSvYQ`、Medium `IFSSO_kgDOAnSvYg`、Low `IFSSO_kgDOAnSvYw` |
| Type | Task `IT_kwDOBviRE84BE0wc`、Bug `IT_kwDOBviRE84BE0wf`、Feature `IT_kwDOBviRE84BE0wi` |

```bash
# 重取 ID
gh project field-list 3 --owner windy10v10ai --format json
gh api graphql -f query='{organization(login:"windy10v10ai"){issueTypes(first:10){nodes{id name}} issueFields(first:10){nodes{... on IssueFieldSingleSelect{id name options{id name}}}}}}'
```

## 查询

```bash
# 单条 issue：node id、类型、标签、Priority/Effort、项目条目 id 与 Status
gh api graphql -f r=game -F n=<n> -f query='query($r:String!,$n:Int!){repository(owner:"windy10v10ai",name:$r){issue(number:$n){id issueType{name} labels(first:10){nodes{name}} issueFieldValues(first:10){nodes{... on IssueFieldSingleSelectValue{name field{... on IssueFieldSingleSelect{name}}}}} projectItems(first:5){nodes{id project{title} fieldValueByName(name:"Status"){... on ProjectV2ItemFieldSingleSelectValue{name}}}}}}}'

# 一个仓库的全部未关闭 issue（含正文，整批整理用）
gh api graphql -f r=game -f query='query($r:String!){repository(owner:"windy10v10ai",name:$r){issues(states:OPEN,first:100){nodes{number title createdAt updatedAt issueType{name} labels(first:10){nodes{name}} comments{totalCount} issueFieldValues(first:10){nodes{... on IssueFieldSingleSelectValue{name field{... on IssueFieldSingleSelect{name}}}}} projectItems(first:5){nodes{project{title} fieldValueByName(name:"Status"){... on ProjectV2ItemFieldSingleSelectValue{name}}}} body}}}}'

# 项目全部条目（含草稿 DraftIssue 与 Done 栏），返回顺序就是项目里列内从上到下的顺序
gh project item-list 3 --owner windy10v10ai --limit 200 --format json
```

## 修改

```bash
# 设 Priority / Effort（issueFields 可一次传多个）
gh api graphql -f query='mutation{setIssueFieldValue(input:{issueId:"<id>",issueFields:[{fieldId:"<字段id>",singleSelectOptionId:"<选项id>"}]}){clientMutationId}}'

# 设类型
gh api graphql -f query='mutation{updateIssue(input:{id:"<id>",issueTypeId:"<类型id>"}){issue{number}}}'

# 改 Status；补进项目先 item-add 拿到条目 id
gh project item-add 3 --owner windy10v10ai --url <issue url> --format json -q .id
gh project item-edit --project-id PVT_kwDOBviRE84Arg93 --field-id PVTSSF_lADOBviRE84Arg93zgilol8 --id <条目id> --single-select-option-id <状态id>

# 草稿转正式 issue（转完条目 id 不变，Status 保留），再用 gh issue edit 补标题、正文、标签
gh api graphql -f query='mutation{convertProjectV2DraftIssueItemToIssue(input:{itemId:"<条目id>",repositoryId:"<仓库node id>"}){item{content{... on Issue{number}}}}}'
```
