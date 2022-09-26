local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 4,["10"] = 4,["12"] = 4,["13"] = 11,["14"] = 11,["15"] = 11,["17"] = 12,["18"] = 14,["19"] = 15,["20"] = 15,["21"] = 15,["22"] = 15,["23"] = 15,["24"] = 15,["25"] = 15,["26"] = 15,["27"] = 15,["28"] = 15,["29"] = 15,["30"] = 15,["31"] = 18,["32"] = 19,["33"] = 19,["36"] = 26,["37"] = 13,["38"] = 29,["39"] = 30,["40"] = 31,["42"] = 34,["44"] = 35,["45"] = 35,["46"] = 36,["47"] = 37,["49"] = 35,["52"] = 41,["53"] = 41,["54"] = 41,["55"] = 41,["56"] = 42,["57"] = 43,["58"] = 44,["59"] = 47,["60"] = 41,["61"] = 41,["62"] = 29,["63"] = 51,["65"] = 52,["66"] = 52,["67"] = 53,["68"] = 55,["69"] = 56,["70"] = 56,["71"] = 56,["72"] = 56,["73"] = 57,["74"] = 60,["75"] = 60,["76"] = 60,["77"] = 60,["78"] = 60,["81"] = 52,["84"] = 51,["85"] = 66,["86"] = 67,["87"] = 67,["88"] = 67,["89"] = 67,["90"] = 68,["91"] = 69,["93"] = 71,["94"] = 66,["95"] = 74,["96"] = 75,["97"] = 75,["98"] = 75,["99"] = 75,["100"] = 76,["101"] = 77,["103"] = 79,["104"] = 74});
local ____exports = {}
local ____api_client = require("api.api_client")
local ApiClient = ____api_client.ApiClient
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
    ApiClient:getWithRetry(
        "/members",
        {steamIds = table.concat(steamIds, ",")},
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
