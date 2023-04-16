local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 2,["9"] = 2,["10"] = 3,["11"] = 3,["12"] = 3,["13"] = 5,["14"] = 5,["15"] = 5,["17"] = 5,["18"] = 11,["19"] = 11,["20"] = 11,["22"] = 11,["23"] = 17,["24"] = 17,["25"] = 17,["27"] = 17,["28"] = 36,["29"] = 36,["31"] = 36,["32"] = 43,["33"] = 43,["34"] = 43,["36"] = 47,["37"] = 46,["38"] = 62,["39"] = 63,["40"] = 65,["42"] = 66,["43"] = 66,["44"] = 67,["45"] = 68,["47"] = 66,["50"] = 71,["51"] = 72,["52"] = 72,["53"] = 72,["54"] = 75,["55"] = 75,["56"] = 75,["57"] = 72,["58"] = 72,["59"] = 72,["60"] = 72,["61"] = 72,["62"] = 82,["63"] = 84,["64"] = 62,["65"] = 87,["66"] = 88,["67"] = 89,["68"] = 90,["69"] = 91,["70"] = 92,["71"] = 93,["72"] = 95,["73"] = 98,["74"] = 99,["75"] = 101,["76"] = 102,["77"] = 87,["78"] = 105,["79"] = 106,["80"] = 107,["82"] = 109,["83"] = 105,["84"] = 113,["85"] = 114,["86"] = 115,["89"] = 119,["90"] = 120,["91"] = 120,["92"] = 120,["93"] = 120,["94"] = 122,["95"] = 122,["96"] = 122,["98"] = 122,["99"] = 123,["100"] = 124,["103"] = 113,["104"] = 129,["106"] = 130,["107"] = 130,["108"] = 131,["109"] = 133,["110"] = 134,["111"] = 134,["112"] = 134,["113"] = 134,["114"] = 135,["115"] = 137,["116"] = 137,["117"] = 137,["118"] = 137,["119"] = 137,["122"] = 130,["125"] = 129,["126"] = 143,["128"] = 144,["129"] = 144,["130"] = 145,["131"] = 147,["132"] = 148,["133"] = 148,["134"] = 148,["135"] = 148,["136"] = 149,["137"] = 151,["138"] = 151,["139"] = 151,["140"] = 151,["141"] = 151,["144"] = 144,["147"] = 143,["148"] = 156,["149"] = 157,["150"] = 157,["151"] = 157,["152"] = 157,["153"] = 158,["154"] = 159,["156"] = 161,["157"] = 156,["158"] = 164,["159"] = 165,["160"] = 165,["161"] = 165,["162"] = 165,["163"] = 166,["164"] = 167,["166"] = 169,["167"] = 164,["168"] = 172,["169"] = 173,["170"] = 173,["171"] = 173,["172"] = 173,["173"] = 172,["174"] = 177,["175"] = 178,["176"] = 179,["177"] = 181,["178"] = 181,["179"] = 181,["180"] = 181,["181"] = 181,["182"] = 181,["183"] = 181,["184"] = 193,["185"] = 177,["186"] = 196,["187"] = 197,["188"] = 198,["189"] = 199,["190"] = 201,["191"] = 204,["192"] = 204,["193"] = 204,["194"] = 204,["195"] = 205,["196"] = 206,["197"] = 207,["199"] = 209,["200"] = 209,["201"] = 209,["202"] = 209,["203"] = 210,["204"] = 211,["206"] = 213,["207"] = 213,["209"] = 216,["211"] = 196,["212"] = 220,["213"] = 221,["214"] = 222,["215"] = 220,["216"] = 44,["217"] = 45});
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
    local top100SteamIds = gameStart.top100SteamIds
    CustomNetTables:SetTableValue("leader_board", "top100SteamIds", top100SteamIds)
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
