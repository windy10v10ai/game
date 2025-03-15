import { EventBaseDto } from './event-base-dto';

export class PickDto extends EventBaseDto {
  name: string;

  type: string;

  level: number;
}
