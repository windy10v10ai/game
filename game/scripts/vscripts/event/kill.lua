local dropTable = nil


local function CreateItemLocal(sItemName, hEntity)
    local item = CreateItem(sItemName, nil, nil)
    local pos = hEntity:GetAbsOrigin()
    CreateItemOnPositionSync(pos, item)
    local pos_launch = pos + RandomVector(RandomFloat(150, 200))
    item:LaunchLoot(false, 200, 0.75, pos_launch)
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
                        hHero:RemoveItem(hItem)
                        -- Create the item
                        CreateItemLocal(item_name, hHero)
                    end
                end
            end
        end
    end
end

local function OnFortKilled(winnerTeam)
    if IsServer() then
        local endData = AIGameMode:EndScreenStats(winnerTeam, true)
        -- 作弊模式不发送统计
        if not GameRules:IsCheatMode() or AIGameMode.DebugMode then
            GameController:SendEndGameInfo(endData)
        end
    end
end

local function RecordBarrackKilled(hEntity)
    local team = hEntity:GetTeamNumber()
    if DOTA_TEAM_GOODGUYS == team then
        AIGameMode.barrackPushedBad = AIGameMode.barrackPushedBad + 1
        print("barrackPushedBad ", AIGameMode.barrackPushedBad)
    elseif DOTA_TEAM_BADGUYS == team then
        AIGameMode.barrackPushedGood = AIGameMode.barrackPushedGood + 1
        print("barrackPushedGood ", AIGameMode.barrackPushedGood)
    end
end

local function RecordTowerKilled(hEntity)
    local team = hEntity:GetTeamNumber()
    local sName = hEntity:GetUnitName()
    if string.find(sName, "tower1") then
        if DOTA_TEAM_GOODGUYS == team then
            AIGameMode.tower1PushedBad = AIGameMode.tower1PushedBad + 1
            print("tower1PushedBad ", AIGameMode.tower1PushedBad)
        elseif DOTA_TEAM_BADGUYS == team then
            AIGameMode.tower1PushedGood = AIGameMode.tower1PushedGood + 1
            print("tower1PushedGood ", AIGameMode.tower1PushedGood)
        end
    elseif string.find(sName, "tower2") then
        if DOTA_TEAM_GOODGUYS == team then
            AIGameMode.tower2PushedBad = AIGameMode.tower2PushedBad + 1
            print("tower2PushedBad ", AIGameMode.tower2PushedBad)
        elseif DOTA_TEAM_BADGUYS == team then
            AIGameMode.tower2PushedGood = AIGameMode.tower2PushedGood + 1
            print("tower2PushedGood ", AIGameMode.tower2PushedGood)
        end
    elseif string.find(sName, "tower3") then
        if DOTA_TEAM_GOODGUYS == team then
            AIGameMode.tower3PushedBad = AIGameMode.tower3PushedBad + 1
            print("tower3PushedBad ", AIGameMode.tower3PushedBad)
            -- 破高地后 给4塔 基地添加分裂箭
            if AIGameMode.tower3PushedBad == 1 then
                local towers = Entities:FindAllByClassname("npc_dota_tower")
                for _, tower in pairs(towers) do
                    if string.find(tower:GetUnitName(), "npc_dota_goodguys_tower4") then
                        local towerSplitShot = tower:AddAbility("tower_split_shot")
                        if towerSplitShot then
                            towerSplitShot:SetLevel(1)
                            towerSplitShot:ToggleAbility()
                        end
                    end
                end
                local forts = Entities:FindAllByClassname("npc_dota_fort")
                for _, fort in pairs(forts) do
                    if string.find(fort:GetUnitName(), "npc_dota_goodguys_fort") then
                        local towerSplitShot = fort:AddAbility("tower_split_shot")
                        if towerSplitShot then
                            towerSplitShot:SetLevel(3)
                            towerSplitShot:ToggleAbility()
                        end
                    end
                end
            end
        elseif DOTA_TEAM_BADGUYS == team then
            AIGameMode.tower3PushedGood = AIGameMode.tower3PushedGood + 1
            print("tower3PushedGood ", AIGameMode.tower3PushedGood)
            -- 破高地后 给4塔 基地添加分裂箭
            if AIGameMode.tower3PushedGood == 1 then
                local towers = Entities:FindAllByClassname("npc_dota_tower")
                for _, tower in pairs(towers) do
                    if string.find(tower:GetUnitName(), "npc_dota_badguys_tower4") then
                        local towerSplitShot = tower:AddAbility("tower_split_shot")
                        if towerSplitShot then
                            towerSplitShot:SetLevel(1)
                            towerSplitShot:ToggleAbility()
                        end
                    end
                end
                local forts = Entities:FindAllByClassname("npc_dota_fort")
                for _, fort in pairs(forts) do
                    if string.find(fort:GetUnitName(), "npc_dota_badguys_fort") then
                        local towerSplitShot = fort:AddAbility("tower_split_shot")
                        if towerSplitShot then
                            towerSplitShot:SetLevel(2)
                            towerSplitShot:ToggleAbility()
                        end
                    end
                end
            end
        end
    elseif string.find(sName, "tower4") then
        if DOTA_TEAM_GOODGUYS == team then
            AIGameMode.tower4PushedBad = AIGameMode.tower4PushedBad + 1
            print("tower4PushedBad ", AIGameMode.tower4PushedBad)
        elseif DOTA_TEAM_BADGUYS == team then
            AIGameMode.tower4PushedGood = AIGameMode.tower4PushedGood + 1
            print("tower4PushedGood ", AIGameMode.tower4PushedGood)
        end
    end
end

local tDOTARespawnTime = { 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50,
                           51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73,
                           74, 75, 75 }
local function HeroKilled(keys)
    local hHero = EntIndexToHScript(keys.entindex_killed)
    local attacker = EntIndexToHScript(keys.entindex_attacker)
    local playerId = hHero:GetPlayerID() -- 死亡玩家id
    local attackerPlayer = attacker:GetPlayerOwner()
    local attackerPlayerID = -1
    if attackerPlayer then
        attackerPlayerID = attackerPlayer:GetPlayerID()
    end
    local fRespawnTime = 0
    local iLevel = hHero:GetLevel()
    local GameTime = GameRules:GetDOTATime(false, false)

    ---- 复活时间逻辑
    if iLevel <= 50 then
        fRespawnTime = math.ceil(tDOTARespawnTime[iLevel] * AIGameMode.iRespawnTimePercentage / 100.0)
    else
        fRespawnTime = math.ceil((iLevel / 4 + 62) * AIGameMode.iRespawnTimePercentage / 100.0)
    end

    -- NEC大招
    if hHero:FindModifierByName('modifier_necrolyte_reapers_scythe') then
        fRespawnTime = fRespawnTime +
                hHero:FindModifierByName('modifier_necrolyte_reapers_scythe'):GetAbility():GetLevel() * 6
    end

    -- 会员减少5s复活时间
    if PlayerController:IsMember(PlayerResource:GetSteamAccountID(playerId)) then
        fRespawnTime = fRespawnTime - 5
    end

    -- 复活时间至少1s
    if fRespawnTime < 1 then
        fRespawnTime = 1
    end

    hHero:SetTimeUntilRespawn(fRespawnTime)

    -- 玩家团队奖励逻辑
    if attackerPlayer and IsGoodTeamPlayer(attackerPlayerID) and IsBadTeamPlayer(playerId) then
        -- 前期增长慢，电脑等级较高时，增长快
        -- 30级时电脑天赋学满，战斗力基本开始成型了，这时打野的钱本身也变多了
        local gold = 0
        if iLevel <= 10 then
            gold = 5 + iLevel * 0.5
        elseif iLevel <= 20 then
            gold = 10 + (iLevel - 10) * 0.8
        elseif iLevel <= 30 then
            gold = 18 + (iLevel - 20) * 2
        elseif iLevel <= 50 then
            gold = 38 + (iLevel - 30) * 8
        else
            gold = 198
        end
        gold = math.min(gold, 198)
        for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
            if PlayerResource:IsValidPlayerID(playerID) and PlayerResource:IsValidPlayer(playerID) and
                    PlayerResource:GetSelectedHeroEntity(playerID) and IsGoodTeamPlayer(playerID) then
                GameRules:ModifyGoldFiltered(playerID, gold, true, DOTA_ModifyGold_CreepKill)
                local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)
                SendOverheadEventMessage(playerHero, OVERHEAD_ALERT_GOLD, playerHero, gold * AIGameMode:GetPlayerGoldXpMultiplier(playerID), playerHero)
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
            AIGameMode.BotRecordSuccessiveDeathTable[playerId] and AIGameMode.BotRecordSuccessiveDeathTable[playerId] >= 3 and
            iLevel < 50 then

        -- 补偿的金钱和经验 设计上不应该超过AI通过击杀玩家获得的
        local deathCount = AIGameMode.BotRecordSuccessiveDeathTable[playerId]
        local gold = 0
        local xp = 0

        -- 基础值
        if GameTime <= 5 * 60 then
            gold = 10
            xp = 20
        elseif GameTime <= 10 * 60 then
            gold = 20
            xp = 40
        elseif GameTime <= 15 * 60 then
            gold = 30
            xp = 60
        else
            gold = 40
            xp = 80
        end

        local extraFactor = 1
        -- 连死次数补正
        if deathCount <= 5 then
            extraFactor = math.max(1, 1 + (deathCount - 3) * 0.25)
        else
            extraFactor = math.max(1, 1.5 + (deathCount - 5) * 0.5)
        end
        extraFactor = math.min(extraFactor, 5)

        -- 两边团队击杀数补正
        local playerTeamKill = PlayerResource:GetTeamKills(PlayerResource:GetTeam(attackerPlayerID))
        local AITeamKill = PlayerResource:GetTeamKills(PlayerResource:GetTeam(playerId))
        local teamKillFactor = 1
        if playerTeamKill < AITeamKill then
            teamKillFactor = 0
        elseif playerTeamKill < 2 * AITeamKill then
            teamKillFactor = 0.5
        elseif playerTeamKill - AITeamKill <= 10 then
            teamKillFactor = 1
        elseif playerTeamKill - AITeamKill <= 20 then
            teamKillFactor = 2
        elseif playerTeamKill - AITeamKill <= 40 then
            teamKillFactor = 3
        else
            teamKillFactor = 4
        end
        extraFactor = extraFactor * teamKillFactor
        extraFactor = extraFactor * 10 / AIGameMode.playerNumber

        gold = gold * extraFactor
        xp = xp * AIGameMode:GetPlayerGoldXpMultiplier(playerId) * extraFactor

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
    -- on barrack killed
    if hEntity:GetClassname() == "npc_dota_barracks" then
        RecordBarrackKilled(hEntity)
    end
    -- on tower killed
    if hEntity:GetClassname() == "npc_dota_tower" then
        RecordTowerKilled(hEntity)
    end

    if hEntity:GetClassname() == "npc_dota_fort" then
        print(hEntity:GetUnitName())
        print(hEntity:GetClassname())
        local winnerTeam = 1
        if hEntity:GetUnitName() == "npc_dota_badguys_fort" then
            winnerTeam = DOTA_TEAM_GOODGUYS
        else
            winnerTeam = DOTA_TEAM_BADGUYS
        end
        OnFortKilled(winnerTeam)
    end
end
