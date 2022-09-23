local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 4,["10"] = 4,["12"] = 4,["13"] = 11,["14"] = 11,["15"] = 11,["17"] = 12,["18"] = 14,["20"] = 17,["21"] = 13,["22"] = 20,["23"] = 22,["25"] = 23,["26"] = 23,["27"] = 24,["28"] = 25,["30"] = 23,["33"] = 29,["34"] = 29,["35"] = 29,["36"] = 29,["37"] = 30,["38"] = 31,["39"] = 32,["41"] = 35,["42"] = 35,["43"] = 36,["44"] = 38,["45"] = 39,["46"] = 39,["47"] = 39,["48"] = 39,["49"] = 40,["50"] = 43,["51"] = 43,["52"] = 43,["53"] = 43,["54"] = 43,["57"] = 35,["60"] = 29,["61"] = 29,["62"] = 20,["63"] = 50,["64"] = 51,["65"] = 51,["66"] = 51,["67"] = 51,["68"] = 52,["69"] = 53,["71"] = 55,["72"] = 50,["73"] = 58,["74"] = 59,["75"] = 59,["76"] = 59,["77"] = 59,["78"] = 60,["79"] = 61,["81"] = 63,["82"] = 58});
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
    end
    print("[Member] constructor in TS")
end
function Member.prototype.InitMemberInfo(self)
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
    )
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
