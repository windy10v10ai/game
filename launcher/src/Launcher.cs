// Windy10v10AI local dedicated server launcher.
// Built with the .NET Framework 4 compiler that ships with Windows, so the language level is C# 5.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("Windy10v10AI")]
[assembly: System.Reflection.AssemblyVersion("0.3.1.0")]

namespace Windy10v10AI.Launcher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Updater.RemoveOld();
            Application.Run(new MainForm());
        }
    }

    class LaunchError : Exception
    {
        public readonly bool ShowLog;

        public LaunchError(string message, bool showLog) : base(message)
        {
            ShowLog = showLog;
        }
    }

    class MainForm : Form
    {
        const string Version = "0.3.1";
        const string ReleaseId = "2307479570";
        const string TestId = "2636824668";
        const int Port = 27015;
        const int SlowSeconds = 60;
        const int TimeoutSeconds = 180;

        static readonly string[] MapKeys = { "dota", "hard", "custom" };

        readonly float scale;
        readonly PictureBox banner = new PictureBox();
        readonly Label subtitle = new Label();
        readonly Label version = new Label();
        readonly NoticeBar notice = new NoticeBar();
        readonly ModeButton[] modes = { new ModeButton(), new ModeButton(), new ModeButton() };
        readonly Label status = new Label();
        readonly MarqueeBar marquee = new MarqueeBar();
        readonly Label hint = new Label();
        readonly FlatButton action = new FlatButton();
        readonly Panel divider = new Panel();
        readonly Panel mapDot = new Panel();
        readonly Label mapLabel = new Label();
        readonly LinkLabel devLink = new LinkLabel();
        readonly ToggleBox testBox = new ToggleBox();

        readonly System.Windows.Forms.Timer mapPoll = new System.Windows.Forms.Timer { Interval = 5000 };
        Process server;
        Action noticeAction;
        // Launch failures stay on screen until the player acts; map checks may replace any other notice
        bool stickyNotice;
        string logFile;
        Release update;
        volatile bool stopping;
        bool busy;

        public MainForm()
        {
            scale = Theme.Dpi / 96f;
            Text = Strings.Title;
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            AutoScaleMode = AutoScaleMode.None;
            BackColor = Theme.Background;
            ForeColor = Theme.Text;
            Font = new Font(Theme.FontName, 9f);

            banner.SizeMode = PictureBoxSizeMode.Zoom;
            banner.BackColor = Color.Black;
            using (var stream = typeof(MainForm).Assembly.GetManifestResourceStream("banner.jpg"))
            {
                banner.Image = Image.FromStream(stream);
            }

            subtitle.Text = Strings.Subtitle;
            subtitle.Font = new Font(Theme.FontName, 9.75f);
            subtitle.AutoEllipsis = true;
            version.Text = "v" + Version;
            version.ForeColor = Theme.Muted;
            version.Font = new Font(Theme.FontName, 8.25f);
            version.TextAlign = ContentAlignment.MiddleRight;
            notice.Visible = false;
            notice.Action.Click += delegate { if (noticeAction != null) noticeAction(); };

            string[] titles = { Strings.Easy, Strings.Hard, Strings.Custom };
            string[] subs = { "N1 ~ N5", "N6 ~ N8", Strings.CustomSub };
            for (var i = 0; i < modes.Length; i++)
            {
                var index = i;
                modes[i].Title = titles[i];
                modes[i].Sub = subs[i];
                modes[i].ActiveSub = Strings.StartingSub;
                modes[i].Click += delegate { OnModeClick(index); };
            }

            status.Text = Strings.Idle;
            status.ForeColor = Theme.Muted;
            status.Font = new Font(Theme.FontName, 9f);
            hint.ForeColor = Theme.Muted;
            hint.Font = new Font(Theme.FontName, 9f);
            marquee.Visible = false;
            hint.Visible = false;
            action.Visible = false;
            action.Click += delegate { StopServer(); };

            divider.BackColor = Theme.Border;
            mapDot.BackColor = Theme.Faint;
            mapLabel.ForeColor = Theme.Muted;
            mapLabel.Font = new Font(Theme.FontName, 9f);
            mapLabel.TextAlign = ContentAlignment.MiddleLeft;

            devLink.Text = Strings.Developer;
            devLink.Font = new Font(Theme.FontName, 8.25f);
            devLink.LinkColor = Theme.Faint;
            devLink.ActiveLinkColor = Theme.Muted;
            devLink.LinkBehavior = LinkBehavior.HoverUnderline;
            devLink.TextAlign = ContentAlignment.MiddleRight;
            devLink.LinkClicked += delegate
            {
                testBox.Visible = !testBox.Visible;
            };

            testBox.Text = Strings.UseTestMap;
            testBox.Visible = false;
            testBox.CheckedChanged += delegate { RefreshMapState(); };
#if BETA
            // Closed beta builds start on the test map so testers need no extra step
            testBox.Visible = true;
            testBox.Checked = true;
#endif

            Controls.AddRange(new Control[] { banner, subtitle, version, notice, status, marquee, hint, action, divider, mapDot, mapLabel, devLink, testBox });
            Controls.AddRange(modes);

            RefreshMapState();
            Relayout();

            // Players often subscribe or wait for Steam while the launcher is open, so idle state keeps itself current
            mapPoll.Tick += delegate { RefreshIdleMapState(); };
            mapPoll.Start();
            Activated += delegate { RefreshIdleMapState(); };
            WorkshopLatest.Changed += delegate
            {
                if (IsHandleCreated && !IsDisposed) BeginInvoke((Action)RefreshIdleMapState);
            };
#if !BETA
            // Closed beta builds must not replace themselves with the public release
            Shown += delegate
            {
                new Thread(() =>
                {
                    var newer = Updater.FindNewer(Version);
                    if (newer != null) UI(() => { update = newer; RefreshIdleMapState(); });
                }) { IsBackground = true }.Start();
            };
#endif
        }

        void RefreshIdleMapState()
        {
            if (busy || (notice.Visible && stickyNotice)) return;
            RefreshMapState();
        }

        int P(float value)
        {
            return (int)Math.Round(value * scale);
        }

        void Relayout()
        {
            banner.SetBounds(0, 0, P(480), P(120));
            subtitle.SetBounds(P(20), P(132), P(370), P(22));
            version.SetBounds(P(390), P(132), P(70), P(22));
            var y = 162;
            for (var i = 0; i < modes.Length; i++) modes[i].SetBounds(P(20 + i * 150), P(y), P(140), P(84));
            y += 96;
            // Notices share the status area below the buttons so the window never shifts
            notice.SetBounds(P(20), P(y), P(440), P(52));
            status.Visible = !notice.Visible;
            status.SetBounds(P(20), P(y), P(440), P(20));
            marquee.SetBounds(P(20), P(y + 26), P(440), P(4));
            hint.SetBounds(P(20), P(y + 36), P(440), P(20));
            var actionWidth = Math.Max(P(80), TextRenderer.MeasureText(action.Text, action.Font).Width + P(28));
            action.SetBounds(P(20), P(y + 62), actionWidth, P(30));
            y += 104;
            divider.SetBounds(0, P(y), P(480), Math.Max(1, P(1)));
            mapDot.SetBounds(P(20), P(y + 16), P(8), P(8));
            mapLabel.SetBounds(P(34), P(y + 9), P(200), P(22));
            var devWidth = TextRenderer.MeasureText(devLink.Text, devLink.Font).Width + P(4);
            devLink.SetBounds(P(460) - devWidth, P(y + 9), devWidth, P(22));
            var testWidth = testBox.PreferredWidth + P(2);
            testBox.SetBounds(P(460) - devWidth - P(12) - testWidth, P(y + 9), testWidth, P(22));
            ClientSize = new Size(P(480), P(y + 40));
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            Theme.UseDarkTitleBar(Handle);
            var round = new System.Drawing.Drawing2D.GraphicsPath();
            round.AddEllipse(0, 0, P(8), P(8));
            mapDot.Region = new Region(round);
            Relayout();
        }

        string MapId
        {
            get { return testBox.Checked ? TestId : ReleaseId; }
        }

        MapState RefreshMapState()
        {
            DotaInstall install;
            var state = DotaInstall.Check(MapId, out install);
            switch (state)
            {
                case MapState.Ready:
                    SetFooter(Theme.Ok, Strings.MapReady);
                    ShowIdleNotice();
                    break;
                case MapState.Checking:
                    SetFooter(Theme.Faint, Strings.MapChecking);
                    ShowIdleNotice();
                    break;
                case MapState.Unverified:
                    SetFooter(Theme.Warning, Strings.MapUnverified);
                    ShowIdleNotice();
                    break;
                case MapState.Outdated:
                    SetFooter(Theme.Warning, Strings.MapOutdated);
                    ShowNotice(NoticeKind.Warning, Strings.OutdatedNotice, false);
                    break;
                case MapState.Missing:
                    SetFooter(Theme.Error, Strings.MapMissing);
                    var id = MapId;
                    ShowNotice(NoticeKind.Error, Strings.NoMap, Strings.Subscribe, () => OpenUrl("steam://url/CommunityFilePage/" + id));
                    break;
                case MapState.NoDota:
                    SetFooter(Theme.Error, Strings.MapUnknown);
                    ShowNotice(NoticeKind.Error, Strings.NoDota, false);
                    break;
                default:
                    SetFooter(Theme.Error, Strings.MapUnknown);
                    ShowNotice(NoticeKind.Error, Strings.NoSteam, false);
                    break;
            }
            return state;
        }

        void SetFooter(Color dot, string text)
        {
            mapDot.BackColor = dot;
            mapLabel.Text = text;
        }

        void ShowNotice(NoticeKind kind, string text, bool withLog)
        {
            if (withLog) ShowNotice(kind, text, Strings.OpenLog, RevealLog);
            else ShowNotice(kind, text, null, null);
            stickyNotice = withLog;
        }

        void ShowNotice(NoticeKind kind, string text, string button, Action onClick)
        {
            noticeAction = onClick;
            stickyNotice = false;
            var wasVisible = notice.Visible;
            notice.Show(kind, text, button);
            if (!wasVisible) Relayout();
        }

        // Map problems keep the notice area; otherwise it offers a pending update
        void ShowIdleNotice()
        {
            if (update == null) HideNotice();
            else ShowNotice(NoticeKind.Warning, string.Format(Strings.UpdateAvailable, update.Version), Strings.Update, StartUpdate);
        }

        void StartUpdate()
        {
            if (busy) return;
            busy = true;
            var release = update;
            ShowNotice(NoticeKind.Warning, Strings.Updating, null, null);
            new Thread(() =>
            {
                var exe = Updater.Download(release);
                if (exe != null && Updater.Install(exe))
                {
                    UI(Close);
                    return;
                }
                UI(() =>
                {
                    busy = false;
                    ShowNotice(NoticeKind.Error, Strings.UpdateFailed, Strings.OpenDownloadPage, () => OpenUrl(Updater.DownloadPage));
                    stickyNotice = true;
                });
            }) { IsBackground = true }.Start();
        }

        void HideNotice()
        {
            if (!notice.Visible) return;
            notice.Visible = false;
            Relayout();
        }

        void OnModeClick(int index)
        {
            if (busy) return;
            var state = RefreshMapState();
            // An outdated map only warns, so an unfinished or failed version check does not block starting either
            if (state == MapState.NoSteam || state == MapState.NoDota || state == MapState.Missing) return;

            if (DotaProcesses().Count > 0 &&
                !ConfirmDialog.Ask(this, Strings.DotaRunningTitle, Strings.DotaRunningBody, Strings.CloseAndStart))
            {
                return;
            }

            DotaInstall install;
            DotaInstall.Check(MapId, out install);
            var id = MapId;
            var map = MapKeys[index];
            busy = true;
            stopping = false;
            for (var i = 0; i < modes.Length; i++)
            {
                modes[i].Active = i == index;
                modes[i].ActiveSub = Strings.StartingSub;
                modes[i].Dimmed = i != index;
                modes[i].Invalidate();
            }
            testBox.Enabled = false;
            testBox.Invalidate();
            ShowProgress(Strings.Starting, Strings.StartingHint, Strings.Cancel, true);
            new Thread(() => Run(install, id, map)) { IsBackground = true }.Start();
        }

        void Run(DotaInstall install, string id, string map)
        {
            try
            {
                var running = DotaProcesses();
                if (running.Count > 0)
                {
                    UI(() => status.Text = Strings.ClosingDota);
                    foreach (var p in running) KillQuietly(p);
                    foreach (var p in running) p.WaitForExit(15000);
                    UI(() => status.Text = Strings.Starting);
                }

                if (stopping) throw new OperationCanceledException();
                LinkAddon(Path.Combine(install.Game, @"dota_addons\" + id), install.Vpk(id));

                logFile = Path.Combine(install.Game, @"dota\dedicated.log");
                if (File.Exists(logFile)) File.Delete(logFile);

                server = Process.Start(new ProcessStartInfo
                {
                    FileName = install.Exe,
                    WorkingDirectory = install.Game,
                    Arguments = "-dedicated -console -allow_no_lobby_connect -ip 127.0.0.1 -port " + Port +
                        " -con_logfile dedicated.log +sv_hibernate_when_empty 0 +dota_quit_after_game 0" +
                        " \"+map " + map + " gamemode=15 customgamemode=" + id + " nomapvalidation=1\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden,
                });

                WaitForMap(map);

                // Launching the exe directly avoids Steam's confirmation dialog for custom launch arguments
                Process.Start(new ProcessStartInfo
                {
                    FileName = install.Exe,
                    WorkingDirectory = install.Game,
                    Arguments = "-novid +connect 127.0.0.1:" + Port,
                    UseShellExecute = false,
                });

                UI(() =>
                {
                    foreach (var mode in modes)
                    {
                        mode.ActiveSub = Strings.InGame;
                        mode.Invalidate();
                    }
                    ShowProgress(Strings.InGame, Strings.InGameHint, Strings.StopServer, false);
                });
                WatchClient();
            }
            catch (LaunchError error)
            {
                Finish(error.Message, error.ShowLog);
            }
            catch (Exception error)
            {
                Finish(Strings.LaunchFailed + error.Message, logFile != null);
            }
        }

        static void LinkAddon(string addonDir, string vpk)
        {
            // The engine only mounts addons from game\dota_addons; relinking every run picks up Workshop updates
            Directory.CreateDirectory(addonDir);
            var target = Path.Combine(addonDir, "pak01_dir.vpk");
            if (File.Exists(target)) File.Delete(target);
            if (!NativeMethods.CreateHardLink(target, vpk, IntPtr.Zero)) File.Copy(vpk, target);
        }

        void WaitForMap(string map)
        {
            var ready = "Host activate: Loading (" + map + ")";
            var started = DateTime.Now;
            var slowShown = false;
            while (true)
            {
                if (stopping) throw new OperationCanceledException();
                if (server.HasExited) throw new LaunchError(Strings.ServerExited, true);
                NativeMethods.HideWindowsOf(server.Id);
                if (ReadShared(logFile).Contains(ready))
                {
                    NativeMethods.HideWindowsOf(server.Id);
                    return;
                }
                var waited = (DateTime.Now - started).TotalSeconds;
                if (waited > TimeoutSeconds) throw new LaunchError(Strings.Timeout, true);
                if (waited > SlowSeconds && !slowShown)
                {
                    slowShown = true;
                    UI(() => hint.Text = Strings.SlowHint);
                }
                Thread.Sleep(1000);
            }
        }

        void WatchClient()
        {
            var seen = false;
            var serverId = server.Id;
            while (!stopping)
            {
                Thread.Sleep(3000);
                if (server.HasExited) throw new LaunchError(Strings.ServerExited, true);
                NativeMethods.HideWindowsOf(serverId);
                var clients = DotaProcesses().FindAll(p => p.Id != serverId).Count;
                if (clients > 0) seen = true;
                else if (seen) break;
            }
            Finish(null, false);
        }

        void StopServer()
        {
            stopping = true;
            var s = server;
            if (s != null) KillQuietly(s);
        }

        // Runs on the worker thread when a launch ends for any reason, and returns the window to its idle state
        void Finish(string error, bool showLog)
        {
            var cancelled = stopping;
            stopping = true;
            var s = server;
            if (s != null) KillQuietly(s);
            server = null;
            UI(() =>
            {
                busy = false;
                foreach (var mode in modes)
                {
                    mode.Active = false;
                    mode.Dimmed = false;
                    mode.Invalidate();
                }
                testBox.Enabled = true;
                testBox.Invalidate();
                marquee.Visible = false;
                hint.Visible = false;
                action.Visible = false;
                status.Text = Strings.Idle;
                status.ForeColor = Theme.Muted;
                if (error != null && !cancelled) ShowNotice(NoticeKind.Error, error, showLog && logFile != null && File.Exists(logFile));
                else RefreshMapState();
            });
        }

        void ShowProgress(string title, string detail, string button, bool animate)
        {
            status.Text = title;
            status.ForeColor = Theme.Text;
            hint.Text = detail;
            hint.Visible = true;
            marquee.Visible = animate;
            action.Text = button;
            action.Visible = true;
            notice.Visible = false;
            Relayout();
        }

        void UI(Action work)
        {
            if (IsDisposed) return;
            try
            {
                BeginInvoke(work);
            }
            catch (InvalidOperationException)
            {
                // The window closed while a launch was still finishing
            }
        }

        static void OpenUrl(string url)
        {
            try
            {
                Process.Start(url);
            }
            catch (Exception)
            {
            }
        }

        void RevealLog()
        {
            if (logFile == null || !File.Exists(logFile)) return;
            try
            {
                Process.Start("explorer.exe", "/select,\"" + logFile + "\"");
            }
            catch (Exception)
            {
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            var s = server;
            if (s != null && !s.HasExited)
            {
                if (!ConfirmDialog.Ask(this, Strings.QuitTitle, Strings.QuitBody, Strings.Close))
                {
                    e.Cancel = true;
                    return;
                }
                stopping = true;
                KillQuietly(s);
            }
            base.OnFormClosing(e);
        }

        static List<Process> DotaProcesses()
        {
            return new List<Process>(Process.GetProcessesByName("dota2"));
        }

        static void KillQuietly(Process process)
        {
            try
            {
                if (!process.HasExited) process.Kill();
            }
            catch (Exception)
            {
                // Already gone or not ours to kill; nothing else to do
            }
        }

        static string ReadShared(string path)
        {
            if (!File.Exists(path)) return "";
            // The server keeps the log open for writing
            using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
            using (var reader = new StreamReader(stream))
            {
                return reader.ReadToEnd();
            }
        }
    }

    static class NativeMethods
    {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern bool CreateHardLink(string fileName, string existingFileName, IntPtr securityAttributes);

        delegate bool EnumWindowsProc(IntPtr hwnd, IntPtr param);

        [DllImport("user32.dll")]
        static extern bool EnumWindows(EnumWindowsProc callback, IntPtr param);

        [DllImport("user32.dll")]
        static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);

        [DllImport("user32.dll")]
        static extern bool IsWindowVisible(IntPtr hwnd);

        [DllImport("user32.dll")]
        static extern bool ShowWindow(IntPtr hwnd, int command);

        // The dedicated server opens its own console window regardless of how the process is started
        public static void HideWindowsOf(int pid)
        {
            EnumWindows((hwnd, param) =>
            {
                uint owner;
                GetWindowThreadProcessId(hwnd, out owner);
                if (owner == pid && IsWindowVisible(hwnd)) ShowWindow(hwnd, 0);
                return true;
            }, IntPtr.Zero);
        }
    }
}
