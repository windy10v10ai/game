local dropTable = nil

local function CreateItemLocal(sItemName, hEntity)
    local item = CreateItem(sItemName, nil, nil)
    local pos = hEntity:GetAbsOrigin()
    CreateItemOnPositionSync(pos, item)
    local pos_launch = pos + RandomVector(RandomFloat(150, 200))
    item:LaunchLoot(false, 200, 0.75, pos_launch, nil)
end

local function RollDrops(hHero)
    if not dropTable then
        dropTable = LoadKeyValues("scripts/kv/item_drops.kv")
    end
    for item_name, chance in pairs(dropTable) do
        for i = 0, 8 do
            local hItem = hHero:GetItemInSlot(i)
            if hItem then
                local hItem_name = hItem:GetName()
                if item_name == hItem_name then
                    if RollPercentage(chance) then
                        -- Remove the item
                        -- hHero:RemoveItem(hItem)
                        UTIL_RemoveImmediate(hItem)
                        -- Create the item
                        if item_name == "item_excalibur" then
                            CreateItemLocal(item_name, hHero)
                        end
                    end
                end
            end
        end
    end
end

-- REFACTORED: RecordBarrackKilled and RecordTowerKilled moved to TypeScript
-- See: src/vscripts/modules/event/event-entity-killed.ts
-- local tDOTARespawnTime = { 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64 }
local function HeroKilled(keys)
    local hHero = EntIndexToHScript(keys.entindex_killed)
    local attacker = EntIndexToHScript(keys.entindex_attacker)
    local playerId = hHero:GetPlayerID() -- 死亡玩家id
    local attackerPlayer = attacker:GetPlayerOwner()
    local attackerPlayerID = -1
    if attackerPlayer then
        attackerPlayerID = attackerPlayer:GetPlayerID()
    end

    local iLevel = hHero:GetLevel()
    local GameTime = GameRules:GetDOTATime(false, false)

    -- 玩家团队奖励逻辑
    if attackerPlayer and IsGoodTeamPlayer(attackerPlayerID) and IsBadTeamPlayer(playerId) then
        -- 前期增长慢，电脑等级较高时，增长快
        local gold = 0
        if iLevel <= 30 then
            gold = 5 + iLevel * 0.5
        elseif iLevel <= 50 then
            gold = 20 + (iLevel - 30) * 1
        else
            gold = 40
        end
        gold = math.ceil(gold)
        for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
            if attackerPlayerID ~= playerID and PlayerResource:IsValidPlayerID(playerID) and PlayerResource:IsValidPlayer(playerID) and
                PlayerResource:GetSelectedHeroEntity(playerID) and IsGoodTeamPlayer(playerID) then
                GameRules:ModifyGoldFiltered(playerID, gold, true, DOTA_ModifyGold_HeroKill)
                local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)
                SendOverheadEventMessage(playerHero, OVERHEAD_ALERT_GOLD, playerHero,
                    gold * AIGameMode:GetPlayerGoldXpMultiplier(playerID), playerHero)
            end
        end
    end

    -- AI连续死亡记录
    if attackerPlayer and IsGoodTeamPlayer(attackerPlayerID) and IsBadTeamPlayer(playerId) then
        if AIGameMode.BotRecordSuccessiveDeathTable[playerId] then
            AIGameMode.BotRecordSuccessiveDeathTable[playerId] = AIGameMode.BotRecordSuccessiveDeathTable[playerId] + 1
        else
            AIGameMode.BotRecordSuccessiveDeathTable[playerId] = 1
        end
    end

    -- AI连续死亡记录清零
    if attackerPlayer and IsBadTeamPlayer(attackerPlayerID) and IsGoodTeamPlayer(playerId) then
        AIGameMode.BotRecordSuccessiveDeathTable[attackerPlayerID] = 0
    end

    -- AI连死补偿
    -- AI 50级后不再补偿
    if attackerPlayer and IsGoodTeamPlayer(attackerPlayerID) and IsBadTeamPlayer(playerId) and
        AIGameMode.BotRecordSuccessiveDeathTable[playerId] and AIGameMode.BotRecordSuccessiveDeathTable[playerId] >= 3 then
        -- 补偿的金钱和经验 设计上不应该超过AI通过击杀玩家获得的
        local deathCount = AIGameMode.BotRecordSuccessiveDeathTable[playerId]
        local gold = 0
        local xp = 0

        -- 基础值
        if GameTime <= 5 * 60 then
            gold = 20
            xp = 40
        elseif GameTime <= 10 * 60 then
            gold = 30
            xp = 60
        else
            gold = 40
            xp = 80
        end

        -- 击杀者等级加成
        local killerLevel = attacker:GetLevel()
        gold = gold + killerLevel * 6
        xp = xp + killerLevel * 4

        if iLevel >= 50 then
            xp = 0
        end

        -- 连死次数补正
        local extraFactor = math.max(1, deathCount - 2)

        -- 两边团队击杀数补正
        local playerTeamKill = PlayerResource:GetTeamKills(PlayerResource:GetTeam(attackerPlayerID))
        local AITeamKill = PlayerResource:GetTeamKills(PlayerResource:GetTeam(playerId))
        local teamKillFactor = playerTeamKill / (AITeamKill + 3) - 1

        -- 补正之和在0-10之间
        local totalFactor = extraFactor + teamKillFactor
        totalFactor = math.max(totalFactor, 0)
        totalFactor = math.min(totalFactor, 10)
        -- 玩家数量减少时降低倍率
        totalFactor = totalFactor * (AIGameMode.playerNumber) / 10


        gold = math.ceil(gold * totalFactor)
        xp = math.ceil(xp * AIGameMode:GetPlayerGoldXpMultiplier(playerId) * totalFactor)

        if PlayerResource:IsValidPlayerID(playerId) and PlayerResource:IsValidPlayer(playerId) and
            PlayerResource:GetSelectedHeroEntity(playerId) then
            GameRules:ModifyGoldFiltered(playerId, gold, true, DOTA_ModifyGold_CreepKill)
            hHero:AddExperience(xp, DOTA_ModifyXP_CreepKill, false, false)
        end
    end
end

--------------------------------------------------------------------------------
-- Killed event
--------------------------------------------------------------------------------

function AIGameMode:OnEntityKilled(keys)
    local hEntity = EntIndexToHScript(keys.entindex_killed)
    -- on hero killed
    if hEntity:IsRealHero() and hEntity:IsReincarnating() == false then
        HeroKilled(keys)
        -- drop items only when killed by hero
        -- if EntIndexToHScript(keys.entindex_attacker):GetPlayerOwner() then
        RollDrops(EntIndexToHScript(keys.entindex_killed))
        -- end
    end
    -- REFACTORED: Tower and barrack record moved to TypeScript
    -- See: src/vscripts/modules/event/event-entity-killed.ts
end
