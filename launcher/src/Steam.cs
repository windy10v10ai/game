using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using Microsoft.Win32;

namespace Windy10v10AI.Launcher
{
    enum MapState { NoSteam, NoDota, Missing, Checking, Unverified, Outdated, Ready }

    class DotaInstall
    {
        const string DotaExe = @"steamapps\common\dota 2 beta\game\bin\win64\dota2.exe";

        public readonly string Library;

        DotaInstall(string library)
        {
            Library = library;
        }

        public string Game { get { return Path.Combine(Library, @"steamapps\common\dota 2 beta\game"); } }
        public string Exe { get { return Path.Combine(Game, @"bin\win64\dota2.exe"); } }

        public string Vpk(string id)
        {
            return Path.Combine(Library, @"steamapps\workshop\content\570\" + id + @"\" + id + ".vpk");
        }

        public static string SteamPath()
        {
            var steam = Registry.GetValue(@"HKEY_CURRENT_USER\Software\Valve\Steam", "SteamPath", null) as string;
            return steam == null ? null : steam.Replace('/', '\\');
        }

        // Dota may live in any Steam library, so every library listed by Steam is checked
        public static DotaInstall Find()
        {
            var steam = SteamPath();
            if (steam == null) return null;
            if (File.Exists(Path.Combine(steam, DotaExe))) return new DotaInstall(steam);

            var vdf = Path.Combine(steam, @"steamapps\libraryfolders.vdf");
            if (!File.Exists(vdf)) return null;
            foreach (Match match in Regex.Matches(File.ReadAllText(vdf), "\"path\"\\s+\"([^\"]+)\""))
            {
                var library = match.Groups[1].Value.Replace(@"\\", @"\");
                if (File.Exists(Path.Combine(library, DotaExe))) return new DotaInstall(library);
            }
            return null;
        }

        public static MapState Check(string id, out DotaInstall install)
        {
            install = null;
            if (SteamPath() == null) return MapState.NoSteam;
            install = Find();
            if (install == null) return MapState.NoDota;
            if (!File.Exists(install.Vpk(id))) return MapState.Missing;
            bool checking;
            var published = WorkshopLatest.Manifest(id, out checking);
            if (published != null) return install.IsOutdated(id, published) ? MapState.Outdated : MapState.Ready;
            if (checking) return MapState.Checking;
            // Steam's own latest_timeupdated can stay stale for days, so it can prove an update exists but never
            // that the map is current
            return install.HasKnownUpdate(id) ? MapState.Outdated : MapState.Unverified;
        }

        bool IsOutdated(string id, string published)
        {
            foreach (var block in AcfBlocks(id))
            {
                var manifest = ReadValue(block, "manifest");
                if (manifest != null && manifest != published) return true;
            }
            return false;
        }

        bool HasKnownUpdate(string id)
        {
            long installed = 0, latest = 0;
            foreach (var block in AcfBlocks(id))
            {
                installed = Math.Max(installed, ReadLong(block, "timeupdated"));
                latest = Math.Max(latest, ReadLong(block, "latest_timeupdated"));
            }
            return latest > installed;
        }

        // Steam keeps one block per Workshop item for the installed build and another for its details
        List<string> AcfBlocks(string id)
        {
            var blocks = new List<string>();
            try
            {
                var acf = Path.Combine(Library, @"steamapps\workshop\appworkshop_570.acf");
                if (!File.Exists(acf)) return blocks;
                var pattern = "\"" + id + "\"\\s*\\{([^}]*)\\}";
                foreach (Match block in Regex.Matches(File.ReadAllText(acf), pattern)) blocks.Add(block.Groups[1].Value);
            }
            catch (Exception)
            {
                // Steam may be rewriting the file; the next check reads it again
            }
            return blocks;
        }

        static string ReadValue(string block, string key)
        {
            var match = Regex.Match(block, "\"" + key + "\"\\s+\"(\\d+)\"");
            return match.Success ? match.Groups[1].Value : null;
        }

        static long ReadLong(string block, string key)
        {
            var value = ReadValue(block, key);
            return value == null ? 0 : long.Parse(value);
        }
    }

    // Looks up the manifest of the currently published build. Requests run in the background and results are cached,
    // because map checks run on the UI thread every few seconds.
    static class WorkshopLatest
    {
        const string SteamUrl = "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/";
        // Some networks in mainland China cannot reach Steam's API, so our backend asks Steam on their behalf
        const string RelayUrl = Updater.RelayApi + "workshop/";
        const int SteamTimeout = 4000;
        // Covers a cold start of the proxy and the backend behind it
        const int RelayTimeout = 8000;
        static readonly TimeSpan RefreshAfter = TimeSpan.FromMinutes(30);
        static readonly TimeSpan RetryAfter = TimeSpan.FromMinutes(5);

        static readonly object sync = new object();
        static readonly Dictionary<string, string> manifests = new Dictionary<string, string>();
        static readonly Dictionary<string, DateTime> attempts = new Dictionary<string, DateTime>();
        static readonly HashSet<string> pending = new HashSet<string>();

        // Raised on a background thread when a request finishes, successfully or not
        public static event Action Changed;

        // Returns null until a request succeeds; checking is true while the first answer is still on its way.
        // Each call may start a refresh in the background.
        public static string Manifest(string id, out bool checking)
        {
            lock (sync)
            {
                string manifest;
                var known = manifests.TryGetValue(id, out manifest);
                DateTime last;
                if (!pending.Contains(id) &&
                    (!attempts.TryGetValue(id, out last) || DateTime.UtcNow - last > (known ? RefreshAfter : RetryAfter)))
                {
                    attempts[id] = DateTime.UtcNow;
                    pending.Add(id);
                    new Thread(() => Fetch(id)) { IsBackground = true }.Start();
                }
                checking = !known && pending.Contains(id);
                return known ? manifest : null;
            }
        }

        static void Fetch(string id)
        {
            var manifest = FromSteam(id) ?? FromRelay(id);
            lock (sync)
            {
                if (manifest != null) manifests[id] = manifest;
                pending.Remove(id);
            }
            var changed = Changed;
            if (changed != null) changed();
        }

        static string FromSteam(string id)
        {
            try
            {
                var root = Http.Json(SteamUrl, "itemcount=1&publishedfileids%5B0%5D=" + id, SteamTimeout);
                var details = (object[])((Dictionary<string, object>)root["response"])["publishedfiledetails"];
                foreach (Dictionary<string, object> item in details)
                {
                    object manifest;
                    if (Convert.ToString(item["publishedfileid"]) == id && item.TryGetValue("hcontent_file", out manifest))
                    {
                        return Convert.ToString(manifest);
                    }
                }
            }
            catch (Exception)
            {
                // Blocked or offline: the relay gets a chance next
            }
            return null;
        }

        static string FromRelay(string id)
        {
            try
            {
                object manifest;
                return Http.Json(RelayUrl + id, null, RelayTimeout).TryGetValue("manifest", out manifest)
                    ? Convert.ToString(manifest)
                    : null;
            }
            catch (Exception)
            {
                // Both sources failed: RetryAfter schedules the next attempt
                return null;
            }
        }
    }
}
