local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["17"] = 10,["18"] = 22,["19"] = 22,["21"] = 22,["22"] = 27,["23"] = 27,["24"] = 27,["26"] = 28,["27"] = 29,["28"] = 32,["29"] = 33,["30"] = 33,["31"] = 33,["32"] = 33,["33"] = 33,["34"] = 33,["35"] = 33,["36"] = 33,["37"] = 33,["38"] = 33,["39"] = 33,["40"] = 33,["41"] = 36,["42"] = 37,["43"] = 37,["46"] = 31,["47"] = 46,["48"] = 47,["49"] = 48,["51"] = 52,["52"] = 54,["54"] = 55,["55"] = 55,["56"] = 56,["57"] = 57,["59"] = 55,["62"] = 60,["63"] = 61,["64"] = 61,["65"] = 61,["66"] = 61,["67"] = 61,["68"] = 61,["69"] = 61,["70"] = 61,["71"] = 61,["72"] = 63,["73"] = 64,["74"] = 65,["75"] = 66,["76"] = 67,["77"] = 70,["78"] = 71,["79"] = 74,["80"] = 61,["81"] = 61,["82"] = 46,["83"] = 78,["85"] = 79,["86"] = 79,["87"] = 80,["88"] = 82,["89"] = 83,["90"] = 83,["91"] = 83,["92"] = 83,["93"] = 84,["94"] = 87,["95"] = 87,["96"] = 87,["97"] = 87,["98"] = 87,["101"] = 79,["104"] = 78,["105"] = 93,["107"] = 94,["108"] = 94,["109"] = 95,["110"] = 97,["111"] = 98,["112"] = 98,["113"] = 98,["114"] = 98,["115"] = 99,["116"] = 102,["117"] = 102,["118"] = 102,["119"] = 102,["120"] = 102,["123"] = 94,["126"] = 93,["127"] = 107,["128"] = 108,["129"] = 108,["130"] = 108,["131"] = 108,["132"] = 109,["133"] = 110,["135"] = 112,["136"] = 107,["137"] = 115,["138"] = 116,["139"] = 116,["140"] = 116,["141"] = 116,["142"] = 117,["143"] = 118,["145"] = 120,["146"] = 115,["147"] = 30});
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
Player.GAME_START_URL = "/game/start/v2"
return ____exports
