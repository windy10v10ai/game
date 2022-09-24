
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
			const developSteamAccountIds = [
				136407523, 1194383041, 143575444, 314757913, 385130282, 967052298, 1159610111, 353885092, 245559423, 916506173];

			for (const steamId of developSteamAccountIds) {
				this.MemberList.push({
					steamId: steamId,
					enable: true,
					expireDateString: "2099-12-31",
				});
			}
		}
		print("[Member] constructor in TS");
	}

	public InitMemberInfo() {
		if (IsInToolsMode()) {
			this.saveMemberToNetTable();
		}
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
			this.saveMemberToNetTable();
		});
	}

	private saveMemberToNetTable() {
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
