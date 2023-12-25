local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 1,["8"] = 1,["9"] = 1,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["17"] = 10,["18"] = 18,["19"] = 18,["21"] = 25,["22"] = 26,["23"] = 24,["24"] = 30,["25"] = 30,["26"] = 30,["28"] = 32,["29"] = 34,["30"] = 36,["33"] = 42,["34"] = 46,["35"] = 47,["36"] = 48,["37"] = 49,["38"] = 50,["40"] = 52,["41"] = 52,["42"] = 53,["43"] = 54,["44"] = 55,["45"] = 56,["46"] = 57,["47"] = 58,["48"] = 58,["49"] = 58,["51"] = 58,["52"] = 59,["53"] = 59,["54"] = 59,["56"] = 59,["57"] = 60,["58"] = 60,["60"] = 52,["63"] = 63,["64"] = 63,["65"] = 63,["66"] = 63,["67"] = 67,["68"] = 68,["69"] = 71,["70"] = 63,["71"] = 73,["72"] = 74,["73"] = 77,["74"] = 63,["75"] = 63,["76"] = 81,["77"] = 34,["78"] = 31});
local ____exports = {}
local ____api_client = require("api.api_client")
local ApiClient = ____api_client.ApiClient
local HttpMethod = ____api_client.HttpMethod
local EndGameData = __TS__Class()
EndGameData.name = "EndGameData"
function EndGameData.prototype.____constructor(self)
end
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
                local ____endData_players_i_points_0 = endData.players[i]
                if ____endData_players_i_points_0 ~= nil then
                    ____endData_players_i_points_0 = ____endData_players_i_points_0.points
                end
                player.points = ____endData_players_i_points_0
                local ____endData_players_i_isDisconnect_2 = endData.players[i]
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
