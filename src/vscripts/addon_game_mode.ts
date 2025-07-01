import 'utils/index';
// import './ai_game_mode';
import { ActivateModules } from './modules';
import './utils/lifesteal';
import Precache from './utils/precache';

Object.assign(getfenv(), {
  Activate: () => {
    // 确保 ai_game_mode.lua 被加载
    if (AIGameMode == null) {
      dofile('ai_game_mode');
    }
    ActivateModules();
    AIGameMode.InitGameMode();
  },
  Precache: Precache,
});
