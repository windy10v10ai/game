local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["16"] = 10,["18"] = 10,["19"] = 15,["20"] = 15,["21"] = 15,["23"] = 15,["24"] = 35,["25"] = 35,["27"] = 35,["28"] = 55,["29"] = 55,["30"] = 55,["32"] = 60,["33"] = 61,["34"] = 61,["35"] = 61,["36"] = 61,["37"] = 61,["38"] = 61,["39"] = 61,["40"] = 61,["41"] = 61,["42"] = 61,["43"] = 61,["44"] = 61,["45"] = 64,["46"] = 65,["47"] = 65,["50"] = 59,["51"] = 74,["52"] = 75,["53"] = 76,["55"] = 79,["56"] = 81,["58"] = 82,["59"] = 82,["60"] = 83,["61"] = 84,["63"] = 82,["66"] = 87,["67"] = 88,["68"] = 88,["69"] = 88,["70"] = 88,["71"] = 88,["72"] = 88,["73"] = 88,["74"] = 88,["75"] = 88,["76"] = 90,["77"] = 91,["78"] = 92,["79"] = 93,["80"] = 94,["81"] = 97,["82"] = 98,["83"] = 100,["84"] = 101,["85"] = 88,["86"] = 88,["87"] = 74,["88"] = 105,["90"] = 106,["91"] = 106,["92"] = 107,["93"] = 109,["94"] = 110,["95"] = 110,["96"] = 110,["97"] = 110,["98"] = 111,["99"] = 113,["100"] = 113,["101"] = 113,["102"] = 113,["103"] = 113,["106"] = 106,["109"] = 105,["110"] = 119,["112"] = 120,["113"] = 120,["114"] = 121,["115"] = 123,["116"] = 124,["117"] = 124,["118"] = 124,["119"] = 124,["120"] = 125,["121"] = 127,["122"] = 127,["123"] = 127,["124"] = 127,["125"] = 127,["128"] = 120,["131"] = 119,["132"] = 132,["133"] = 133,["134"] = 133,["135"] = 133,["136"] = 133,["137"] = 134,["138"] = 135,["140"] = 137,["141"] = 132,["142"] = 140,["143"] = 141,["144"] = 141,["145"] = 141,["146"] = 141,["147"] = 142,["148"] = 143,["150"] = 145,["151"] = 140,["152"] = 56,["153"] = 57,["154"] = 58});
local ____exports = {}
local ____api_client = require("api.api_client")
local ApiClient = ____api_client.ApiClient
local HttpMethod = ____api_client.HttpMethod
local MemberDto = __TS__Class()
MemberDto.name = "MemberDto"
function MemberDto.prototype.____constructor(self)
end
____exports.PlayerProperty = __TS__Class()
local PlayerProperty = ____exports.PlayerProperty
PlayerProperty.name = "PlayerProperty"
function PlayerProperty.prototype.____constructor(self)
end
____exports.PlayerDto = __TS__Class()
local PlayerDto = ____exports.PlayerDto
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
            local ____exports_Player_memberList_0 = ____exports.Player.memberList
            ____exports_Player_memberList_0[#____exports_Player_memberList_0 + 1] = {steamId = steamId, enable = true, expireDateString = "2099-12-31"}
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
            ____exports.Player.memberList = gameStart.members
            ____exports.Player.playerList = gameStart.players
            self:saveMemberToNetTable()
            self:savePlayerToNetTable()
            local status = #____exports.Player.playerList > 0 and 2 or 3
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
                    ____exports.Player.memberList,
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
                    ____exports.Player.playerList,
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
        ____exports.Player.memberList,
        function(____, m) return m.steamId == steamId end
    )
    if member then
        return member.enable
    end
    return false
end
function Player.prototype.GetMember(self, steamId)
    local member = __TS__ArrayFind(
        ____exports.Player.memberList,
        function(____, m) return m.steamId == steamId end
    )
    if member then
        return member
    end
    return nil
end
Player.memberList = {}
Player.playerList = {}
Player.GAME_START_URL = "/game/start"
return ____exports
