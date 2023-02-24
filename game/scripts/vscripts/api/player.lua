local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 2,["9"] = 2,["10"] = 3,["11"] = 3,["12"] = 3,["13"] = 5,["14"] = 5,["15"] = 5,["17"] = 5,["18"] = 11,["19"] = 11,["20"] = 11,["22"] = 11,["23"] = 17,["24"] = 17,["25"] = 17,["27"] = 17,["28"] = 36,["29"] = 36,["31"] = 36,["32"] = 42,["33"] = 42,["34"] = 42,["36"] = 46,["37"] = 47,["38"] = 48,["39"] = 48,["40"] = 48,["41"] = 48,["42"] = 48,["43"] = 48,["44"] = 48,["45"] = 48,["46"] = 48,["47"] = 48,["48"] = 48,["49"] = 48,["50"] = 51,["51"] = 52,["52"] = 52,["55"] = 45,["56"] = 61,["57"] = 62,["58"] = 64,["60"] = 65,["61"] = 65,["62"] = 66,["63"] = 67,["65"] = 65,["68"] = 70,["69"] = 71,["70"] = 71,["71"] = 71,["72"] = 74,["73"] = 74,["74"] = 74,["75"] = 71,["76"] = 71,["77"] = 71,["78"] = 71,["79"] = 71,["80"] = 81,["81"] = 83,["82"] = 61,["83"] = 86,["84"] = 87,["85"] = 88,["86"] = 89,["87"] = 90,["88"] = 91,["89"] = 94,["90"] = 95,["91"] = 97,["92"] = 98,["93"] = 86,["94"] = 101,["95"] = 102,["96"] = 103,["98"] = 105,["99"] = 101,["100"] = 109,["101"] = 110,["102"] = 111,["105"] = 115,["106"] = 116,["107"] = 116,["108"] = 116,["109"] = 116,["110"] = 118,["111"] = 118,["112"] = 118,["114"] = 118,["117"] = 122,["118"] = 123,["120"] = 109,["121"] = 127,["123"] = 128,["124"] = 128,["125"] = 129,["126"] = 131,["127"] = 132,["128"] = 132,["129"] = 132,["130"] = 132,["131"] = 133,["132"] = 135,["133"] = 135,["134"] = 135,["135"] = 135,["136"] = 135,["139"] = 128,["142"] = 127,["143"] = 141,["145"] = 142,["146"] = 142,["147"] = 143,["148"] = 145,["149"] = 146,["150"] = 146,["151"] = 146,["152"] = 146,["153"] = 147,["154"] = 149,["155"] = 149,["156"] = 149,["157"] = 149,["158"] = 149,["161"] = 142,["164"] = 141,["165"] = 154,["166"] = 155,["167"] = 155,["168"] = 155,["169"] = 155,["170"] = 156,["171"] = 157,["173"] = 159,["174"] = 154,["175"] = 162,["176"] = 163,["177"] = 163,["178"] = 163,["179"] = 163,["180"] = 164,["181"] = 165,["183"] = 167,["184"] = 162,["185"] = 170,["186"] = 171,["187"] = 171,["188"] = 171,["189"] = 171,["190"] = 170,["191"] = 175,["192"] = 176,["193"] = 177,["194"] = 179,["195"] = 179,["196"] = 179,["197"] = 179,["198"] = 179,["199"] = 179,["200"] = 179,["201"] = 191,["202"] = 175,["203"] = 194,["204"] = 195,["205"] = 196,["206"] = 197,["207"] = 199,["208"] = 202,["209"] = 202,["210"] = 202,["211"] = 202,["212"] = 203,["213"] = 204,["214"] = 205,["216"] = 207,["217"] = 207,["218"] = 207,["219"] = 207,["220"] = 208,["221"] = 209,["223"] = 211,["224"] = 211,["226"] = 214,["228"] = 194,["229"] = 218,["230"] = 219,["231"] = 220,["232"] = 218,["233"] = 43,["234"] = 44});
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
