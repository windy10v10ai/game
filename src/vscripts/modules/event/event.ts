import { LoadingSetOptions } from './custom/loading-set-options';
import { EventDotaBuyback } from './event-buyback';
import { EventEntityKilled } from './event-entity-killed';
import { EventGameStateChange } from './event-game-state-change';
import { EventNpcSpawned } from './event-npc-spawned';
import { EventPlayerLevelUp } from './event-player-level-up';

export class Event {
  EventNpcSpawned: EventNpcSpawned = new EventNpcSpawned();
  EventEntityKilled: EventEntityKilled = new EventEntityKilled();
  EventGameStateChange: EventGameStateChange = new EventGameStateChange();
  EventPlayerLevelUp: EventPlayerLevelUp = new EventPlayerLevelUp();
  EventDotaBuyback: EventDotaBuyback = new EventDotaBuyback();

  // register custom event
  loadingSetOptions: LoadingSetOptions = new LoadingSetOptions();
}
