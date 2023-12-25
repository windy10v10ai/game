local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["9"] = 1,["10"] = 1,["11"] = 2,["12"] = 2,["13"] = 2,["14"] = 4,["15"] = 4,["16"] = 4,["18"] = 4,["19"] = 10,["20"] = 10,["21"] = 10,["23"] = 10,["24"] = 16,["25"] = 16,["26"] = 16,["28"] = 16,["29"] = 32,["30"] = 32,["31"] = 32,["33"] = 32,["34"] = 43,["35"] = 43,["37"] = 43,["38"] = 50,["39"] = 50,["40"] = 50,["42"] = 56,["43"] = 55,["44"] = 71,["45"] = 72,["46"] = 76,["48"] = 77,["49"] = 77,["50"] = 78,["51"] = 79,["53"] = 77,["56"] = 82,["57"] = 83,["58"] = 83,["59"] = 83,["60"] = 86,["61"] = 86,["62"] = 86,["63"] = 83,["64"] = 83,["65"] = 83,["66"] = 83,["67"] = 83,["68"] = 93,["69"] = 95,["70"] = 71,["71"] = 98,["72"] = 99,["73"] = 100,["74"] = 101,["75"] = 102,["76"] = 103,["77"] = 104,["78"] = 105,["79"] = 107,["80"] = 110,["81"] = 111,["82"] = 113,["83"] = 115,["84"] = 116,["85"] = 98,["86"] = 121,["87"] = 122,["88"] = 123,["90"] = 125,["91"] = 121,["92"] = 130,["93"] = 131,["94"] = 132,["97"] = 136,["98"] = 137,["99"] = 137,["100"] = 137,["101"] = 137,["102"] = 139,["103"] = 139,["104"] = 139,["106"] = 139,["107"] = 140,["108"] = 141,["111"] = 130,["112"] = 146,["114"] = 147,["115"] = 147,["116"] = 148,["117"] = 150,["118"] = 151,["119"] = 151,["120"] = 151,["121"] = 151,["122"] = 152,["123"] = 154,["124"] = 154,["125"] = 154,["126"] = 154,["127"] = 154,["130"] = 147,["133"] = 146,["134"] = 160,["136"] = 161,["137"] = 161,["138"] = 162,["139"] = 164,["140"] = 165,["141"] = 165,["142"] = 165,["143"] = 165,["144"] = 166,["145"] = 168,["146"] = 168,["147"] = 168,["148"] = 168,["149"] = 168,["152"] = 161,["155"] = 160,["156"] = 174,["158"] = 175,["159"] = 175,["160"] = 176,["161"] = 178,["162"] = 179,["163"] = 179,["164"] = 179,["165"] = 179,["166"] = 180,["167"] = 182,["168"] = 182,["169"] = 182,["170"] = 182,["171"] = 182,["174"] = 175,["177"] = 174,["178"] = 188,["179"] = 189,["180"] = 189,["181"] = 189,["182"] = 189,["183"] = 190,["184"] = 191,["186"] = 193,["187"] = 188,["188"] = 196,["189"] = 197,["190"] = 197,["191"] = 197,["192"] = 197,["193"] = 198,["194"] = 199,["196"] = 201,["197"] = 196,["198"] = 204,["199"] = 205,["200"] = 205,["201"] = 205,["202"] = 205,["203"] = 204,["204"] = 211,["205"] = 212,["206"] = 213,["207"] = 215,["208"] = 215,["209"] = 215,["210"] = 215,["211"] = 215,["212"] = 215,["213"] = 215,["214"] = 227,["215"] = 211,["216"] = 230,["217"] = 231,["218"] = 232,["219"] = 233,["220"] = 235,["221"] = 238,["222"] = 238,["223"] = 238,["224"] = 238,["225"] = 239,["226"] = 240,["227"] = 241,["229"] = 243,["230"] = 243,["231"] = 243,["232"] = 243,["233"] = 244,["234"] = 245,["236"] = 247,["237"] = 247,["239"] = 250,["241"] = 230,["242"] = 254,["243"] = 255,["244"] = 256,["245"] = 254,["246"] = 51,["247"] = 52,["248"] = 54});
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
