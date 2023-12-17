local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 12,["15"] = 12,["17"] = 19,["18"] = 20,["19"] = 18,["20"] = 24,["21"] = 24,["22"] = 24,["24"] = 27,["25"] = 30,["26"] = 32,["29"] = 36,["30"] = 38,["31"] = 39,["32"] = 40,["33"] = 41,["34"] = 42,["36"] = 44,["37"] = 44,["38"] = 45,["39"] = 46,["40"] = 47,["41"] = 48,["42"] = 49,["43"] = 50,["44"] = 50,["45"] = 50,["47"] = 50,["48"] = 51,["49"] = 51,["50"] = 51,["52"] = 51,["53"] = 52,["54"] = 52,["56"] = 44,["59"] = 55,["60"] = 55,["61"] = 55,["62"] = 55,["63"] = 59,["64"] = 60,["65"] = 61,["66"] = 55,["67"] = 63,["68"] = 64,["69"] = 65,["70"] = 55,["71"] = 55,["72"] = 69,["73"] = 30,["74"] = 26});
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
Game.VERSION = "v3.03"
return ____exports
