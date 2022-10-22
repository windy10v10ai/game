local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 12,["15"] = 12,["17"] = 18,["18"] = 19,["19"] = 17,["20"] = 23,["21"] = 23,["22"] = 23,["24"] = 26,["25"] = 29,["26"] = 30,["27"] = 31,["28"] = 32,["29"] = 34,["31"] = 36,["32"] = 36,["33"] = 37,["34"] = 38,["35"] = 39,["36"] = 40,["37"] = 41,["38"] = 42,["39"] = 42,["40"] = 42,["42"] = 42,["43"] = 43,["44"] = 43,["45"] = 43,["47"] = 43,["48"] = 44,["49"] = 44,["51"] = 36,["54"] = 49,["55"] = 49,["56"] = 49,["57"] = 49,["58"] = 49,["59"] = 49,["60"] = 50,["61"] = 49,["62"] = 49,["63"] = 29,["64"] = 25});
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
    local gameInfo = __TS__New(GameInfo)
    gameInfo.winnerTeamId = endData.winnerTeamId
    gameInfo.matchId = tostring(GameRules:Script_GetMatchID())
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
    ApiClient:sendWithRetry(
        HttpMethod.POST,
        "/game/end",
        {version = ____exports.Game.VERSION},
        gameInfo,
        function(____, data)
            print("[Game] end game callback data " .. data)
        end
    )
end
Game.VERSION = "v1.46"
return ____exports
