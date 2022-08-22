@echo off
set compiler=C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\game\bin\win64\resourcecompiler.exe
"%compiler%" -r "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\content\dota_addons\Windy10v10AI\panorama\images\items\*.*"
"%compiler%" -r "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\content\dota_addons\Windy10v10AI\panorama\images\custom_game\*.*"
"%compiler%" -r "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\content\dota_addons\Windy10v10AI\panorama\images\heroes\*.*"
"%compiler%" -r "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\content\dota_addons\Windy10v10AI\soundevents\*.*"
set /p DUMMY=Hit ENTER to exit.
