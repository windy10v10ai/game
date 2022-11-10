local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["17"] = 10,["18"] = 28,["19"] = 28,["21"] = 28,["22"] = 33,["23"] = 33,["24"] = 33,["26"] = 34,["27"] = 35,["28"] = 38,["29"] = 39,["30"] = 39,["31"] = 39,["32"] = 39,["33"] = 39,["34"] = 39,["35"] = 39,["36"] = 39,["37"] = 39,["38"] = 39,["39"] = 39,["40"] = 39,["41"] = 42,["42"] = 43,["43"] = 43,["46"] = 37,["47"] = 52,["48"] = 53,["49"] = 54,["51"] = 58,["52"] = 60,["54"] = 61,["55"] = 61,["56"] = 62,["57"] = 63,["59"] = 61,["62"] = 66,["63"] = 67,["64"] = 67,["65"] = 67,["66"] = 67,["67"] = 67,["68"] = 67,["69"] = 67,["70"] = 67,["71"] = 67,["72"] = 69,["73"] = 70,["74"] = 71,["75"] = 72,["76"] = 73,["77"] = 76,["78"] = 77,["79"] = 79,["80"] = 81,["81"] = 67,["82"] = 67,["83"] = 52,["84"] = 85,["86"] = 86,["87"] = 86,["88"] = 87,["89"] = 89,["90"] = 90,["91"] = 90,["92"] = 90,["93"] = 90,["94"] = 91,["95"] = 94,["96"] = 94,["97"] = 94,["98"] = 94,["99"] = 94,["102"] = 86,["105"] = 85,["106"] = 100,["108"] = 101,["109"] = 101,["110"] = 102,["111"] = 104,["112"] = 105,["113"] = 105,["114"] = 105,["115"] = 105,["116"] = 106,["117"] = 109,["118"] = 109,["119"] = 109,["120"] = 109,["121"] = 109,["124"] = 101,["127"] = 100,["128"] = 114,["129"] = 115,["130"] = 115,["131"] = 115,["132"] = 115,["133"] = 116,["134"] = 117,["136"] = 119,["137"] = 114,["138"] = 122,["139"] = 123,["140"] = 123,["141"] = 123,["142"] = 123,["143"] = 124,["144"] = 125,["146"] = 127,["147"] = 122,["148"] = 36});
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
            local status = #self.playerList > 0 and 2 or 3
            CustomNetTables:SetTableValue("loading_status", "loading_status", {status = status})
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
