local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["16"] = 10,["18"] = 10,["19"] = 15,["20"] = 15,["21"] = 15,["23"] = 15,["24"] = 34,["25"] = 34,["27"] = 34,["28"] = 54,["29"] = 54,["30"] = 54,["32"] = 59,["33"] = 60,["34"] = 60,["35"] = 60,["36"] = 60,["37"] = 60,["38"] = 60,["39"] = 60,["40"] = 60,["41"] = 60,["42"] = 60,["43"] = 60,["44"] = 60,["45"] = 63,["46"] = 64,["47"] = 64,["50"] = 58,["51"] = 73,["52"] = 74,["53"] = 75,["55"] = 78,["56"] = 80,["58"] = 81,["59"] = 81,["60"] = 82,["61"] = 83,["63"] = 81,["66"] = 86,["67"] = 87,["68"] = 87,["69"] = 87,["70"] = 87,["71"] = 87,["72"] = 87,["73"] = 87,["74"] = 87,["75"] = 87,["76"] = 89,["77"] = 90,["78"] = 91,["79"] = 92,["80"] = 93,["81"] = 96,["82"] = 97,["83"] = 99,["84"] = 100,["85"] = 87,["86"] = 87,["87"] = 73,["88"] = 104,["90"] = 105,["91"] = 105,["92"] = 106,["93"] = 108,["94"] = 109,["95"] = 109,["96"] = 109,["97"] = 109,["98"] = 110,["99"] = 112,["100"] = 112,["101"] = 112,["102"] = 112,["103"] = 112,["106"] = 105,["109"] = 104,["110"] = 118,["112"] = 119,["113"] = 119,["114"] = 120,["115"] = 122,["116"] = 123,["117"] = 123,["118"] = 123,["119"] = 123,["120"] = 124,["121"] = 126,["122"] = 126,["123"] = 126,["124"] = 126,["125"] = 126,["128"] = 119,["131"] = 118,["132"] = 131,["133"] = 132,["134"] = 132,["135"] = 132,["136"] = 132,["137"] = 133,["138"] = 134,["140"] = 136,["141"] = 131,["142"] = 139,["143"] = 140,["144"] = 140,["145"] = 140,["146"] = 140,["147"] = 141,["148"] = 142,["150"] = 144,["151"] = 139,["152"] = 55,["153"] = 56,["154"] = 57});
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
