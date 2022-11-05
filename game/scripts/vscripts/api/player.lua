local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["17"] = 10,["18"] = 28,["19"] = 28,["21"] = 28,["22"] = 33,["23"] = 33,["24"] = 33,["26"] = 34,["27"] = 35,["28"] = 38,["29"] = 39,["30"] = 39,["31"] = 39,["32"] = 39,["33"] = 39,["34"] = 39,["35"] = 39,["36"] = 39,["37"] = 39,["38"] = 39,["39"] = 39,["40"] = 39,["41"] = 42,["42"] = 43,["43"] = 43,["46"] = 37,["47"] = 52,["48"] = 53,["49"] = 54,["51"] = 58,["52"] = 60,["54"] = 61,["55"] = 61,["56"] = 62,["57"] = 63,["59"] = 61,["62"] = 66,["63"] = 67,["64"] = 67,["65"] = 67,["66"] = 67,["67"] = 67,["68"] = 67,["69"] = 67,["70"] = 67,["71"] = 67,["72"] = 69,["73"] = 70,["74"] = 71,["75"] = 72,["76"] = 73,["77"] = 76,["78"] = 77,["79"] = 80,["80"] = 67,["81"] = 67,["82"] = 52,["83"] = 84,["85"] = 85,["86"] = 85,["87"] = 86,["88"] = 88,["89"] = 89,["90"] = 89,["91"] = 89,["92"] = 89,["93"] = 90,["94"] = 93,["95"] = 93,["96"] = 93,["97"] = 93,["98"] = 93,["101"] = 85,["104"] = 84,["105"] = 99,["107"] = 100,["108"] = 100,["109"] = 101,["110"] = 103,["111"] = 104,["112"] = 104,["113"] = 104,["114"] = 104,["115"] = 105,["116"] = 108,["117"] = 108,["118"] = 108,["119"] = 108,["120"] = 108,["123"] = 100,["126"] = 99,["127"] = 113,["128"] = 114,["129"] = 114,["130"] = 114,["131"] = 114,["132"] = 115,["133"] = 116,["135"] = 118,["136"] = 113,["137"] = 121,["138"] = 122,["139"] = 122,["140"] = 122,["141"] = 122,["142"] = 123,["143"] = 124,["145"] = 126,["146"] = 121,["147"] = 36});
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
    CustomNetTables:SetTableValue("loading_status", "loading_status", {status = 1})
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
            CustomNetTables:SetTableValue("loading_status", "loading_status", {status = 2})
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
                        tostring(steamId),
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
                        tostring(steamId),
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
Player.GAME_START_URL = "/game/start"
return ____exports
