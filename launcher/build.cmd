@echo off
rem Uses the C# compiler bundled with the .NET Framework that every Windows 10/11 machine has
rem "build.cmd beta" builds the closed beta variant that starts on the test map
setlocal
cd /d "%~dp0"
set "OUT=dist"
set "DEFINE="
if /i "%~1"=="beta" (
  set "OUT=dist\beta"
  set "DEFINE=/define:BETA"
)
if not exist "%OUT%" mkdir "%OUT%"
"%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /optimize+ /target:winexe %DEFINE% /out:%OUT%\Windy10v10AI.exe /win32icon:assets\icon.ico /win32manifest:app.manifest /resource:assets\banner.jpg,banner.jpg /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Web.Extensions.dll src\*.cs
