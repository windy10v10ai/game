local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayJoin = ____lualib.__TS__ArrayJoin
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["10"] = 1,["11"] = 1,["12"] = 2,["13"] = 2,["14"] = 2,["15"] = 4,["16"] = 4,["17"] = 4,["19"] = 4,["20"] = 10,["21"] = 10,["22"] = 10,["24"] = 10,["25"] = 16,["26"] = 16,["27"] = 16,["29"] = 16,["30"] = 32,["31"] = 32,["32"] = 32,["34"] = 32,["35"] = 43,["36"] = 43,["38"] = 43,["39"] = 50,["40"] = 50,["41"] = 50,["43"] = 56,["44"] = 55,["45"] = 71,["46"] = 72,["47"] = 76,["49"] = 77,["50"] = 77,["51"] = 78,["52"] = 79,["54"] = 77,["57"] = 82,["58"] = 83,["59"] = 83,["60"] = 83,["61"] = 86,["62"] = 86,["63"] = 86,["64"] = 83,["65"] = 83,["66"] = 83,["67"] = 83,["68"] = 83,["69"] = 93,["70"] = 95,["71"] = 71,["72"] = 98,["73"] = 99,["74"] = 100,["75"] = 101,["76"] = 102,["77"] = 103,["78"] = 104,["79"] = 105,["80"] = 107,["81"] = 110,["82"] = 111,["83"] = 113,["84"] = 115,["85"] = 116,["86"] = 98,["87"] = 121,["88"] = 122,["89"] = 123,["91"] = 125,["92"] = 121,["93"] = 130,["94"] = 131,["95"] = 132,["98"] = 136,["99"] = 137,["100"] = 137,["101"] = 137,["102"] = 137,["103"] = 139,["104"] = 139,["105"] = 139,["107"] = 139,["108"] = 140,["109"] = 141,["112"] = 130,["113"] = 146,["115"] = 147,["116"] = 147,["117"] = 148,["118"] = 150,["119"] = 151,["120"] = 151,["121"] = 151,["122"] = 151,["123"] = 152,["124"] = 154,["125"] = 154,["126"] = 154,["127"] = 154,["128"] = 154,["131"] = 147,["134"] = 146,["135"] = 160,["137"] = 161,["138"] = 161,["139"] = 162,["140"] = 164,["141"] = 165,["142"] = 165,["143"] = 165,["144"] = 165,["145"] = 166,["146"] = 168,["147"] = 168,["148"] = 168,["149"] = 168,["150"] = 168,["153"] = 161,["156"] = 160,["157"] = 174,["159"] = 175,["160"] = 175,["161"] = 176,["162"] = 178,["163"] = 179,["164"] = 179,["165"] = 179,["166"] = 179,["167"] = 180,["168"] = 182,["169"] = 182,["170"] = 182,["171"] = 182,["172"] = 182,["175"] = 175,["178"] = 174,["179"] = 188,["180"] = 189,["181"] = 189,["182"] = 189,["183"] = 189,["184"] = 190,["185"] = 191,["187"] = 193,["188"] = 188,["189"] = 196,["190"] = 197,["191"] = 197,["192"] = 197,["193"] = 197,["194"] = 198,["195"] = 199,["197"] = 201,["198"] = 196,["199"] = 204,["200"] = 205,["201"] = 205,["202"] = 205,["203"] = 205,["204"] = 204,["205"] = 211,["206"] = 212,["207"] = 213,["208"] = 215,["209"] = 215,["210"] = 215,["211"] = 215,["212"] = 215,["213"] = 215,["214"] = 215,["215"] = 227,["216"] = 211,["217"] = 230,["218"] = 231,["219"] = 232,["220"] = 233,["221"] = 235,["222"] = 238,["223"] = 238,["224"] = 238,["225"] = 238,["226"] = 239,["227"] = 240,["228"] = 241,["230"] = 243,["231"] = 243,["232"] = 243,["233"] = 243,["234"] = 244,["235"] = 245,["237"] = 247,["238"] = 247,["240"] = 250,["242"] = 230,["243"] = 254,["244"] = 255,["245"] = 256,["246"] = 254,["247"] = 51,["248"] = 52,["249"] = 54});
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
            steamIds = __TS__ArrayJoin(steamIds, ","),
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
