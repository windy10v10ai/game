local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["9"] = 2,["10"] = 2,["11"] = 3,["12"] = 3,["13"] = 3,["14"] = 5,["15"] = 5,["16"] = 5,["18"] = 5,["19"] = 11,["20"] = 11,["21"] = 11,["23"] = 11,["24"] = 17,["25"] = 17,["26"] = 17,["28"] = 17,["29"] = 34,["30"] = 34,["31"] = 34,["33"] = 34,["34"] = 44,["35"] = 44,["37"] = 44,["38"] = 51,["39"] = 51,["40"] = 51,["42"] = 57,["43"] = 56,["44"] = 72,["45"] = 73,["46"] = 75,["48"] = 76,["49"] = 76,["50"] = 77,["51"] = 78,["53"] = 76,["56"] = 81,["57"] = 82,["58"] = 82,["59"] = 82,["60"] = 85,["61"] = 85,["62"] = 85,["63"] = 82,["64"] = 82,["65"] = 82,["66"] = 82,["67"] = 82,["68"] = 92,["69"] = 94,["70"] = 72,["71"] = 97,["72"] = 98,["73"] = 99,["74"] = 100,["75"] = 101,["76"] = 102,["77"] = 103,["78"] = 104,["79"] = 106,["80"] = 109,["81"] = 110,["82"] = 112,["83"] = 114,["84"] = 115,["85"] = 97,["86"] = 118,["87"] = 119,["88"] = 120,["90"] = 122,["91"] = 118,["92"] = 126,["93"] = 127,["94"] = 128,["97"] = 132,["98"] = 133,["99"] = 133,["100"] = 133,["101"] = 133,["102"] = 135,["103"] = 135,["104"] = 135,["106"] = 135,["107"] = 136,["108"] = 137,["111"] = 126,["112"] = 142,["114"] = 143,["115"] = 143,["116"] = 144,["117"] = 146,["118"] = 147,["119"] = 147,["120"] = 147,["121"] = 147,["122"] = 148,["123"] = 150,["124"] = 150,["125"] = 150,["126"] = 150,["127"] = 150,["130"] = 143,["133"] = 142,["134"] = 156,["136"] = 157,["137"] = 157,["138"] = 158,["139"] = 160,["140"] = 161,["141"] = 161,["142"] = 161,["143"] = 161,["144"] = 162,["145"] = 164,["146"] = 164,["147"] = 164,["148"] = 164,["149"] = 164,["152"] = 157,["155"] = 156,["156"] = 170,["158"] = 171,["159"] = 171,["160"] = 172,["161"] = 174,["162"] = 175,["163"] = 175,["164"] = 175,["165"] = 175,["166"] = 176,["167"] = 178,["168"] = 178,["169"] = 178,["170"] = 178,["171"] = 178,["174"] = 171,["177"] = 170,["178"] = 183,["179"] = 184,["180"] = 184,["181"] = 184,["182"] = 184,["183"] = 185,["184"] = 186,["186"] = 188,["187"] = 183,["188"] = 191,["189"] = 192,["190"] = 192,["191"] = 192,["192"] = 192,["193"] = 193,["194"] = 194,["196"] = 196,["197"] = 191,["198"] = 199,["199"] = 200,["200"] = 200,["201"] = 200,["202"] = 200,["203"] = 199,["204"] = 204,["205"] = 205,["206"] = 206,["207"] = 208,["208"] = 208,["209"] = 208,["210"] = 208,["211"] = 208,["212"] = 208,["213"] = 208,["214"] = 220,["215"] = 204,["216"] = 223,["217"] = 224,["218"] = 225,["219"] = 226,["220"] = 228,["221"] = 231,["222"] = 231,["223"] = 231,["224"] = 231,["225"] = 232,["226"] = 233,["227"] = 234,["229"] = 236,["230"] = 236,["231"] = 236,["232"] = 236,["233"] = 237,["234"] = 238,["236"] = 240,["237"] = 240,["239"] = 243,["241"] = 223,["242"] = 247,["243"] = 248,["244"] = 249,["245"] = 247,["246"] = 52,["247"] = 53,["248"] = 55});
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
function Player.prototype.InitFailure(self, data)
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
