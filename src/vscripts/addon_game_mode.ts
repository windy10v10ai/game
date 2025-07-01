import 'utils/index';
import './ai_game_mode.d';
import { ActivateModules } from './modules';
import './utils/lifesteal';
import Precache from './utils/precache';

Object.assign(getfenv(), {
  Activate: () => {
    ActivateModules();
    AIGameMode.InitGameMode();
  },
  Precache: Precache,
});
