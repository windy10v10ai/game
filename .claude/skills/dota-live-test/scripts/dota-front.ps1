# Bring the Dota 2 game window to the foreground so the engine renders fresh frames.
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class DotaFront {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, IntPtr pid);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool f);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  public static IntPtr Find(uint target) {
    IntPtr found = IntPtr.Zero;
    EnumWindows((h, l) => {
      uint pid; GetWindowThreadProcessId(h, out pid);
      var sb = new StringBuilder(64); GetWindowText(h, sb, 64);
      if (pid == target && sb.ToString() == "Dota 2") { found = h; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }
}
"@
$h = [DotaFront]::Find([uint32](Get-Process dota2).Id)
if ($h -eq [IntPtr]::Zero) { "Dota 2 window not found"; exit 1 }
$fg = [DotaFront]::GetWindowThreadProcessId([DotaFront]::GetForegroundWindow(), [IntPtr]::Zero)
$me = [DotaFront]::GetCurrentThreadId()
[DotaFront]::AttachThreadInput($me, $fg, $true) | Out-Null
[DotaFront]::ShowWindow($h, 9) | Out-Null
[DotaFront]::BringWindowToTop($h) | Out-Null
[DotaFront]::SetForegroundWindow($h) | Out-Null
[DotaFront]::AttachThreadInput($me, $fg, $false) | Out-Null
Start-Sleep -Milliseconds 500
"foreground is dota: " + ([DotaFront]::GetForegroundWindow() -eq $h)
