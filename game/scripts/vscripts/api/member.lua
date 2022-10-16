local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 11,["15"] = 11,["16"] = 11,["18"] = 12,["19"] = 14,["20"] = 15,["21"] = 15,["22"] = 15,["23"] = 15,["24"] = 15,["25"] = 15,["26"] = 15,["27"] = 15,["28"] = 15,["29"] = 15,["30"] = 15,["31"] = 15,["32"] = 18,["33"] = 19,["34"] = 19,["37"] = 26,["38"] = 13,["39"] = 29,["40"] = 30,["41"] = 31,["43"] = 34,["45"] = 35,["46"] = 35,["47"] = 36,["48"] = 37,["50"] = 35,["53"] = 41,["54"] = 43,["55"] = 43,["56"] = 43,["57"] = 43,["58"] = 43,["59"] = 43,["60"] = 43,["61"] = 43,["62"] = 43,["63"] = 44,["64"] = 45,["65"] = 46,["66"] = 49,["67"] = 43,["68"] = 43,["69"] = 29,["70"] = 53,["72"] = 54,["73"] = 54,["74"] = 55,["75"] = 57,["76"] = 58,["77"] = 58,["78"] = 58,["79"] = 58,["80"] = 59,["81"] = 62,["82"] = 62,["83"] = 62,["84"] = 62,["85"] = 62,["88"] = 54,["91"] = 53,["92"] = 68,["93"] = 69,["94"] = 69,["95"] = 69,["96"] = 69,["97"] = 70,["98"] = 71,["100"] = 73,["101"] = 68,["102"] = 76,["103"] = 77,["104"] = 77,["105"] = 77,["106"] = 77,["107"] = 78,["108"] = 79,["110"] = 81,["111"] = 76});
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
    print("[Member] constructor in TS")
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
