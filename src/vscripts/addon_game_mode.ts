import "utils/index";
import "./ai_game_mode";
import { ActivateModules } from "./modules";
import Precache from "./utils/precache";

Object.assign(getfenv(), {
  Activate: () => {
    ActivateModules();
    AIGameMode.InitGameMode();
  },
  Precache: Precache,
});
