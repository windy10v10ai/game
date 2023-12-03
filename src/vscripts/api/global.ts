import { MemberDto, PlayerDto, PointInfoDto } from "./player";

declare global {
    interface CustomNetTableDeclarations {
        loading_status: {
            loading_status: any;
        };
        ending_status: {
            ending_status: any;
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
    }
    function TsPrint(...args: any[]): void;
}

