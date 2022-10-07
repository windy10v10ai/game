local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 11,["15"] = 11,["16"] = 11,["18"] = 12,["19"] = 14,["20"] = 15,["21"] = 15,["22"] = 15,["23"] = 15,["24"] = 15,["25"] = 15,["26"] = 15,["27"] = 15,["28"] = 15,["29"] = 15,["30"] = 15,["31"] = 15,["33"] = 26,["34"] = 13,["35"] = 29,["36"] = 30,["37"] = 31,["39"] = 34,["41"] = 35,["42"] = 35,["43"] = 36,["44"] = 37,["46"] = 35,["49"] = 41,["50"] = 43,["51"] = 43,["52"] = 43,["53"] = 43,["54"] = 43,["55"] = 43,["56"] = 43,["57"] = 43,["58"] = 43,["59"] = 44,["60"] = 45,["61"] = 46,["62"] = 49,["63"] = 43,["64"] = 43,["65"] = 29,["66"] = 53,["68"] = 54,["69"] = 54,["70"] = 55,["71"] = 57,["72"] = 58,["73"] = 58,["74"] = 58,["75"] = 58,["76"] = 59,["77"] = 62,["78"] = 62,["79"] = 62,["80"] = 62,["81"] = 62,["84"] = 54,["87"] = 53,["88"] = 68,["89"] = 69,["90"] = 69,["91"] = 69,["92"] = 69,["93"] = 70,["94"] = 71,["96"] = 73,["97"] = 68,["98"] = 76,["99"] = 77,["100"] = 77,["101"] = 77,["102"] = 77,["103"] = 78,["104"] = 79,["106"] = 81,["107"] = 76});
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
        "/members",
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
