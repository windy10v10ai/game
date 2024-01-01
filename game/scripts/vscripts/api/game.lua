local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 1,["8"] = 1,["9"] = 1,["10"] = 3,["11"] = 3,["13"] = 3,["14"] = 12,["15"] = 12,["17"] = 19,["18"] = 20,["19"] = 18,["20"] = 24,["21"] = 24,["23"] = 29,["24"] = 28,["25"] = 33,["26"] = 33,["27"] = 33,["29"] = 35,["30"] = 37,["31"] = 39,["34"] = 45,["35"] = 49,["36"] = 50,["37"] = 51,["38"] = 52,["39"] = 53,["40"] = 55,["42"] = 57,["43"] = 57,["45"] = 58,["46"] = 59,["47"] = 60,["49"] = 62,["50"] = 63,["51"] = 64,["52"] = 65,["53"] = 66,["54"] = 67,["55"] = 68,["56"] = 68,["59"] = 57,["62"] = 70,["63"] = 70,["64"] = 70,["65"] = 70,["66"] = 74,["67"] = 75,["68"] = 78,["69"] = 70,["70"] = 80,["71"] = 81,["72"] = 84,["73"] = 70,["74"] = 70,["75"] = 88,["76"] = 37,["77"] = 34});
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
    DeepPrintTable(endData)
    do
        local i = -1
        while i < #endData.players do
            do
                local player = endData.players[i + 1]
                if player == nil then
                    goto __continue8
                end
                local newPlayer = __TS__New(Player)
                newPlayer.teamId = player.teamId
                newPlayer.steamId = player.steamAccountID
                newPlayer.heroName = player.heroName
                newPlayer.points = player.points
                newPlayer.isDisconnect = player.isDisconnect
                local ____gameInfo_players_0 = gameInfo.players
                ____gameInfo_players_0[#____gameInfo_players_0 + 1] = newPlayer
            end
            ::__continue8::
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
