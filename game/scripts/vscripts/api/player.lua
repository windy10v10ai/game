local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["9"] = 1,["10"] = 1,["11"] = 2,["12"] = 2,["13"] = 2,["14"] = 4,["15"] = 4,["16"] = 4,["18"] = 4,["19"] = 10,["20"] = 10,["21"] = 10,["23"] = 10,["24"] = 16,["25"] = 16,["26"] = 16,["28"] = 16,["29"] = 32,["30"] = 32,["31"] = 32,["33"] = 32,["34"] = 42,["35"] = 42,["37"] = 42,["38"] = 49,["39"] = 49,["40"] = 49,["42"] = 55,["43"] = 54,["44"] = 70,["45"] = 71,["46"] = 75,["48"] = 76,["49"] = 76,["50"] = 77,["51"] = 78,["53"] = 76,["56"] = 81,["57"] = 82,["58"] = 82,["59"] = 82,["60"] = 85,["61"] = 85,["62"] = 85,["63"] = 82,["64"] = 82,["65"] = 82,["66"] = 82,["67"] = 82,["68"] = 92,["69"] = 94,["70"] = 70,["71"] = 97,["72"] = 98,["73"] = 99,["74"] = 100,["75"] = 101,["76"] = 102,["77"] = 103,["78"] = 104,["79"] = 106,["80"] = 113,["81"] = 114,["82"] = 116,["83"] = 118,["84"] = 119,["85"] = 97,["86"] = 124,["87"] = 125,["88"] = 126,["90"] = 128,["91"] = 124,["92"] = 133,["93"] = 134,["94"] = 135,["97"] = 139,["98"] = 140,["99"] = 140,["100"] = 140,["101"] = 140,["102"] = 144,["103"] = 144,["104"] = 144,["106"] = 144,["107"] = 145,["108"] = 146,["111"] = 133,["112"] = 151,["114"] = 152,["115"] = 152,["116"] = 153,["117"] = 155,["118"] = 156,["119"] = 156,["120"] = 156,["121"] = 156,["122"] = 157,["123"] = 159,["124"] = 159,["125"] = 159,["126"] = 159,["127"] = 159,["130"] = 152,["133"] = 151,["134"] = 169,["136"] = 170,["137"] = 170,["138"] = 171,["139"] = 173,["140"] = 174,["141"] = 174,["142"] = 174,["143"] = 174,["144"] = 177,["145"] = 179,["146"] = 179,["147"] = 179,["148"] = 179,["149"] = 179,["152"] = 170,["155"] = 169,["156"] = 189,["158"] = 190,["159"] = 190,["160"] = 191,["161"] = 193,["162"] = 194,["163"] = 194,["164"] = 194,["165"] = 194,["166"] = 197,["167"] = 199,["168"] = 199,["169"] = 199,["170"] = 199,["171"] = 199,["174"] = 190,["177"] = 189,["178"] = 208,["179"] = 209,["180"] = 209,["181"] = 209,["182"] = 209,["183"] = 210,["184"] = 211,["186"] = 213,["187"] = 208,["188"] = 216,["189"] = 217,["190"] = 217,["191"] = 217,["192"] = 217,["193"] = 218,["194"] = 219,["196"] = 221,["197"] = 216,["198"] = 224,["199"] = 225,["200"] = 225,["201"] = 225,["202"] = 225,["203"] = 224,["204"] = 231,["205"] = 236,["206"] = 239,["207"] = 241,["208"] = 241,["209"] = 241,["210"] = 241,["211"] = 241,["212"] = 241,["213"] = 241,["214"] = 253,["215"] = 231,["216"] = 256,["217"] = 257,["218"] = 258,["219"] = 259,["220"] = 261,["221"] = 264,["222"] = 264,["223"] = 264,["224"] = 264,["225"] = 267,["226"] = 268,["227"] = 269,["229"] = 271,["230"] = 271,["231"] = 271,["232"] = 271,["233"] = 274,["234"] = 275,["236"] = 277,["237"] = 277,["239"] = 280,["241"] = 256,["242"] = 284,["243"] = 285,["244"] = 286,["245"] = 284,["246"] = 50,["247"] = 51,["248"] = 53});
local ____exports = {}
local ____property_controller = require("modifiers.property.property_controller")
local PropertyController = ____property_controller.PropertyController
local ____api_client = require("api.api_client")
local ApiClient = ____api_client.ApiClient
local HttpMethod = ____api_client.HttpMethod
____exports.MemberDto = __TS__Class()
local MemberDto = ____exports.MemberDto
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
____exports.PointInfoDto = __TS__Class()
local PointInfoDto = ____exports.PointInfoDto
PointInfoDto.name = "PointInfoDto"
function PointInfoDto.prototype.____constructor(self)
end
local GameStart = __TS__Class()
GameStart.name = "GameStart"
function GameStart.prototype.____constructor(self)
end
____exports.Player = __TS__Class()
local Player = ____exports.Player
Player.name = "Player"
function Player.prototype.____constructor(self)
    self:RegisterListener()
end
function Player.prototype.Init(self)
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
    local apiParameter = {
        method = HttpMethod.GET,
        path = ApiClient.GAME_START_URL,
        querys = {
            steamIds = table.concat(steamIds, ","),
            matchId = matchId
        },
        successFunc = self.InitSuccess,
        failureFunc = self.InitFailure,
        retryTimes = 6
    }
    __TS__New(PropertyController)
    ApiClient:sendWithRetry(apiParameter)
end
function Player.prototype.InitSuccess(self, data)
    print("[Player] Init callback data " .. data)
    local gameStart = json.decode(data)
    DeepPrintTable(gameStart)
    ____exports.Player.memberList = gameStart.members
    ____exports.Player.playerList = gameStart.players
    ____exports.Player.pointInfoList = gameStart.pointInfo
    local top100SteamIds = gameStart.top100SteamIds
    CustomNetTables:SetTableValue("leader_board", "top100SteamIds", top100SteamIds)
    ____exports.Player:savePlayerToNetTable()
    ____exports.Player:saveMemberToNetTable()
    ____exports.Player:savePointInfoToNetTable()
    local status = #____exports.Player.playerList > 0 and 2 or 3
    CustomNetTables:SetTableValue("loading_status", "loading_status", {status = status})
end
function Player.prototype.InitFailure(self, _)
    if IsInToolsMode() then
        ____exports.Player:saveMemberToNetTable()
    end
    CustomNetTables:SetTableValue("loading_status", "loading_status", {status = 3})
end
function Player.prototype.InitPlayerProperty(self, hero)
    print("[Player] InitPlayerProperty " .. hero:GetUnitName())
    if not hero then
        return
    end
    local steamId = PlayerResource:GetSteamAccountID(hero:GetPlayerOwnerID())
    local playerInfo = __TS__ArrayFind(
        ____exports.Player.playerList,
        function(____, player) return player.id == tostring(steamId) end
    )
    local ____playerInfo_properties_0 = playerInfo
    if ____playerInfo_properties_0 ~= nil then
        ____playerInfo_properties_0 = ____playerInfo_properties_0.properties
    end
    if ____playerInfo_properties_0 then
        for ____, property in ipairs(playerInfo.properties) do
            PropertyController:addModifier(hero, property)
        end
    end
end
function Player.saveMemberToNetTable(self)
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
function Player.savePointInfoToNetTable(self)
    do
        local i = 0
        while i < PlayerResource:GetPlayerCount() do
            if PlayerResource:IsValidPlayer(i) then
                local steamId = PlayerResource:GetSteamAccountID(i)
                local steamIdPointInfoList = __TS__ArrayFilter(
                    ____exports.Player.pointInfoList,
                    function(____, p) return p.steamId == steamId end
                )
                if #steamIdPointInfoList > 0 then
                    CustomNetTables:SetTableValue(
                        "point_info",
                        tostring(steamId),
                        steamIdPointInfoList
                    )
                end
            end
            i = i + 1
        end
    end
end
function Player.savePlayerToNetTable(self)
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
function Player.prototype.RegisterListener(self)
    CustomGameEventManager:RegisterListener(
        "player_property_levelup",
        function(_, event) return self:onPlayerPropertyLevelup(event) end
    )
end
function Player.prototype.onPlayerPropertyLevelup(self, event)
    print((((("[Player] onPlayerPropertyLevelup " .. tostring(event.PlayerID)) .. " ") .. event.name) .. " ") .. event.level)
    local steamId = PlayerResource:GetSteamAccountID(event.PlayerID)
    local apiParameter = {
        method = HttpMethod.PUT,
        path = ApiClient.ADD_PLAYER_PROPERTY_URL,
        body = {steamId = steamId, name = event.name, level = event.level},
        successFunc = self.PropertyLevelupSuccess,
        failureFunc = self.PropertyLevelupFailure
    }
    ApiClient:sendWithRetry(apiParameter)
end
function Player.prototype.PropertyLevelupSuccess(self, data)
    print("[Player] Property Levelup Success data " .. data)
    local playerProperty = json.decode(data)
    DeepPrintTable(playerProperty)
    PropertyController:RefreshPlayerProperty(playerProperty)
    local player = __TS__ArrayFind(
        ____exports.Player.playerList,
        function(____, p) return p.id == tostring(playerProperty.steamId) end
    )
    if player then
        if not player.properties then
            player.properties = {}
        end
        local property = __TS__ArrayFind(
            player.properties,
            function(____, p) return p.name == playerProperty.name end
        )
        if property then
            property.level = playerProperty.level
        else
            local ____player_properties_2 = player.properties
            ____player_properties_2[#____player_properties_2 + 1] = playerProperty
        end
        CustomNetTables:SetTableValue("player_table", player.id, player)
    end
end
function Player.prototype.PropertyLevelupFailure(self, data)
    print("[Player] Property Levelup Failure data " .. data)
    ____exports.Player:savePlayerToNetTable()
end
Player.memberList = {}
Player.playerList = {}
Player.pointInfoList = {}
return ____exports
