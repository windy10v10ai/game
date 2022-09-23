
import { ApiClient } from "./api_client";

class MemberDto {
	steamId!: number;
	enable!: boolean;
	expireDateString!: string;
}


export class Member {
	private MemberList: MemberDto[] = [];
	constructor() {
		if (IsInToolsMode()) {
			// TODO add developer
		}
		print("[Member] constructor in TS");
	}

	public InitMemberInfo() {
		// get IsValidPlayer player's steamIds
		const steamIds = [];
		for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
			if (PlayerResource.IsValidPlayer(i)) {
				steamIds.push(PlayerResource.GetSteamAccountID(i));
			}
		}
		// get member list from server
		ApiClient.getWithRetry("/members", { steamIds: steamIds.join(",") }, (data: string) => {
			print(`[Member] GetMember callback data ${data}`);
			this.MemberList = json.decode(data)[0] as MemberDto[];
			DeepPrintTable(this.MemberList);

			// set member to member table
			for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
				if (PlayerResource.IsValidPlayer(i)) {
					// 32bit steamId
					const steamId = PlayerResource.GetSteamAccountID(i);
					const member = this.MemberList.find(m => m.steamId == steamId);
					if (member) {
						// set key as 64bit steamId
						// @ts-ignore
						CustomNetTables.SetTableValue("member_table", PlayerResource.GetSteamID(i).toString(), member);
					}
				}
			}
		});
	}

	public IsMember(steamId: number) {
		const member = this.MemberList.find(m => m.steamId == steamId);
		if (member) {
			return member.enable;
		}
		return false;
	}

	public GetMember(steamId: number) {
		const member = this.MemberList.find(m => m.steamId == steamId);
		if (member) {
			return member;
		}
		return null;
	}
}
