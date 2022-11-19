local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["16"] = 10,["18"] = 10,["19"] = 15,["20"] = 15,["21"] = 15,["23"] = 15,["24"] = 36,["25"] = 36,["27"] = 36,["28"] = 56,["29"] = 56,["30"] = 56,["32"] = 61,["33"] = 62,["34"] = 62,["35"] = 62,["36"] = 62,["37"] = 62,["38"] = 62,["39"] = 62,["40"] = 62,["41"] = 62,["42"] = 62,["43"] = 62,["44"] = 62,["45"] = 65,["46"] = 66,["47"] = 66,["50"] = 60,["51"] = 75,["52"] = 76,["53"] = 77,["55"] = 80,["56"] = 82,["58"] = 83,["59"] = 83,["60"] = 84,["61"] = 85,["63"] = 83,["66"] = 88,["67"] = 89,["68"] = 89,["69"] = 89,["70"] = 89,["71"] = 89,["72"] = 89,["73"] = 89,["74"] = 89,["75"] = 89,["76"] = 91,["77"] = 92,["78"] = 93,["79"] = 94,["80"] = 95,["81"] = 98,["82"] = 99,["83"] = 101,["84"] = 102,["85"] = 89,["86"] = 89,["87"] = 75,["88"] = 106,["90"] = 107,["91"] = 107,["92"] = 108,["93"] = 110,["94"] = 111,["95"] = 111,["96"] = 111,["97"] = 111,["98"] = 112,["99"] = 114,["100"] = 114,["101"] = 114,["102"] = 114,["103"] = 114,["106"] = 107,["109"] = 106,["110"] = 120,["112"] = 121,["113"] = 121,["114"] = 122,["115"] = 124,["116"] = 125,["117"] = 125,["118"] = 125,["119"] = 125,["120"] = 126,["121"] = 128,["122"] = 128,["123"] = 128,["124"] = 128,["125"] = 128,["128"] = 121,["131"] = 120,["132"] = 133,["133"] = 134,["134"] = 134,["135"] = 134,["136"] = 134,["137"] = 135,["138"] = 136,["140"] = 138,["141"] = 133,["142"] = 141,["143"] = 142,["144"] = 142,["145"] = 142,["146"] = 142,["147"] = 143,["148"] = 144,["150"] = 146,["151"] = 141,["152"] = 57,["153"] = 58,["154"] = 59});
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
