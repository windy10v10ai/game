const { spawn } = require("child_process");
const path = require("path");
const { getAddonName, getDotaPath } = require("./utils");

(async () => {
  const dotaPath = await getDotaPath();
  const win64 = path.join(dotaPath, "game", "bin", "win64");

  // You can add any arguments there
  // For example `+dota_launch_custom_game ${getAddonName()} dota` would automatically load "dota" map
  const args = [
    "-novid",
    "-tools",
    "-addon",
    getAddonName(),
    "+dota_launch_custom_game",
    getAddonName(),
    "dota",
  ];

  const child = spawn(path.join(win64, "dota2.exe"), args, {
    detached: true,
    cwd: win64,
    stdio: "ignore", // 忽略子进程的输出
  });
  child.unref(); // 使父进程不等待子进程退出
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
