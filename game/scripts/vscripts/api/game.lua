local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 11,["15"] = 11,["17"] = 17,["18"] = 18,["19"] = 16,["20"] = 22,["21"] = 22,["22"] = 22,["24"] = 23,["25"] = 26,["26"] = 27,["27"] = 28,["28"] = 29,["29"] = 31,["31"] = 33,["32"] = 33,["33"] = 34,["34"] = 35,["35"] = 36,["36"] = 37,["37"] = 38,["38"] = 39,["39"] = 39,["40"] = 39,["42"] = 39,["43"] = 40,["44"] = 40,["46"] = 33,["49"] = 45,["50"] = 45,["51"] = 45,["52"] = 45,["53"] = 45,["54"] = 45,["55"] = 46,["56"] = 45,["57"] = 45,["58"] = 26});
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
                local ____gameInfo_players_2 = gameInfo.players
                ____gameInfo_players_2[#____gameInfo_players_2 + 1] = player
            end
            i = i + 1
        end
    end
    ApiClient:sendWithRetry(
        HttpMethod.POST,
        "/game/end",
        nil,
        gameInfo,
        function(____, data)
            print("[Game] end game callback data " .. data)
        end
    )
end
return ____exports
