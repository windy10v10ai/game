import { EventDotaBuyback } from './event-buyback';
import { EventEntityKilled } from './event-entity-killed';
import { EventGameStateChange } from './event-game-state-change';
import { EventNpcSpawned } from './event-npc-spawned';
import { EventPlayerLevelUp } from './event-player-level-up';
import { CreepBuffManager } from './game-in-progress/creep-buff-manager';

export class Event {
  EventNpcSpawned: EventNpcSpawned = new EventNpcSpawned();
  EventEntityKilled: EventEntityKilled = new EventEntityKilled();
  EventGameStateChange: EventGameStateChange = new EventGameStateChange();
  EventPlayerLevelUp: EventPlayerLevelUp = new EventPlayerLevelUp();
  EventDotaBuyback: EventDotaBuyback = new EventDotaBuyback();
  CreepBuffManager: CreepBuffManager = new CreepBuffManager();
}
