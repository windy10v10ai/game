using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Threading;
using System.Windows.Forms;

namespace Windy10v10AI.Launcher
{
    class Release
    {
        public string Version;
        public string Sha256;
        // The API that answered the version check, tried first for the download because the network is the same
        public string Api;
    }

    // Replaces the running exe with the latest release published on our API
    static class Updater
    {
        const string DirectApi = "https://api.windy10v10ai.com/api/launcher/";
        // Some networks in mainland China cannot reach our API directly, so they go through the same China proxy the game uses
        public const string RelayApi = "https://1491237865-7au6o0ylxt.ap-guangzhou.tencentscf.com/api/launcher/";
        public const string DownloadPage = "https://windy10v10ai.com/launch";
        const int DirectTimeout = 4000;
        // Covers a cold start of the proxy and the backend behind it
        const int RelayTimeout = 8000;
        const int DownloadTimeout = 60000;

        // Returns null when this build is already the latest or neither route answers
        public static Release FindNewer(string current)
        {
            foreach (var api in new[] { DirectApi, RelayApi })
            {
                try
                {
                    var json = Http.Json(api + "version", null, api == DirectApi ? DirectTimeout : RelayTimeout);
                    var version = Convert.ToString(json["version"]);
                    // Only newer, so a local build ahead of the published one never downgrades itself
                    if (new Version(version) <= new Version(current)) return null;
                    return new Release { Version = version, Sha256 = Convert.ToString(json["sha256"]), Api = api };
                }
                catch (Exception)
                {
                    // Blocked or offline: the next route gets a chance
                }
            }
            return null;
        }

        // Returns null when no route delivers a file matching the published hash
        public static byte[] Download(Release release)
        {
            var apis = new List<string> { release.Api };
            apis.Add(release.Api == DirectApi ? RelayApi : DirectApi);
            foreach (var api in apis)
            {
                try
                {
                    var exe = Http.Bytes(api + "download/" + release.Version, DownloadTimeout);
                    if (Sha256(exe) == release.Sha256) return exe;
                }
                catch (Exception)
                {
                }
            }
            return null;
        }

        // Windows lets a running exe be renamed but not overwritten, so the old file steps aside for the new one.
        // Returns true once the new build is running; on failure the original exe is back in place.
        public static bool Install(byte[] exe)
        {
            var path = Application.ExecutablePath;
            var old = path + ".old";
            var fresh = path + ".new";
            try
            {
                File.WriteAllBytes(fresh, exe);
                if (File.Exists(old)) File.Delete(old);
                File.Move(path, old);
            }
            catch (Exception)
            {
                TryDelete(fresh);
                return false;
            }

            try
            {
                File.Move(fresh, path);
                Process.Start(new ProcessStartInfo(path) { WorkingDirectory = Path.GetDirectoryName(path) });
                return true;
            }
            catch (Exception)
            {
                try
                {
                    if (File.Exists(path)) File.Delete(path);
                    File.Move(old, path);
                }
                catch (Exception)
                {
                }
                TryDelete(fresh);
                return false;
            }
        }

        // The previous build is usually still exiting when the new one starts, so the delete retries briefly;
        // whatever stays locked goes on a later start
        public static void RemoveOld()
        {
            var old = Application.ExecutablePath + ".old";
            if (!File.Exists(old)) return;
            new Thread(() =>
            {
                for (var i = 0; i < 10; i++)
                {
                    try
                    {
                        File.Delete(old);
                        return;
                    }
                    catch (Exception)
                    {
                        Thread.Sleep(500);
                    }
                }
            }) { IsBackground = true }.Start();
        }

        static string Sha256(byte[] data)
        {
            using (var sha = SHA256.Create())
            {
                return BitConverter.ToString(sha.ComputeHash(data)).Replace("-", "").ToLowerInvariant();
            }
        }

        static void TryDelete(string path)
        {
            try
            {
                if (File.Exists(path)) File.Delete(path);
            }
            catch (Exception)
            {
            }
        }
    }
}
