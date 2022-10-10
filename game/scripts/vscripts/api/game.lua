local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["17"] = 16,["18"] = 17,["19"] = 15,["20"] = 21,["21"] = 21,["22"] = 21,["24"] = 22,["25"] = 25,["26"] = 26,["27"] = 27,["28"] = 28,["29"] = 30,["30"] = 31,["31"] = 32,["34"] = 35,["35"] = 35,["36"] = 36,["37"] = 37,["38"] = 38,["39"] = 39,["40"] = 40,["41"] = 41,["42"] = 41,["44"] = 35,["47"] = 46,["48"] = 46,["49"] = 46,["50"] = 46,["51"] = 46,["52"] = 46,["53"] = 47,["54"] = 46,["55"] = 46,["56"] = 25});
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
function Game.prototype.SendEndGameInfo(self, lostTeamID)
    local gameInfo = __TS__New(GameInfo)
    gameInfo.lostTeamID = lostTeamID
    gameInfo.matchId = tostring(GameRules:Script_GetMatchID())
    local gameOption = CustomNetTables:GetTableValue("game_options_table", "game_option")
    if gameOption then
        gameInfo.gameOption = gameOption
    end
    do
        local i = 0
        while i < PlayerResource:GetPlayerCount() do
            if PlayerResource:IsValidPlayerID(i) then
                local player = __TS__New(Player)
                player.team = PlayerResource:GetTeam(i)
                player.steamId = PlayerResource:GetSteamAccountID(i)
                player.heroName = PlayerResource:GetSelectedHeroName(i)
                local ____gameInfo_players_0 = gameInfo.players
                ____gameInfo_players_0[#____gameInfo_players_0 + 1] = player
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
