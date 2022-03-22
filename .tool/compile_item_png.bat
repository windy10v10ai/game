@echo off
set compiler=D:\Steam\steamapps\common\dota 2 beta\game\bin\win64\resourcecompiler.exe
"%compiler%" -r "D:\Steam\steamapps\common\dota 2 beta\content\dota_addons\Windy10v10AI\panorama\images\items\*.*"
"%compiler%" -r "D:\Steam\steamapps\common\dota 2 beta\content\dota_addons\Windy10v10AI\panorama\images\custom_game\*.*"
"%compiler%" -r "D:\Steam\steamapps\common\dota 2 beta\content\dota_addons\Windy10v10AI\panorama\images\heroes\*.*"
"%compiler%" -r "D:\Steam\steamapps\common\dota 2 beta\content\dota_addons\Windy10v10AI\soundevents\*.*"
"%compiler%" -r "D:\Steam\steamapps\common\dota 2 beta\content\dota_addons\Windy10v10AI\materials\vgui\hud\*.*"
set /p DUMMY=Hit ENTER to exit.
