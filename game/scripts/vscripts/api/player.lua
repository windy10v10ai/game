local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 11,["15"] = 11,["16"] = 11,["18"] = 12,["19"] = 14,["20"] = 15,["21"] = 15,["22"] = 15,["23"] = 15,["24"] = 15,["25"] = 15,["26"] = 15,["27"] = 15,["28"] = 15,["29"] = 15,["30"] = 15,["31"] = 15,["32"] = 18,["33"] = 19,["34"] = 19,["37"] = 13,["38"] = 28,["39"] = 29,["40"] = 30,["42"] = 33,["44"] = 34,["45"] = 34,["46"] = 35,["47"] = 36,["49"] = 34,["52"] = 40,["53"] = 42,["54"] = 42,["55"] = 42,["56"] = 42,["57"] = 42,["58"] = 42,["59"] = 42,["60"] = 42,["61"] = 42,["62"] = 43,["63"] = 44,["64"] = 45,["65"] = 48,["66"] = 42,["67"] = 42,["68"] = 28,["69"] = 52,["71"] = 53,["72"] = 53,["73"] = 54,["74"] = 56,["75"] = 57,["76"] = 57,["77"] = 57,["78"] = 57,["79"] = 58,["80"] = 61,["81"] = 61,["82"] = 61,["83"] = 61,["84"] = 61,["87"] = 53,["90"] = 52,["91"] = 67,["92"] = 68,["93"] = 68,["94"] = 68,["95"] = 68,["96"] = 69,["97"] = 70,["99"] = 72,["100"] = 67,["101"] = 75,["102"] = 76,["103"] = 76,["104"] = 76,["105"] = 76,["106"] = 77,["107"] = 78,["109"] = 80,["110"] = 75});
local ____exports = {}
local ____api_client = require("api.api_client")
local ApiClient = ____api_client.ApiClient
local HttpMethod = ____api_client.HttpMethod
local MemberDto = __TS__Class()
MemberDto.name = "MemberDto"
function MemberDto.prototype.____constructor(self)
end
____exports.Member = __TS__Class()
local Member = ____exports.Member
Member.name = "Member"
function Member.prototype.____constructor(self)
    self.MemberList = {}
    if IsInToolsMode() then
        local developSteamAccountIds = {
            136407523,
            1194383041,
            143575444,
            314757913,
            385130282,
            967052298,
            1159610111,
            353885092,
            245559423,
            916506173
        }
        for ____, steamId in ipairs(developSteamAccountIds) do
            local ____self_MemberList_0 = self.MemberList
            ____self_MemberList_0[#____self_MemberList_0 + 1] = {steamId = steamId, enable = true, expireDateString = "2099-12-31"}
        end
    end
end
function Member.prototype.InitMemberInfo(self)
    if IsInToolsMode() then
        self:saveMemberToNetTable()
    end
    local steamIds = {}
    do
        local i = 0
        while i < PlayerResource:GetPlayerCount() do
            if PlayerResource:IsValidPlayer(i) then
                steamIds[#steamIds + 1] = PlayerResource:GetSteamAccountID(i)
            end
            i = i + 1
        end
    end
    local matchId = tostring(GameRules:Script_GetMatchID())
    ApiClient:sendWithRetry(
        HttpMethod.GET,
        "/game/start",
        {
            steamIds = table.concat(steamIds, ","),
            matchId = matchId
        },
        nil,
        function(____, data)
            print("[Member] GetMember callback data " .. data)
            self.MemberList = json.decode(data)
            DeepPrintTable(self.MemberList)
            self:saveMemberToNetTable()
        end
    )
end
function Member.prototype.saveMemberToNetTable(self)
    do
        local i = 0
        while i < PlayerResource:GetPlayerCount() do
            if PlayerResource:IsValidPlayer(i) then
                local steamId = PlayerResource:GetSteamAccountID(i)
                local member = __TS__ArrayFind(
                    self.MemberList,
                    function(____, m) return m.steamId == steamId end
                )
                if member then
                    CustomNetTables:SetTableValue(
                        "member_table",
                        tostring(PlayerResource:GetSteamID(i)),
                        member
                    )
                end
            end
            i = i + 1
        end
    end
end
function Member.prototype.IsMember(self, steamId)
    local member = __TS__ArrayFind(
        self.MemberList,
        function(____, m) return m.steamId == steamId end
    )
    if member then
        return member.enable
    end
    return false
end
function Member.prototype.GetMember(self, steamId)
    local member = __TS__ArrayFind(
        self.MemberList,
        function(____, m) return m.steamId == steamId end
    )
    if member then
        return member
    end
    return nil
end
return ____exports
