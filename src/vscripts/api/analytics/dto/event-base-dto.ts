import { ApiProperty } from '@nestjs/swagger';

export class EventBaseDto {
  @ApiProperty()
  matchId: string;
  @ApiProperty({ default: 'v4.00' })
  version: string;
  @ApiProperty({ default: 0 })
  difficulty: number;
  @ApiProperty()
  steamId: number;
}
