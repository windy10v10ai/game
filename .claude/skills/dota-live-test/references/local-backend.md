# 本地后端

要验 API 链路时才起。后端在 `C:/Users/windy/Documents/GitHub/firebase`（需要 java）：

```bash
firebase emulators:start --only firestore,auth --import ./firestore-backup --project windy10v10ai
```

```bash
cd api && npm run start
```

两条都用 Bash 的 `run_in_background` 起，输出写进任务文件，不要前台轮询。模拟器占 8080 / 9099，API 占 3001，**等 3001 进入 LISTENING 再开局**，否则开局请求会打空。

同时确认 `src/vscripts/api/api-client.local.ts` 的 `GetApiTarget()` 返回 `'local'`。

完成：`netstat -ano | grep -E ":(8080|9099|3001)\b.*LISTENING"` 三个端口都在。
