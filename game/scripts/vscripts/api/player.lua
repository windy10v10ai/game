local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 2,["9"] = 2,["10"] = 3,["11"] = 3,["12"] = 3,["13"] = 5,["14"] = 5,["16"] = 5,["17"] = 11,["18"] = 11,["19"] = 11,["21"] = 11,["22"] = 17,["23"] = 17,["24"] = 17,["26"] = 17,["27"] = 36,["28"] = 36,["30"] = 36,["31"] = 56,["32"] = 56,["33"] = 56,["35"] = 60,["36"] = 61,["37"] = 62,["38"] = 62,["39"] = 62,["40"] = 62,["41"] = 62,["42"] = 62,["43"] = 62,["44"] = 62,["45"] = 62,["46"] = 62,["47"] = 62,["48"] = 62,["49"] = 65,["50"] = 66,["51"] = 66,["54"] = 59,["55"] = 75,["56"] = 76,["57"] = 78,["59"] = 79,["60"] = 79,["61"] = 80,["62"] = 81,["64"] = 79,["67"] = 84,["68"] = 85,["69"] = 85,["70"] = 85,["71"] = 88,["72"] = 88,["73"] = 88,["74"] = 85,["75"] = 85,["76"] = 85,["77"] = 85,["78"] = 85,["79"] = 95,["80"] = 97,["81"] = 75,["82"] = 100,["83"] = 101,["84"] = 102,["85"] = 103,["86"] = 104,["87"] = 105,["88"] = 108,["89"] = 109,["90"] = 111,["91"] = 112,["92"] = 100,["93"] = 115,["94"] = 116,["95"] = 117,["97"] = 119,["98"] = 115,["99"] = 123,["100"] = 124,["101"] = 125,["104"] = 129,["105"] = 130,["106"] = 130,["107"] = 130,["108"] = 130,["109"] = 132,["110"] = 132,["111"] = 132,["113"] = 132,["116"] = 136,["117"] = 137,["119"] = 123,["120"] = 141,["122"] = 142,["123"] = 142,["124"] = 143,["125"] = 145,["126"] = 146,["127"] = 146,["128"] = 146,["129"] = 146,["130"] = 147,["131"] = 149,["132"] = 149,["133"] = 149,["134"] = 149,["135"] = 149,["138"] = 142,["141"] = 141,["142"] = 155,["144"] = 156,["145"] = 156,["146"] = 157,["147"] = 159,["148"] = 160,["149"] = 160,["150"] = 160,["151"] = 160,["152"] = 161,["153"] = 163,["154"] = 163,["155"] = 163,["156"] = 163,["157"] = 163,["160"] = 156,["163"] = 155,["164"] = 168,["165"] = 169,["166"] = 169,["167"] = 169,["168"] = 169,["169"] = 170,["170"] = 171,["172"] = 173,["173"] = 168,["174"] = 176,["175"] = 177,["176"] = 177,["177"] = 177,["178"] = 177,["179"] = 178,["180"] = 179,["182"] = 181,["183"] = 176,["184"] = 184,["185"] = 185,["186"] = 185,["187"] = 185,["188"] = 185,["189"] = 184,["190"] = 189,["191"] = 190,["192"] = 191,["193"] = 193,["194"] = 193,["195"] = 193,["196"] = 193,["197"] = 193,["198"] = 193,["199"] = 193,["200"] = 205,["201"] = 189,["202"] = 208,["203"] = 209,["204"] = 210,["205"] = 211,["206"] = 213,["207"] = 216,["208"] = 216,["209"] = 216,["210"] = 216,["211"] = 217,["212"] = 218,["213"] = 219,["215"] = 221,["216"] = 221,["217"] = 221,["218"] = 221,["219"] = 222,["220"] = 223,["222"] = 225,["223"] = 225,["225"] = 228,["227"] = 208,["228"] = 232,["229"] = 233,["230"] = 234,["231"] = 232,["232"] = 57,["233"] = 58});
local ____exports = {}
local ____property_controller = require("modifiers.property.property_controller")
local PropertyController = ____property_controller.PropertyController
local ____api_client = require("api.api_client")
local ApiClient = ____api_client.ApiClient
local HttpMethod = ____api_client.HttpMethod
local MemberDto = __TS__Class()
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
    if IsInToolsMode() then
        local developSteamAccountIds = {
            136407523,
            1194383041,
            143575444,
            314757913,
            385130282,
            967052298,
            1159610111,
            353885092,
            245559423,
            916506173
        }
        for ____, steamId in ipairs(developSteamAccountIds) do
            local ____exports_Player_memberList_0 = ____exports.Player.memberList
            ____exports_Player_memberList_0[#____exports_Player_memberList_0 + 1] = {steamId = steamId, enable = true, expireDateString = "2099-12-31"}
        end
    end
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
    local ____playerInfo_properties_1 = playerInfo
    if ____playerInfo_properties_1 ~= nil then
        ____playerInfo_properties_1 = ____playerInfo_properties_1.properties
    end
    if not ____playerInfo_properties_1 then
        return
    end
    for ____, property in ipairs(playerInfo.properties) do
        PropertyController:addModifier(hero, property)
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
            local ____player_properties_3 = player.properties
            ____player_properties_3[#____player_properties_3 + 1] = playerProperty
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
