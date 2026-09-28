using System.Globalization;

namespace Windy10v10AI.Launcher
{
    static class Strings
    {
        static readonly string Lang = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;

        static string Pick(string zh, string en, string ru)
        {
            if (Lang == "zh") return zh;
            if (Lang == "ru" || Lang == "uk" || Lang == "be" || Lang == "kk") return ru;
            return en;
        }

        public static string Title { get { return Pick("Windy10v10AI 启动器", "Windy10v10AI Launcher", "Windy10v10AI Лаунчер"); } }
        public static string Subtitle { get { return Pick("本地启动服务器，性能优化", "Local server for better performance", "Локальный сервер для лучшей производительности"); } }

        public static string Easy { get { return Pick("简单", "Easy", "Лёгкий"); } }
        public static string Hard { get { return Pick("困难", "Hard", "Сложный"); } }
        public static string Custom { get { return Pick("自定义", "Custom", "Свой"); } }
        public static string CustomSub { get { return Pick("自定义难度", "Custom difficulty", "Своя сложность"); } }

        public static string Idle { get { return Pick("点击难度即可开始游戏", "Click a difficulty to start", "Выберите сложность, чтобы начать"); } }
        public static string Starting { get { return Pick("正在启动，请稍候…", "Starting, please wait...", "Запуск, подождите…"); } }
        public static string StartingSub { get { return Pick("启动中…", "Starting…", "Запуск…"); } }
        public static string StartingHint { get { return Pick("通常需要 30 秒到 1 分钟，完成后会自动打开 Dota 2", "Usually takes 30 seconds to a minute. Dota 2 opens when ready.", "Обычно это занимает до минуты. Dota 2 откроется автоматически."); } }
        public static string SlowHint { get { return Pick("比平时慢一些，仍在启动中…", "Taking longer than usual, still starting...", "Дольше обычного, запуск продолжается…"); } }
        public static string ClosingDota { get { return Pick("正在关闭 Dota 2…", "Closing Dota 2...", "Закрываем Dota 2…"); } }
        public static string InGame { get { return Pick("游戏中", "In game", "В игре"); } }
        public static string InGameHint { get { return Pick("关闭 Dota 2 后服务器会自动关闭", "The server stops when you close Dota 2", "Сервер остановится после закрытия Dota 2"); } }
        public static string Cancel { get { return Pick("取消", "Cancel", "Отмена"); } }
        public static string StopServer { get { return Pick("关闭服务器", "Stop server", "Остановить сервер"); } }

        public static string MapReady { get { return Pick("地图已是最新版本", "Map is up to date", "Карта обновлена"); } }
        public static string MapChecking { get { return Pick("正在检测地图版本", "Checking map version", "Проверка версии карты"); } }
        public static string MapUnverified { get { return Pick("无法确认地图是否最新", "Map version unconfirmed", "Версия карты не проверена"); } }
        public static string MapOutdated { get { return Pick("地图需要更新", "Map needs an update", "Карту нужно обновить"); } }
        public static string MapMissing { get { return Pick("没有找到地图", "Map not found", "Карта не найдена"); } }
        public static string MapUnknown { get { return Pick("没有找到 Dota 2", "Dota 2 not found", "Dota 2 не найдена"); } }

        public static string OutdatedNotice { get { return Pick("地图不是最新版本，需要更新。请在 Steam 里等待下载完成（期间不要打开 Dota 2），或打开 Dota 2 手动更新地图后再启动。", "The map is out of date. Wait for Steam to finish downloading it (keep Dota 2 closed), or open Dota 2 and update the map, then start again.", "Карта устарела. Дождитесь загрузки в Steam (не открывая Dota 2) или откройте Dota 2 и обновите карту, затем запустите снова."); } }
        public static string NoSteam { get { return Pick("没有找到 Steam，请先安装 Steam 和 Dota 2。", "Steam was not found. Install Steam and Dota 2 first.", "Steam не найден. Сначала установите Steam и Dota 2."); } }
        public static string NoDota { get { return Pick("没有找到 Dota 2，请先在 Steam 安装。", "Dota 2 was not found. Install it in Steam first.", "Dota 2 не найдена. Сначала установите её в Steam."); } }
        public static string NoMap { get { return Pick("没有找到地图，请先订阅 10v10 AI，等待 Steam 下载完成。", "Map not found. Subscribe to 10v10 AI and wait for Steam to download it.", "Карта не найдена. Подпишитесь на 10v10 AI и дождитесь загрузки в Steam."); } }
        public static string Timeout { get { return Pick("启动失败：服务器没有按时启动完成。请再试一次；多次失败请把日志发给我们。", "Launch failed: the server did not start in time. Try again; if it keeps failing, send us the log.", "Сервер не запустился вовремя. Попробуйте ещё раз; если ошибка повторяется, отправьте нам лог."); } }
        public static string ServerExited { get { return Pick("服务器意外退出。请再试一次；多次失败请把日志发给我们。", "The server stopped unexpectedly. Try again; if it keeps failing, send us the log.", "Сервер неожиданно остановился. Попробуйте ещё раз; если ошибка повторяется, отправьте нам лог."); } }
        public static string LaunchFailed { get { return Pick("启动失败：", "Launch failed: ", "Не удалось запустить: "); } }
        public static string Subscribe { get { return Pick("订阅地图", "Subscribe", "Подписаться"); } }
        public static string OpenLog { get { return Pick("打开日志", "Open log", "Открыть лог"); } }

        public static string UpdateAvailable { get { return Pick("发现新版本 v{0}，更新后启动器会自动重启。", "Version {0} is available. The launcher restarts after updating.", "Доступна версия {0}. Лаунчер перезапустится после обновления."); } }
        public static string Update { get { return Pick("更新", "Update", "Обновить"); } }
        public static string Updating { get { return Pick("正在下载新版本…", "Downloading the new version...", "Загрузка новой версии…"); } }
        public static string UpdateFailed { get { return Pick("自动更新失败，请到官网下载新版本。", "Update failed. Download the new version from our website.", "Не удалось обновить. Скачайте новую версию на сайте."); } }
        public static string OpenDownloadPage { get { return Pick("打开官网", "Open website", "Открыть сайт"); } }

        public static string Developer { get { return Pick("开发选项", "Developer", "Для разработчиков"); } }
        public static string UseTestMap { get { return Pick("使用测试服", "Use test map", "Тестовая карта"); } }

        public static string DotaRunningTitle { get { return Pick("Dota 2 正在运行", "Dota 2 is running", "Dota 2 запущена"); } }
        public static string DotaRunningBody { get { return Pick("需要先关闭 Dota 2，再用本地服务器重新启动。正在进行的对局会断开。", "Dota 2 will be closed and restarted with the local server. Any match in progress will be disconnected.", "Dota 2 будет закрыта и перезапущена с локальным сервером. Текущий матч будет прерван."); } }
        public static string CloseAndStart { get { return Pick("关闭并启动", "Close and start", "Закрыть и запустить"); } }
        public static string QuitTitle { get { return Pick("关闭启动器", "Close launcher", "Закрыть лаунчер"); } }
        public static string QuitBody { get { return Pick("关闭启动器会同时关闭服务器，正在进行的游戏会断开。", "Closing the launcher also stops the server and ends the current game.", "Закрытие лаунчера остановит сервер и прервёт текущую игру."); } }
        public static string Close { get { return Pick("关闭", "Close", "Закрыть"); } }
    }
}
