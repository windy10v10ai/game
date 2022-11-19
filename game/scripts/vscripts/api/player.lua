local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["7"] = 2,["8"] = 2,["9"] = 2,["10"] = 4,["11"] = 4,["13"] = 4,["14"] = 10,["15"] = 10,["16"] = 10,["18"] = 10,["19"] = 16,["20"] = 16,["21"] = 16,["23"] = 16,["24"] = 35,["25"] = 35,["27"] = 35,["28"] = 55,["29"] = 55,["30"] = 55,["32"] = 59,["33"] = 60,["34"] = 61,["35"] = 61,["36"] = 61,["37"] = 61,["38"] = 61,["39"] = 61,["40"] = 61,["41"] = 61,["42"] = 61,["43"] = 61,["44"] = 61,["45"] = 61,["46"] = 64,["47"] = 65,["48"] = 65,["51"] = 58,["52"] = 74,["53"] = 75,["54"] = 77,["56"] = 78,["57"] = 78,["58"] = 79,["59"] = 80,["61"] = 78,["64"] = 83,["65"] = 84,["66"] = 84,["67"] = 84,["68"] = 87,["69"] = 87,["70"] = 87,["71"] = 84,["72"] = 84,["73"] = 84,["74"] = 84,["75"] = 92,["76"] = 74,["77"] = 95,["78"] = 96,["79"] = 97,["80"] = 98,["81"] = 99,["82"] = 100,["83"] = 103,["84"] = 104,["85"] = 106,["86"] = 107,["87"] = 95,["88"] = 110,["89"] = 111,["90"] = 112,["92"] = 114,["93"] = 110,["94"] = 117,["96"] = 118,["97"] = 118,["98"] = 119,["99"] = 121,["100"] = 122,["101"] = 122,["102"] = 122,["103"] = 122,["104"] = 123,["105"] = 125,["106"] = 125,["107"] = 125,["108"] = 125,["109"] = 125,["112"] = 118,["115"] = 117,["116"] = 131,["118"] = 132,["119"] = 132,["120"] = 133,["121"] = 135,["122"] = 136,["123"] = 136,["124"] = 136,["125"] = 136,["126"] = 137,["127"] = 139,["128"] = 139,["129"] = 139,["130"] = 139,["131"] = 139,["134"] = 132,["137"] = 131,["138"] = 144,["139"] = 145,["140"] = 145,["141"] = 145,["142"] = 145,["143"] = 146,["144"] = 147,["146"] = 149,["147"] = 144,["148"] = 152,["149"] = 153,["150"] = 153,["151"] = 153,["152"] = 153,["153"] = 154,["154"] = 155,["156"] = 157,["157"] = 152,["158"] = 160,["159"] = 161,["160"] = 161,["161"] = 161,["162"] = 161,["163"] = 160,["164"] = 165,["165"] = 166,["166"] = 173,["167"] = 175,["168"] = 175,["169"] = 175,["170"] = 175,["171"] = 175,["172"] = 175,["173"] = 175,["174"] = 187,["175"] = 165,["176"] = 190,["177"] = 191,["178"] = 192,["179"] = 193,["180"] = 194,["181"] = 194,["182"] = 194,["183"] = 194,["184"] = 195,["185"] = 196,["186"] = 197,["187"] = 197,["188"] = 197,["189"] = 197,["190"] = 198,["191"] = 199,["193"] = 201,["194"] = 201,["197"] = 204,["199"] = 207,["201"] = 190,["202"] = 211,["203"] = 212,["204"] = 213,["205"] = 211,["206"] = 56,["207"] = 57});
local ____exports = {}
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
        failureFunc = self.InitFailure
    }
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
    local player = __TS__ArrayFind(
        ____exports.Player.playerList,
        function(____, p) return p.id == tostring(playerProperty.steamId) end
    )
    if player then
        if player.properties then
            local property = __TS__ArrayFind(
                player.properties,
                function(____, p) return p.name == playerProperty.name end
            )
            if property then
                property.level = playerProperty.level
            else
                local ____player_properties_1 = player.properties
                ____player_properties_1[#____player_properties_1 + 1] = playerProperty
            end
        else
            player.properties = {playerProperty}
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
