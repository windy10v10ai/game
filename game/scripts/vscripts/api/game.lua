local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 12,["15"] = 12,["17"] = 19,["18"] = 20,["19"] = 18,["20"] = 24,["21"] = 24,["22"] = 24,["24"] = 27,["25"] = 30,["26"] = 31,["27"] = 33,["28"] = 34,["29"] = 35,["30"] = 36,["31"] = 37,["33"] = 39,["34"] = 39,["35"] = 40,["36"] = 41,["37"] = 42,["38"] = 43,["39"] = 44,["40"] = 45,["41"] = 45,["42"] = 45,["44"] = 45,["45"] = 46,["46"] = 46,["47"] = 46,["49"] = 46,["50"] = 47,["51"] = 47,["53"] = 39,["56"] = 50,["57"] = 50,["58"] = 50,["59"] = 50,["60"] = 54,["61"] = 55,["62"] = 56,["63"] = 50,["64"] = 58,["65"] = 59,["66"] = 60,["67"] = 50,["68"] = 50,["69"] = 64,["70"] = 30,["71"] = 26});
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
Game.VERSION = "v2.08"
return ____exports
