local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 2,["9"] = 2,["10"] = 3,["11"] = 3,["12"] = 3,["13"] = 5,["14"] = 5,["15"] = 5,["17"] = 5,["18"] = 11,["19"] = 11,["20"] = 11,["22"] = 11,["23"] = 17,["24"] = 17,["25"] = 17,["27"] = 17,["28"] = 36,["29"] = 36,["31"] = 36,["32"] = 42,["33"] = 42,["34"] = 42,["36"] = 46,["37"] = 45,["38"] = 61,["39"] = 62,["40"] = 64,["42"] = 65,["43"] = 65,["44"] = 66,["45"] = 67,["47"] = 65,["50"] = 70,["51"] = 71,["52"] = 71,["53"] = 71,["54"] = 74,["55"] = 74,["56"] = 74,["57"] = 71,["58"] = 71,["59"] = 71,["60"] = 71,["61"] = 71,["62"] = 81,["63"] = 83,["64"] = 61,["65"] = 86,["66"] = 87,["67"] = 88,["68"] = 89,["69"] = 90,["70"] = 91,["71"] = 94,["72"] = 95,["73"] = 97,["74"] = 98,["75"] = 86,["76"] = 101,["77"] = 102,["78"] = 103,["80"] = 105,["81"] = 101,["82"] = 109,["83"] = 110,["84"] = 111,["87"] = 115,["88"] = 116,["89"] = 116,["90"] = 116,["91"] = 116,["92"] = 118,["93"] = 118,["94"] = 118,["96"] = 118,["97"] = 119,["98"] = 120,["101"] = 109,["102"] = 125,["104"] = 126,["105"] = 126,["106"] = 127,["107"] = 129,["108"] = 130,["109"] = 130,["110"] = 130,["111"] = 130,["112"] = 131,["113"] = 133,["114"] = 133,["115"] = 133,["116"] = 133,["117"] = 133,["120"] = 126,["123"] = 125,["124"] = 139,["126"] = 140,["127"] = 140,["128"] = 141,["129"] = 143,["130"] = 144,["131"] = 144,["132"] = 144,["133"] = 144,["134"] = 145,["135"] = 147,["136"] = 147,["137"] = 147,["138"] = 147,["139"] = 147,["142"] = 140,["145"] = 139,["146"] = 152,["147"] = 153,["148"] = 153,["149"] = 153,["150"] = 153,["151"] = 154,["152"] = 155,["154"] = 157,["155"] = 152,["156"] = 160,["157"] = 161,["158"] = 161,["159"] = 161,["160"] = 161,["161"] = 162,["162"] = 163,["164"] = 165,["165"] = 160,["166"] = 168,["167"] = 169,["168"] = 169,["169"] = 169,["170"] = 169,["171"] = 168,["172"] = 173,["173"] = 174,["174"] = 175,["175"] = 177,["176"] = 177,["177"] = 177,["178"] = 177,["179"] = 177,["180"] = 177,["181"] = 177,["182"] = 189,["183"] = 173,["184"] = 192,["185"] = 193,["186"] = 194,["187"] = 195,["188"] = 197,["189"] = 200,["190"] = 200,["191"] = 200,["192"] = 200,["193"] = 201,["194"] = 202,["195"] = 203,["197"] = 205,["198"] = 205,["199"] = 205,["200"] = 205,["201"] = 206,["202"] = 207,["204"] = 209,["205"] = 209,["207"] = 212,["209"] = 192,["210"] = 216,["211"] = 217,["212"] = 218,["213"] = 216,["214"] = 43,["215"] = 44});
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
    ____exports.Player:savePlayerToNetTable()
    ____exports.Player:saveMemberToNetTable()
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
return ____exports
