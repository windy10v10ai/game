import { MemberDto, PlayerDto, PointInfoDto } from "../api/player";

declare global {
  interface CustomNetTableDeclarations {
    loading_status: {
      loading_status: { status: number };
    };
    ending_status: {
      ending_status: { status: number };
    };
    member_table: {
      [steamId: string]: MemberDto;
    };
    player_table: {
      [steamId: string]: PlayerDto;
    };
    leader_board: {
      top100SteamIds: string[];
    };
    point_info: {
      [steamId: string]: PointInfoDto[];
    };
    game_difficulty: {
      all: { difficulty: number };
    };
  }
}
