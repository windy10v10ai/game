local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["17"] = 10,["18"] = 22,["19"] = 22,["21"] = 22,["22"] = 27,["23"] = 27,["24"] = 27,["26"] = 28,["27"] = 29,["28"] = 32,["29"] = 33,["30"] = 33,["31"] = 33,["32"] = 33,["33"] = 33,["34"] = 33,["35"] = 33,["36"] = 33,["37"] = 33,["38"] = 33,["39"] = 33,["40"] = 33,["41"] = 36,["42"] = 37,["43"] = 37,["46"] = 31,["47"] = 46,["48"] = 47,["49"] = 48,["51"] = 51,["53"] = 52,["54"] = 52,["55"] = 53,["56"] = 54,["58"] = 52,["61"] = 57,["62"] = 58,["63"] = 58,["64"] = 58,["65"] = 58,["66"] = 58,["67"] = 58,["68"] = 58,["69"] = 58,["70"] = 58,["71"] = 60,["72"] = 61,["73"] = 62,["74"] = 63,["75"] = 64,["76"] = 67,["77"] = 68,["78"] = 58,["79"] = 58,["80"] = 46,["81"] = 72,["83"] = 73,["84"] = 73,["85"] = 74,["86"] = 76,["87"] = 77,["88"] = 77,["89"] = 77,["90"] = 77,["91"] = 78,["92"] = 81,["93"] = 81,["94"] = 81,["95"] = 81,["96"] = 81,["99"] = 73,["102"] = 72,["103"] = 87,["105"] = 88,["106"] = 88,["107"] = 89,["108"] = 91,["109"] = 92,["110"] = 92,["111"] = 92,["112"] = 92,["113"] = 93,["114"] = 96,["115"] = 96,["116"] = 96,["117"] = 96,["118"] = 96,["121"] = 88,["124"] = 87,["125"] = 101,["126"] = 102,["127"] = 102,["128"] = 102,["129"] = 102,["130"] = 103,["131"] = 104,["133"] = 106,["134"] = 101,["135"] = 109,["136"] = 110,["137"] = 110,["138"] = 110,["139"] = 110,["140"] = 111,["141"] = 112,["143"] = 114,["144"] = 109,["145"] = 30});
local ____exports = {}
local ____api_client = require("api.api_client")
local ApiClient = ____api_client.ApiClient
local HttpMethod = ____api_client.HttpMethod
local MemberDto = __TS__Class()
MemberDto.name = "MemberDto"
function MemberDto.prototype.____constructor(self)
end
local PlayerDto = __TS__Class()
PlayerDto.name = "PlayerDto"
function PlayerDto.prototype.____constructor(self)
end
local GameStart = __TS__Class()
GameStart.name = "GameStart"
function GameStart.prototype.____constructor(self)
end
____exports.Player = __TS__Class()
local Player = ____exports.Player
Player.name = "Player"
function Player.prototype.____constructor(self)
    self.memberList = {}
    self.playerList = {}
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
            local ____self_memberList_0 = self.memberList
            ____self_memberList_0[#____self_memberList_0 + 1] = {steamId = steamId, enable = true, expireDateString = "2099-12-31"}
        end
    end
end
function Player.prototype.Init(self)
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
        ____exports.Player.GAME_START_URL,
        {
            steamIds = table.concat(steamIds, ","),
            matchId = matchId
        },
        nil,
        function(____, data)
            print("[Player] Init callback data " .. data)
            local gameStart = json.decode(data)
            DeepPrintTable(gameStart)
            self.memberList = gameStart.members
            self.playerList = gameStart.players
            self:saveMemberToNetTable()
            self:savePlayerToNetTable()
        end
    )
end
function Player.prototype.saveMemberToNetTable(self)
    do
        local i = 0
        while i < PlayerResource:GetPlayerCount() do
            if PlayerResource:IsValidPlayer(i) then
                local steamId = PlayerResource:GetSteamAccountID(i)
                local member = __TS__ArrayFind(
                    self.memberList,
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
function Player.prototype.savePlayerToNetTable(self)
    do
        local i = 0
        while i < PlayerResource:GetPlayerCount() do
            if PlayerResource:IsValidPlayer(i) then
                local steamId = PlayerResource:GetSteamAccountID(i)
                local player = __TS__ArrayFind(
                    self.playerList,
                    function(____, p) return p.id == tostring(steamId) end
                )
                if player then
                    CustomNetTables:SetTableValue(
                        "player_table",
                        tostring(PlayerResource:GetSteamID(i)),
                        player
                    )
                end
            end
            i = i + 1
        end
    end
end
function Player.prototype.IsMember(self, steamId)
    local member = __TS__ArrayFind(
        self.memberList,
        function(____, m) return m.steamId == steamId end
    )
    if member then
        return member.enable
    end
    return false
end
function Player.prototype.GetMember(self, steamId)
    local member = __TS__ArrayFind(
        self.memberList,
        function(____, m) return m.steamId == steamId end
    )
    if member then
        return member
    end
    return nil
end
Player.GAME_START_URL = "/game/start/v2"
return ____exports
