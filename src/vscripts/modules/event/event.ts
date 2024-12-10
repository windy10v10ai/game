import { LoadingSetOptions } from './custom/loading-set-options';
import { EventDotaBuyback } from './event-buyback';
import { EventEntityKilled } from './event-entity-killed';
import { EventGameStateChange } from './event-game-state-change';
import { EventNpcSpawned } from './event-npc-spawned';
import { EventPlayerLevelUp } from './event-player-level-up';

export class Event {
  EventNpcSpawned: EventNpcSpawned;
  EventEntityKilled: EventEntityKilled;
  EventGameStateChange: EventGameStateChange;
  EventPlayerLevelUp: EventPlayerLevelUp;
  EventDotaBuyback: EventDotaBuyback = new EventDotaBuyback();

  // register custom event
  loadingSetOptions: LoadingSetOptions;
  constructor() {
    this.EventNpcSpawned = new EventNpcSpawned();
    this.EventEntityKilled = new EventEntityKilled();
    this.EventGameStateChange = new EventGameStateChange();
    this.EventPlayerLevelUp = new EventPlayerLevelUp();

    this.loadingSetOptions = new LoadingSetOptions();
  }
}
