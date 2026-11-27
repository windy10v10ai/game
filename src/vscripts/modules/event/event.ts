import { EventDotaBuyback } from './event-buyback';
import { EventEntityKilled } from './event-entity-killed';
import { EventGameStateChange } from './event-game-state-change';
import { EventNpcSpawned } from './event-npc-spawned';
import { EventPlayerDisconnect } from './event-player-disconnect';
import { EventPlayerLevelUp } from './event-player-level-up';
import { EventTreasureBottle } from './event-treasure-bottle';

export class Event {
  EventNpcSpawned: EventNpcSpawned = new EventNpcSpawned();
  EventEntityKilled: EventEntityKilled = new EventEntityKilled();
  EventGameStateChange: EventGameStateChange = new EventGameStateChange();
  EventPlayerLevelUp: EventPlayerLevelUp = new EventPlayerLevelUp();
  EventDotaBuyback: EventDotaBuyback = new EventDotaBuyback();
  EventPlayerDisconnect: EventPlayerDisconnect = new EventPlayerDisconnect();
  EventTreasureBottle: EventTreasureBottle = new EventTreasureBottle();
}
