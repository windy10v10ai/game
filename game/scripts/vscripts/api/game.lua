local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 1,["8"] = 1,["9"] = 1,["10"] = 3,["11"] = 3,["13"] = 3,["14"] = 11,["15"] = 11,["17"] = 18,["18"] = 19,["19"] = 17,["20"] = 23,["21"] = 23,["23"] = 28,["24"] = 27,["25"] = 32,["26"] = 32,["27"] = 32,["29"] = 34,["30"] = 36,["31"] = 38,["34"] = 44,["35"] = 48,["36"] = 49,["37"] = 50,["38"] = 51,["39"] = 52,["41"] = 54,["42"] = 54,["43"] = 55,["44"] = 56,["45"] = 57,["46"] = 58,["47"] = 59,["48"] = 60,["49"] = 60,["50"] = 60,["52"] = 60,["53"] = 61,["54"] = 61,["55"] = 61,["57"] = 61,["58"] = 62,["59"] = 62,["61"] = 54,["64"] = 65,["65"] = 65,["66"] = 65,["67"] = 65,["68"] = 69,["69"] = 70,["70"] = 73,["71"] = 65,["72"] = 75,["73"] = 76,["74"] = 79,["75"] = 65,["76"] = 65,["77"] = 83,["78"] = 36,["79"] = 33});
local ____exports = {}
local ____api_client = require("api.api_client")
local ApiClient = ____api_client.ApiClient
local HttpMethod = ____api_client.HttpMethod
local Player = __TS__Class()
Player.name = "Player"
function Player.prototype.____constructor(self)
end
local GameInfo = __TS__Class()
GameInfo.name = "GameInfo"
function GameInfo.prototype.____constructor(self)
    print("[Game] constructor in TS")
    self.players = {}
end
local EndGameInfo = __TS__Class()
EndGameInfo.name = "EndGameInfo"
function EndGameInfo.prototype.____constructor(self)
    self.players = {}
end
____exports.Game = __TS__Class()
local Game = ____exports.Game
Game.name = "Game"
function Game.prototype.____constructor(self)
end
function Game.prototype.SendEndGameInfo(self, endData)
    if GetDedicatedServerKeyV2(ApiClient.SERVER_KEY) == ApiClient.LOCAL_APIKEY and not IsInToolsMode() then
        return
    end
    CustomNetTables:SetTableValue("ending_status", "ending_status", {status = 1})
    local gameInfo = __TS__New(GameInfo)
    gameInfo.winnerTeamId = endData.winnerTeamId
    gameInfo.matchId = tostring(GameRules:Script_GetMatchID())
    gameInfo.version = ____exports.Game.VERSION
    gameInfo.gameOption = endData.gameOption
    do
        local i = 0
        while i < PlayerResource:GetPlayerCount() do
            if PlayerResource:IsValidPlayerID(i) then
                local player = __TS__New(Player)
                player.teamId = PlayerResource:GetTeam(i)
                player.steamId = PlayerResource:GetSteamAccountID(i)
                player.heroName = PlayerResource:GetSelectedHeroName(i)
                local ____endData_players_i_points_0 = endData.players[i + 1]
                if ____endData_players_i_points_0 ~= nil then
                    ____endData_players_i_points_0 = ____endData_players_i_points_0.points
                end
                player.points = ____endData_players_i_points_0
                local ____endData_players_i_isDisconnect_2 = endData.players[i + 1]
                if ____endData_players_i_isDisconnect_2 ~= nil then
                    ____endData_players_i_isDisconnect_2 = ____endData_players_i_isDisconnect_2.isDisconnect
                end
                player.isDisconnect = ____endData_players_i_isDisconnect_2
                local ____gameInfo_players_4 = gameInfo.players
                ____gameInfo_players_4[#____gameInfo_players_4 + 1] = player
            end
            i = i + 1
        end
    end
    local apiParameter = {
        method = HttpMethod.POST,
        path = ApiClient.POST_GAME_URL,
        body = gameInfo,
        successFunc = function(____, data)
            CustomNetTables:SetTableValue("ending_status", "ending_status", {status = 2})
            print("[Game] end game callback data " .. data)
        end,
        failureFunc = function(____, data)
            CustomNetTables:SetTableValue("ending_status", "ending_status", {status = 3})
            print("[Game] end game callback data " .. data)
        end
    }
    ApiClient:sendWithRetry(apiParameter)
end
Game.VERSION = "v3.04"
return ____exports
