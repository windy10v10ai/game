require('modifiers/player/enable_player_modifier')
require('event/creep')
require('event/chat')
require('event/kill')

local tBotNameList = {
    --"npc_dota_hero_invoker",
    --"npc_dota_hero_antimage", // 不会放技能，只会物品和A人
    --"npc_dota_hero_spirit_breaker", // 不会放技能，只会物品和A人
    --"npc_dota_hero_silencer", // 不会放技能，只会物品和A人
    --"npc_dota_hero_mirana", // 不会放技能，只会物品和A人
    --"npc_dota_hero_furion", // 不会放技能，只会物品和A人
    --"npc_dota_hero_huskar", // 不会放技能，只会物品和A人
    --"npc_dota_hero_batrider",
    --"npc_dota_hero_obsidian_destroyer",
    --"npc_dota_hero_enchantress",
    --"npc_dota_hero_snapfire",
    --"npc_dota_hero_broodmother",
    --"npc_dota_hero_lycan",
    --"npc_dota_hero_arc_warden",
    --"npc_dota_hero_ancient_apparition",
    --"npc_dota_hero_treant",
    --"npc_dota_hero_rubick",
    --"npc_dota_hero_shredder",
    --"npc_dota_hero_tinker",
    "npc_dota_hero_abaddon",
    "npc_dota_hero_axe",
    "npc_dota_hero_bane",
    "npc_dota_hero_bounty_hunter",
    "npc_dota_hero_bloodseeker",
    "npc_dota_hero_spectre",
    "npc_dota_hero_bristleback",
    "npc_dota_hero_chaos_knight",
    "npc_dota_hero_crystal_maiden",
    "npc_dota_hero_dazzle",
    "npc_dota_hero_death_prophet",
    "npc_dota_hero_dragon_knight",
    "npc_dota_hero_drow_ranger",
    "npc_dota_hero_earthshaker",
    "npc_dota_hero_jakiro",
    "npc_dota_hero_juggernaut",
    "npc_dota_hero_kunkka",
    "npc_dota_hero_lich",
    "npc_dota_hero_lina",
    "npc_dota_hero_lion",
    "npc_dota_hero_luna",
    "npc_dota_hero_medusa",
    "npc_dota_hero_meepo",
    "npc_dota_hero_necrolyte",
    "npc_dota_hero_nevermore",
    "npc_dota_hero_ogre_magi",
    "npc_dota_hero_omniknight",
    "npc_dota_hero_oracle",
    "npc_dota_hero_phantom_assassin",
    "npc_dota_hero_pudge",
    "npc_dota_hero_riki",
    --"npc_dota_hero_razor", // 在泉水站着完全不动
    "npc_dota_hero_sand_king",
    "npc_dota_hero_shadow_shaman",
    "npc_dota_hero_skywrath_mage",
    "npc_dota_hero_sniper",
    "npc_dota_hero_sven",
    --"npc_dota_hero_tidehunter", // 在泉水站着完全不动
    "npc_dota_hero_tiny",
    "npc_dota_hero_vengefulspirit",
    "npc_dota_hero_viper",
    "npc_dota_hero_warlock",
    "npc_dota_hero_windrunner",
    "npc_dota_hero_witch_doctor",
    "npc_dota_hero_skeleton_king",
    "npc_dota_hero_zuus",
}

local tSkillCustomNameList = { "npc_dota_hero_crystal_maiden", "npc_dota_hero_queenofpain", "npc_dota_hero_mirana",
                               "npc_dota_hero_earthshaker", "npc_dota_hero_nevermore" }

local tAPLevelList = { 17, 19, 21, 22, 23, 24, 26 }


function AIGameMode:ArrayShuffle(array)
    local size = #array
    for i = size, 1, -1 do
        local rand = math.random(size)
        array[i], array[rand] = array[rand], array[i]
    end
    return array
end

function AIGameMode:GetFreeHeroName()
    for i, v in ipairs(tBotNameList) do
        if PlayerResource:WhoSelectedHero(v, false) < 0 then
            return v
        end
    end
    return "npc_dota_hero_luna" -- Should never get here
end

function AIGameMode:InitHeroSelection()
    if self.PreGameOptionsSet then
        print("[AIGameMode] InitSettings")
        -- 初始化玩家列表和初期金钱
        self.tHumanPlayerList = {}
        -- 是否更换了会员英雄
        self.tIfChangeHeroList = {}
        -- 是否选择了物品
        self.tIfItemChosen = {}
        self.tIfItemChooseInited = {}
        for i = 0, (DOTA_MAX_TEAM_PLAYERS - 1) do
            if PlayerResource:GetConnectionState(i) ~= DOTA_CONNECTION_STATE_UNKNOWN then
                -- set human player list
                self.tHumanPlayerList[i] = true
                self.tIfChangeHeroList[i] = false
                self.tIfItemChosen[i] = false
                self.tIfItemChooseInited[i] = false
                -- set start gold
                PlayerResource:SetGold(i, (self.iStartingGoldPlayer - 600), true)
            end
        end

        -- 添加bot和初期金钱
        local iPlayerNumRadiant = PlayerResource:GetPlayerCountForTeam(DOTA_TEAM_GOODGUYS)
        local iPlayerNumDire = PlayerResource:GetPlayerCountForTeam(DOTA_TEAM_BADGUYS)
        math.randomseed(math.floor(Time() * 1000000))
        -- 随机英雄列表
        if not self.DebugMode then
            print("[AIGameMode] Random hero list")
            self:ArrayShuffle(tBotNameList)
        end
        local sDifficulty = "unfair"
        if self.iDesiredRadiant > iPlayerNumRadiant then
            for i = 1, self.iDesiredRadiant - iPlayerNumRadiant do
                Tutorial:AddBot(self:GetFreeHeroName(), "", sDifficulty, true)
            end
        end
        if self.iDesiredDire > iPlayerNumDire then
            for i = 1, self.iDesiredDire - iPlayerNumDire do
                Tutorial:AddBot(self:GetFreeHeroName(), "", sDifficulty, false)
            end
        end
        GameRules:GetGameModeEntity():SetBotThinkingEnabled(true)
        Tutorial:StartTutorialMode()
        for i = 0, (DOTA_MAX_TEAM_PLAYERS - 1) do
            if PlayerResource:IsValidPlayer(i) then
                if not self.tHumanPlayerList[i] then
                    PlayerResource:SetGold(i, (self.iStartingGoldBot - 600), true)
                end
            end
        end
    else
        Timers:CreateTimer(0.5, function()
            print("[AIGameMode] Try InitSettings in 0.5s")
            AIGameMode:InitHeroSelection()
        end)
    end
end

function AIGameMode:OnGameStateChanged(keys)
    local state = GameRules:State_Get()

    if state == DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP then
        if IsServer() then
            Player:Init()
        end
    elseif state == DOTA_GAMERULES_STATE_HERO_SELECTION then
        if IsServer() then
            self:InitHeroSelection()
        end
    elseif state == DOTA_GAMERULES_STATE_STRATEGY_TIME then
        if not self.PreGameOptionsSet then
            print("[AIGameMode] Setting pre-game options STRATEGY_TIME")
            self:PreGameOptions()
        end
        for i = 0, (DOTA_MAX_TEAM_PLAYERS - 1) do
            if PlayerResource:IsValidPlayer(i) then
                if PlayerResource:GetPlayer(i) and not PlayerResource:HasSelectedHero(i) then
                    PlayerResource:GetPlayer(i):MakeRandomHeroSelection()
                end
            end
        end

        Timers:CreateTimer(1, function()
            self:EndScreenStats(1, false)
        end)

    elseif state == DOTA_GAMERULES_STATE_PRE_GAME then
        -- modifier towers
        local tTowers = Entities:FindAllByClassname("npc_dota_tower")
        for k, v in pairs(tTowers) do
            local towerName = v:GetName()
            if string.find(towerName, "tower1") then
                -- 一塔攻击最高200%
                if self.iTowerPower > 7 then
                    v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(7)
                else
                    v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iTowerPower)
                end
            else
                v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iTowerPower)
            end
            v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iTowerEndure)
            v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iTowerHeal)
        end
        local barracks = Entities:FindAllByClassname("npc_dota_barracks")
        for k, v in pairs(barracks) do
            v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iTowerEndure)
            v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iTowerHeal)
        end
        local healer = Entities:FindAllByClassname("npc_dota_healer")
        for k, v in pairs(healer) do
            v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iTowerEndure)
            v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iTowerHeal)
        end
        local fort = Entities:FindAllByClassname("npc_dota_fort")
        for k, v in pairs(fort) do
            v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iTowerPower)
            v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iTowerEndure)
            v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iTowerHeal)
        end

        -- refresh every 10 seconds
        Timers:CreateTimer(2, function()
            AIGameMode:RefreshGameStatus()
            return 10
        end)

    elseif state == DOTA_GAMERULES_STATE_GAME_IN_PROGRESS then
        self.fGameStartTime = GameRules:GetGameTime()

        GameRules:SpawnNeutralCreeps()
        -- start loop in 30 seconds
        if IsClient() then
            return
        end

        -- 每分钟30秒时刷一次怪
        Timers:CreateTimer(30, function()
            AIGameMode:SpawnNeutralCreeps30sec()
            return 60
        end)
    end
end

function AIGameMode:SpawnNeutralCreeps30sec()

    local GameTime = GameRules:GetDOTATime(false, false)
    print("SpawnNeutral at GetDOTATime " .. GameTime)
    GameRules:SpawnNeutralCreeps()
end

function AIGameMode:RefreshGameStatus()

    -- save player info
    self:EndScreenStats(1, false)

    -- set global state
    local GameTime = GameRules:GetDOTATime(false, false)
    if (GameTime >= ((AIGameMode.botPushMin * 4) * 60)) then
        -- LATEGAME
        GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
    elseif (GameTime >= ((AIGameMode.botPushMin + 4) * 60)) then
        -- MIDGAME
        if AIGameMode.tower3PushedGood >= 2 or AIGameMode.tower3PushedBad >= 2 then
            GameRules:GetGameModeEntity():SetBotsMaxPushTier(4)
        end

        if AIGameMode.barrackPushedGood > 5 or AIGameMode.barrackPushedBad > 5 then
            GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
        elseif AIGameMode.barrackPushedGood > 2 or AIGameMode.barrackPushedBad > 2 then
            GameRules:GetGameModeEntity():SetBotsMaxPushTier(5)
        end
    elseif (GameTime >= (AIGameMode.botPushMin * 60)) then
        -- MIDGAME
        GameRules:GetGameModeEntity():SetBotsInLateGame(true)
        GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
        GameRules:GetGameModeEntity():SetBotsMaxPushTier(3)
    else
        -- EARLYGAME
        GameRules:GetGameModeEntity():SetBotsInLateGame(false)
        GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(false)
        GameRules:GetGameModeEntity():SetBotsMaxPushTier(1)
    end

    -- 设置买活金钱
    SelectEveryValidPlayerDoFunc(function(playerId)
        if IsGoodTeamPlayer(playerId) then
            PlayerResource:SetCustomBuybackCost(playerId, GetBuyBackCost(PlayerResource:GetSelectedHeroEntity(playerId), GameTime))
        elseif IsBadTeamPlayer(playerId) then
            if AIGameMode.tower3PushedGood > 0 then
                PlayerResource:SetCustomBuybackCost(playerId, GetBuyBackCost(PlayerResource:GetSelectedHeroEntity(playerId), GameTime))
            else
                PlayerResource:SetCustomBuybackCost(playerId, 100000)
            end
        end
    end)

    -- set creep buff level
    local buffLevelGood = 0
    local buffLevelBad = 0
    local buffLevelMegaGood = 0
    local buffLevelMegaBad = 0

    if AIGameMode.tower3PushedGood == 1 then
        buffLevelGood = buffLevelGood + 1
    elseif AIGameMode.tower3PushedGood > 1 then
        buffLevelGood = buffLevelGood + 2
    end
    if AIGameMode.tower3PushedBad == 1 then
        buffLevelBad = buffLevelBad + 1
    elseif AIGameMode.tower3PushedBad > 1 then
        buffLevelBad = buffLevelBad + 2
    end

    if AIGameMode.tower4PushedGood > 1 then
        buffLevelGood = buffLevelGood + 1
        buffLevelMegaGood = buffLevelMegaGood + 1
    end
    if AIGameMode.tower4PushedBad > 1 then
        buffLevelBad = buffLevelBad + 1
        buffLevelMegaBad = buffLevelMegaBad + 1
    end

    buffLevelMegaGood = buffLevelMegaGood + AIGameMode.creepBuffLevel
    buffLevelMegaBad = buffLevelMegaBad + AIGameMode.creepBuffLevel

    if (GameTime >= (50 * 60)) then
        buffLevelGood = buffLevelGood + 5
        buffLevelBad = buffLevelBad + 5
        buffLevelMegaGood = buffLevelMegaGood + 5
        buffLevelMegaBad = buffLevelMegaBad + 5
    elseif (GameTime >= (45 * 60)) then
        buffLevelGood = buffLevelGood + 4
        buffLevelBad = buffLevelBad + 4
        buffLevelMegaGood = buffLevelMegaGood + 4
        buffLevelMegaBad = buffLevelMegaBad + 4
    elseif (GameTime >= (40 * 60)) then
        buffLevelGood = buffLevelGood + 3
        buffLevelBad = buffLevelBad + 3
        buffLevelMegaGood = buffLevelMegaGood + 3
        buffLevelMegaBad = buffLevelMegaBad + 3
    elseif (GameTime >= (35 * 60)) then
        buffLevelGood = buffLevelGood + 2
        buffLevelBad = buffLevelBad + 2
        buffLevelMegaGood = buffLevelMegaGood + 2
        buffLevelMegaBad = buffLevelMegaBad + 2
    elseif (GameTime >= (30 * 60)) then
        buffLevelGood = buffLevelGood + 1
        buffLevelBad = buffLevelBad + 1
        buffLevelMegaGood = buffLevelMegaGood + 1
        buffLevelMegaBad = buffLevelMegaBad + 1
    elseif (GameTime >= (20 * 60)) then
        buffLevelGood = buffLevelGood + 1
        buffLevelBad = buffLevelBad + 1
    end

    -- 未推掉任何塔时，不设置小兵buff
    if AIGameMode.tower1PushedGood == 0 then
        buffLevelGood = 0
    end
    if AIGameMode.tower1PushedBad == 0 then
        buffLevelBad = 0
    end

    buffLevelGood = math.min(buffLevelGood, 8)
    buffLevelBad = math.min(buffLevelBad, 8)
    buffLevelMegaGood = math.min(buffLevelMegaGood, 8)
    buffLevelMegaBad = math.min(buffLevelMegaBad, 8)

    AIGameMode.creepBuffLevelGood = buffLevelGood
    AIGameMode.creepBuffLevelBad = buffLevelBad
    AIGameMode.creepBuffLevelMegaGood = buffLevelMegaGood
    AIGameMode.creepBuffLevelMegaBad = buffLevelMegaBad

     -- 简单限制电脑前期买活
     if GameTime <= 15 * 60 then
         GameRules:GetGameModeEntity():SetBuybackEnabled(false)
     else
         GameRules:GetGameModeEntity():SetBuybackEnabled(true)
     end

end

-- 买活时间设定
function AIGameMode:OnBuyback(e)
    local playerId = e.player_id
    local hEntity = EntIndexToHScript(e.entindex)
    -- 需要等待一段时间，否则GetBuybackCooldownTime()获取的值是0
    Timers:CreateTimer(0.5, function()
        if hEntity:IsRealHero() and hEntity:IsReincarnating() == false then
            local hHero = hEntity
            -- 会员买活时间上限设置
            local memberBuybackCooldownMaximum = 120
            local steamAccountID = PlayerResource:GetSteamAccountID(playerId)
            if Player:IsMember(steamAccountID) then
                local buybackTime = hHero:GetBuybackCooldownTime()
                if buybackTime > memberBuybackCooldownMaximum then
                    buybackTime = memberBuybackCooldownMaximum
                end
                hHero:SetBuybackCooldownTime(buybackTime)
            end
        end
    end)
end

function AIGameMode:OnLastHit(keys)
    if keys.FirstBlood == 1 then
        local hero = PlayerResource:GetSelectedHeroEntity(keys.PlayerID)
        if hero and hero:HasAbility("Hero_vo_player") then
            hero:PlayVoiceAllPlayerIgnoreCooldown(hero:GetName() .. ".vo.FirstBlood")
        end
    end
end

function AIGameMode:OnPickHeroSpawn(keys)
    local heroname = keys.hero
    local hero = EntIndexToHScript(keys.heroindex)
    if hero:HasAbility("Hero_vo_player") then
        hero:PlayVoiceIgnoreCooldown(heroname .. ".vo.Spawn")
    end
end

function AIGameMode:OnNPCSpawned(keys)
    if GameRules:State_Get() < DOTA_GAMERULES_STATE_PRE_GAME then
        Timers:CreateTimer(1, function()
            AIGameMode:OnNPCSpawned(keys)
        end)
        return
    end
    local hEntity = EntIndexToHScript(keys.entindex)
    if not hEntity or hEntity:IsNull() then
        return
    end

    if hEntity:IsBaseNPC() then
        local playerid = hEntity:GetPlayerOwnerID()
        if playerid then
            local hero = PlayerResource:GetSelectedHeroEntity(playerid)
            if hero and hero == hEntity and hero:HasAbility("Hero_vo_player") then
                if not hero.isBuyBack then
                    hero:PlayVoiceIgnoreCooldown(hero:GetName() .. ".vo.Respawn")
                end
                hero.isBuyBack = false
            end
        end
    end

    if hEntity:IsCourier() and self.bFastCourier == 1 then
        hEntity:AddNewModifier(hEntity, nil, "modifier_courier_speed", {})
        return
    end

    local sName = hEntity:GetName()
    if sName == "npc_dota_creep_lane" or sName == "npc_dota_creep_siege" then
        local sUnitName = hEntity:GetUnitName()
        local team = hEntity:GetTeamNumber()
        local buffLevel = 0
        local buffLevelMega = 0
        if DOTA_TEAM_GOODGUYS == team then
            buffLevel = AIGameMode.creepBuffLevelGood
            buffLevelMega = AIGameMode.creepBuffLevelMegaGood
        elseif DOTA_TEAM_BADGUYS == team then
            buffLevel = AIGameMode.creepBuffLevelBad
            buffLevelMega = AIGameMode.creepBuffLevelMegaBad
        end

        -- 随时间增加金钱
        local originMaxGold = hEntity:GetMaximumGoldBounty()
        local originMinGold = hEntity:GetMinimumGoldBounty()
        local mul = AIGameMode:GetLaneGoldMul()
        local modifiedMaxGold = originMaxGold * mul
        local modifiedMinGold = originMinGold * mul
        hEntity:SetMaximumGoldBounty(modifiedMaxGold)
        hEntity:SetMinimumGoldBounty(modifiedMinGold)

        if buffLevel > 0 then
            if not string.find(sUnitName, "upgraded") and not string.find(sUnitName, "mega") then
                -- normal creep
                local ability = hEntity:AddAbility("creep_buff")
                ability:SetLevel(buffLevel)
                return
            end
        end

        if buffLevelMega > 0 then
            if string.find(sUnitName, "upgraded") and not string.find(sUnitName, "mega") then
                -- upgrade creep
                local ability = hEntity:AddAbility("creep_buff_upgraded")
                ability:SetLevel(buffLevelMega)
                return
            elseif string.find(sUnitName, "mega") then
                -- mega creep
                local ability = hEntity:AddAbility("creep_buff_mega")
                ability:SetLevel(buffLevelMega)
                return
            end
        end
    end

    if hEntity:IsCreep() then
        if sName == "npc_dota_roshan" then
            local ability_roshan_buff = hEntity:FindAbilityByName("roshan_buff")
            ability_roshan_buff:SetLevel(self.roshanNumber)
            local ability_gold_bag = hEntity:FindAbilityByName("generic_gold_bag_fountain")
            ability_gold_bag:SetLevel(self.roshanNumber)

            self.roshanNumber = self.roshanNumber + 1
            if self.roshanNumber > 4 then
                self.roshanNumber = 4
            end
            return
        end
    end

    if sName == "npc_dota_lone_druid_bear" then
        hEntity:AddNewModifier(hEntity, nil, "modifier_melee_resistance", {})
    end

    if hEntity:IsRealHero() and not hEntity.bInitialized then
        if hEntity:GetAttackCapability() == DOTA_UNIT_CAP_MELEE_ATTACK or sName == "npc_dota_hero_troll_warlord" or
                sName == "npc_dota_hero_lone_druid" then
            hEntity:AddNewModifier(hEntity, nil, "modifier_melee_resistance", {})
        end

        if sName == "npc_dota_hero_sniper" and not self.bSniperScepterThinkerApplierSet then
            require('heroes/hero_sniper/sniper_init')
            SniperInit(hEntity, self)
        end

        -- choose item 玩家抽选物品
        if self.tHumanPlayerList[hEntity:GetPlayerOwnerID()] and not self.tIfItemChosen[hEntity:GetPlayerOwnerID()] and
                not self.tIfItemChooseInited[hEntity:GetPlayerOwnerID()] then
            self:SpecialItemAdd(hEntity)
            self.tIfItemChooseInited[hEntity:GetPlayerOwnerID()] = true
        end

        -- Bots modifier 机器人AI脚本
        if not self.tHumanPlayerList[hEntity:GetPlayerOwnerID()] then
            if not hEntity:HasModifier("modifier_bot_think_strategy") then
                hEntity:AddNewModifier(hEntity, nil, "modifier_bot_think_strategy", {})
            end
            if not hEntity:HasModifier("modifier_bot_think_item_use") then
                hEntity:AddNewModifier(hEntity, nil, "modifier_bot_think_item_use", {})
            end
            if tBotItemData.wardHeroList[sName] then
                if not hEntity:HasModifier("modifier_bot_think_ward") then
                    hEntity:AddNewModifier(hEntity, nil, "modifier_bot_think_ward", {})
                end
            end
            -- hEntity:SetControllableByPlayer(-1, true)
        end

        -- Player Buff
        if self.tHumanPlayerList[hEntity:GetPlayerOwnerID()] then
            EnablePlayerModifier(hEntity)
        end

        hEntity.bInitialized = true
    end
end

function AIGameMode:OnPlayerLevelUp(keys)
    local iEntIndex = PlayerResource:GetPlayer(keys.player - 1):GetAssignedHero():entindex()
    local iLevel = keys.level
    -- Set DeathXP 击杀经验
    Timers:CreateTimer(0.5, function()
        local hEntity = EntIndexToHScript(iEntIndex)
        if hEntity:IsNull() then
            return
        end
        if iLevel <= 30 then
            hEntity:SetCustomDeathXP(40 + hEntity:GetCurrentXP() * 0.09)
        else
            hEntity:SetCustomDeathXP(3500 + hEntity:GetCurrentXP() * 0.03)
        end
    end)

    -- Set Ability Points
    local hero = EntIndexToHScript(keys.player):GetAssignedHero()
    local level = keys.level

    for i, v in ipairs(tSkillCustomNameList) do
        if v == hero:GetName() then
            for _, lv in ipairs(tAPLevelList) do
                if lv == level then
                    print("-----------------debug-----------------", hero:GetName() .. "level:" .. level .. " Add AP")
                    -- Save current unspend AP
                    local unspendAP = hero:GetAbilityPoints()
                    hero:SetAbilityPoints(1 + unspendAP)
                    break
                end
            end

            break
        end
    end
end

function AIGameMode:OnItemPickedUp(event)
    -- if not courier
    if not event.HeroEntityIndex then
        return
    end

    local item = EntIndexToHScript(event.ItemEntityIndex)
    local hHero = EntIndexToHScript(event.HeroEntityIndex)
    if event.PlayerID ~= nil and item ~= nil and hHero ~= nil and item:GetAbilityName() == "item_bag_of_gold" then
        local iGold = item:GetSpecialValueFor("bonus_gold")
        hHero:ModifyGoldFiltered(iGold, true, DOTA_ModifyGold_RoshanKill)
        SendOverheadEventMessage(hHero, OVERHEAD_ALERT_GOLD, hHero, iGold * AIGameMode:GetPlayerGoldXpMultiplier(event.PlayerID), nil)
    end
end

function AIGameMode:OnGetLoadingSetOptions(eventSourceIndex, args)
    if tonumber(args.host_privilege) ~= 1 then
        return
    end
    self.iDesiredRadiant = tonumber(args.game_options.radiant_player_number)
    self.iDesiredDire = tonumber(args.game_options.dire_player_number)
    self.fPlayerGoldXpMultiplier = tonumber(args.game_options.player_gold_xp_multiplier)
    self.fBotGoldXpMultiplier = tonumber(args.game_options.bot_gold_xp_multiplier)

    self.iRespawnTimePercentage = tonumber(args.game_options.respawn_time_percentage)
    self.iMaxLevel = tonumber(args.game_options.max_level)

    self.iTowerPower = tonumber(args.game_options.tower_power)
    self.iTowerEndure = tonumber(args.game_options.tower_endure)
    self.iTowerHeal = tonumber(args.game_options.tower_heal)

    self.iStartingGoldPlayer = tonumber(args.game_options.starting_gold_player)
    self.iStartingGoldBot = tonumber(args.game_options.starting_gold_bot)
    self.bSameHeroSelection = args.game_options.same_hero_selection
    self.bFastCourier = args.game_options.fast_courier
    if args.game_options.radiant_bot_same_multi == 1 or args.game_options.radiant_bot_same_multi == "1" then
        self.bRadiantBotSameMulti = true
    else
        self.bRadiantBotSameMulti = false
    end
    self:PreGameOptions()
end

function AIGameMode:OnGameOptionChange(keys)
    local optionName = keys.optionName
    local optionValue = keys.optionValue
    -- 对应的游戏选择项目设定
    GameRules.GameOption[optionName] = optionValue
    CustomNetTables:SetTableValue('game_options_table', 'game_option', GameRules.GameOption)
end

function AIGameMode:SetUnitShareMask(data)
    local toPlayerID = data.toPlayerID;
    if PlayerResource:IsValidPlayerID(toPlayerID) then
        local playerId = data.PlayerID;
        -- flag: bitmask; 1 shares heroes, 2 shares units, 4 disables help
        local flag = data.flag;
        local disable = data.disable == 1
        PlayerResource:SetUnitShareMaskForPlayer(playerId, toPlayerID, flag, disable)

        local disableHelp = CustomNetTables:GetTableValue("disable_help", tostring(playerId)) or {}
        disableHelp[tostring(to)] = disable
        CustomNetTables:SetTableValue("disable_help", tostring(playerId), disableHelp)
    end
end

function AIGameMode:OnPlayerReconnect(keys)
    local playerID = keys.PlayerID
    local new_state = GameRules:State_Get()
    if new_state > DOTA_GAMERULES_STATE_HERO_SELECTION then
        if PlayerResource:IsValidPlayer(playerID) then
            if PlayerResource:HasSelectedHero(playerID) or PlayerResource:HasRandomed(playerID) then
                -- This playerID already had a hero before disconnect
            else
                if not PlayerResource:IsBroadcaster(playerID) then
                    local hPlayer = PlayerResource:GetPlayer(playerID)
                    hPlayer:MakeRandomHeroSelection()
                    PlayerResource:SetHasRandomed(playerID)

                    if new_state > DOTA_GAMERULES_STATE_WAIT_FOR_MAP_TO_LOAD then
                        local hHero = PlayerResource:GetSelectedHeroEntity(playerID)
                        if hHero then
                            print("hHero:RemoveSelf()")
                            hHero:RemoveSelf()
                        end
                        local pszHeroClass = PlayerResource:GetSelectedHeroName(playerID)
                        local hTeam = PlayerResource:GetTeam(playerID)
                        local vPositions = nil
                        if hTeam == DOTA_TEAM_GOODGUYS then
                            vPositions = Vector(-6900, -6400, 384)
                        else
                            vPositions = Vector(7000, 6150, 384)
                        end
                        local hHero = CreateUnitByName(pszHeroClass, vPositions, true, nil, nil, hTeam)
                        hHero:SetControllableByPlayer(playerID, true)
                        hPlayer:SetAssignedHeroEntity(hHero)
                        hPlayer:SpawnCourierAtPosition(vPositions)
                    end
                end
            end
        end
    end
end

function AIGameMode:EndScreenStats(winnerTeamId, bTrueEnd)
    local time = GameRules:GetDOTATime(false, true)
    -- local matchID = tostring(GameRules:GetMatchID())

    local data = {
        version = "1.18",
        -- matchID = matchID,
        mapName = GetMapName(),
        players = {},
        options = {},
        gameOption = {},
        winnerTeamId = winnerTeamId,
        isWinner = true,
        duration = math.floor(time),
        flags = {}
    }

    data.options = {
        playerGoldXpMultiplier = tostring(self.fPlayerGoldXpMultiplier),
        botGoldXpMultiplier = self.fBotGoldXpMultiplier > 10 and "??" or self.fBotGoldXpMultiplier,
        towerPower = AIGameMode:StackToPercentage(self.iTowerPower),
        towerEndure = AIGameMode:StackToPercentage(self.iTowerEndure)
    }
    -- send to api server
    data.gameOption = {
        playerGoldXpMultiplier = self.fPlayerGoldXpMultiplier,
        botGoldXpMultiplier = self.fBotGoldXpMultiplier,
        towerPower = self.iTowerPower,
        towerEndure = self.iTowerEndure,
    }

    local basePoint = 0
    if time > 3600 then
        basePoint = 50
    else
        basePoint = math.floor(10 + time / 120)
    end

    local playerNumber = 0
    -- 参战率积分
    local battleParticipationBase = 20
    -- find most kill/assist 1st to 6th
    -- local mostKillPlayerIDList = {}
    -- local mostKillList = {}

    -- local mostAssistsPlayerList = {}
    -- local mostAssistsList = {}

    local mostDamageReceivedPlayerID_1 = -1
    local mostDamageReceived_1 = 0
    local mostDamageReceivedPlayerID_2 = -1
    local mostDamageReceived_2 = 0
    local mostHealingPlayerID_1 = -1
    local mostHealing_1 = 0
    local mostHealingPlayerID_2 = -1
    local mostHealing_2 = 0
    local mostTowerKillPlayerID_1 = -1
    local mostTowerKill_1 = 0
    local mostTowerKillPlayerID_2 = -1
    local mostTowerKill_2 = 0

    for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
        if PlayerResource:IsValidPlayerID(playerID) and PlayerResource:IsValidPlayer(playerID) and
                PlayerResource:GetSelectedHeroEntity(playerID) then
            local hero = PlayerResource:GetSelectedHeroEntity(playerID)
            if hero and IsValidEntity(hero) and not hero:IsNull() then
                local steamAccountID = PlayerResource:GetSteamAccountID(playerID)
                local membership = Player:IsMember(steamAccountID)
                local memberInfo = Player:GetMember(steamAccountID)
                local damage = PlayerResource:GetRawPlayerDamage(playerID)
                local damagereceived = 0
                for victimID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
                    if PlayerResource:IsValidPlayerID(victimID) and PlayerResource:IsValidPlayer(victimID) and
                            PlayerResource:GetSelectedHeroEntity(victimID) then
                        if PlayerResource:GetTeam(victimID) ~= PlayerResource:GetTeam(playerID) then
                            damagereceived = damagereceived + PlayerResource:GetDamageDoneToHero(victimID, playerID)
                        end
                    end
                end
                local healing = PlayerResource:GetHealing(playerID)
                local assists = PlayerResource:GetAssists(playerID)
                local deaths = PlayerResource:GetDeaths(playerID)
                local kills = PlayerResource:GetKills(playerID)
                local towerKills = PlayerResource:GetTowerKills(playerID)

                local playerInfo = {
                    steamid = tostring(PlayerResource:GetSteamID(playerID)),
                    membership = membership,
                    memberInfo = memberInfo,
                    kills = kills or 0,
                    deaths = deaths or 0,
                    assists = assists or 0,
                    damage = damage or 0,
                    damagereceived = damagereceived or 0,
                    heroName = hero:GetUnitName() or "Haachama",
                    lasthits = PlayerResource:GetLastHits(playerID) or 0,
                    heroHealing = healing or 0,
                    points = 0,
                    str = hero:GetStrength() or 0,
                    agi = hero:GetAgility() or 0,
                    int = hero:GetIntellect() or 0,
                    items = {},
                    isDisconnect = false,
                }

                for item_slot = DOTA_ITEM_SLOT_1, DOTA_STASH_SLOT_6 do
                    local item = hero:GetItemInSlot(item_slot)
                    if item then
                        playerInfo.items[item_slot] = item:GetAbilityName()
                    end
                end

                local hNeutralItem = hero:GetItemInSlot(DOTA_ITEM_NEUTRAL_SLOT)
                if hNeutralItem then
                    playerInfo.items[DOTA_ITEM_NEUTRAL_SLOT] = hNeutralItem:GetAbilityName()
                end

                if not PlayerResource:IsFakeClient(playerID) then
                    playerNumber = playerNumber + 1

                    if PlayerResource:GetConnectionState(playerID) == DOTA_CONNECTION_STATE_CONNECTED then
                        playerInfo.points = basePoint
                    else
                        playerInfo.isDisconnect = true
                    end
                    -- 参战积分
                    local teamKills = GetTeamHeroKills(PlayerResource:GetTeam(playerID))

                    print("teamKills", teamKills)
                    if teamKills > 0 then
                        local battleParticipation = math.floor(battleParticipationBase * ((kills + assists) / teamKills))
                        print("battleParticipation", battleParticipation)
                        playerInfo.points = playerInfo.points + battleParticipation
                    end
                    -- -- find most kill 1st to 6th
                    -- for i = 1, 6 do
                    --     if mostKillList[i] == nil then
                    --         mostKillList[i] = kills
                    --         mostKillPlayerIDList[i] = playerID
                    --         break
                    --     elseif mostKillList[i] < kills then
                    --         for j = 6, i + 1, -1 do
                    --             mostKillList[j] = mostKillList[j - 1]
                    --             mostKillPlayerIDList[j] = mostKillPlayerIDList[j - 1]
                    --         end
                    --         mostKillList[i] = kills
                    --         mostKillPlayerIDList[i] = playerID
                    --         break
                    --     end
                    -- end
                    -- -- find assist kill 1st to 6th
                    -- for i = 1, 6 do
                    --     if mostAssistsList[i] == nil then
                    --         mostAssistsList[i] = assists
                    --         mostAssistsPlayerList[i] = playerID
                    --         break
                    --     elseif mostAssistsList[i] < assists then
                    --         for j = 6, i + 1, -1 do
                    --             mostAssistsList[j] = mostAssistsList[j - 1]
                    --             mostAssistsPlayerList[j] = mostAssistsPlayerList[j - 1]
                    --         end
                    --         mostAssistsList[i] = assists
                    --         mostAssistsPlayerList[i] = playerID
                    --         break
                    --     end
                    -- end

                    if damagereceived > mostDamageReceived_1 then
                        mostDamageReceivedPlayerID_2 = mostDamageReceivedPlayerID_1
                        mostDamageReceived_2 = mostDamageReceived_1
                        mostDamageReceivedPlayerID_1 = playerID
                        mostDamageReceived_1 = damagereceived
                    elseif damagereceived > mostDamageReceived_2 then
                        mostDamageReceivedPlayerID_2 = playerID
                        mostDamageReceived_2 = damagereceived
                    end

                    if healing > mostHealing_1 then
                        mostHealingPlayerID_2 = mostHealingPlayerID_1
                        mostHealing_2 = mostHealing_1
                        mostHealingPlayerID_1 = playerID
                        mostHealing_1 = healing
                    elseif healing > mostHealing_2 then
                        mostHealingPlayerID_2 = playerID
                        mostHealing_2 = healing
                    end

                    if towerKills > mostTowerKill_1 then
                        mostTowerKillPlayerID_2 = mostTowerKillPlayerID_1
                        mostTowerKill_2 = mostTowerKill_1
                        mostTowerKillPlayerID_1 = playerID
                        mostTowerKill_1 = towerKills
                    elseif towerKills > mostTowerKill_2 then
                        mostTowerKillPlayerID_2 = playerID
                        mostTowerKill_2 = towerKills
                    end

                end

                data.players[playerID] = playerInfo
            end
        end
    end

    local pointOne = playerNumber * 1
    local pointHalf = playerNumber * 0.5

    -- add point to most player
    -- for i = 1, #mostKillPlayerIDList do
    --     local playerID = mostKillPlayerIDList[i]
    --     data.players[playerID].points = data.players[playerID].points + playerNumber * (2 - 0.2 * (i - 1))
    -- end
    -- for i = 1, #mostAssistsPlayerList do
    --     local playerID = mostAssistsPlayerList[i]
    --     data.players[playerID].points = data.players[playerID].points + playerNumber * (2 - 0.2 * (i - 1))
    -- end


    if mostDamageReceivedPlayerID_1 ~= -1 then
        data.players[mostDamageReceivedPlayerID_1].points = data.players[mostDamageReceivedPlayerID_1].points + pointOne
    end
    if mostDamageReceivedPlayerID_2 ~= -1 then
        data.players[mostDamageReceivedPlayerID_2].points = data.players[mostDamageReceivedPlayerID_2].points + pointHalf
    end
    if mostHealingPlayerID_1 ~= -1 then
        data.players[mostHealingPlayerID_1].points = data.players[mostHealingPlayerID_1].points + pointOne
    end
    if mostHealingPlayerID_2 ~= -1 then
        data.players[mostHealingPlayerID_2].points = data.players[mostHealingPlayerID_2].points + pointHalf
    end
    if mostTowerKillPlayerID_1 ~= -1 then
        data.players[mostTowerKillPlayerID_1].points = data.players[mostTowerKillPlayerID_1].points + pointOne
    end
    if mostTowerKillPlayerID_2 ~= -1 then
        data.players[mostTowerKillPlayerID_2].points = data.players[mostTowerKillPlayerID_2].points + pointHalf
    end
    -- filter points
    for playerID, playerInfo in pairs(data.players) do
        playerInfo.points = AIGameMode:FilterSeasonPoint(playerInfo, winnerTeamId)
    end

    local sTable = "ending_stats"

    CustomNetTables:SetTableValue(sTable, "player_data", data)

    return data
end


function AIGameMode:FilterSeasonPoint(playerInfo, winnerTeamId)
    local points = playerInfo.points

    if GameRules:IsCheatMode() and not AIGameMode.DebugMode then
        print("Cheat mode is on, no season point will be given")
        return 0
    end
    if AIGameMode.sumTowerPower <= 6 then
        print("Tower power is low than 100%, half season point will be given")
        points = points * 0.5
    end
    if AIGameMode.iDesiredDire < 10 then
        print("DesiredDire bot is less than 10")
        points = points * AIGameMode.iDesiredDire / 10
    end

    if GameRules:GetDOTATime(false, true) < 15 * 60 then
        points = points * 0.5
    end
    if winnerTeamId ~= DOTA_TEAM_GOODGUYS then
        points = points * 0.5
    end
    return math.ceil(points)
end

function AIGameMode:StackToPercentage(iStackCount)
    if iStackCount == 1 then
        return "50%"
    elseif iStackCount == 2 then
        return "75%"
    elseif iStackCount == 3 then
        return "100%"
    elseif iStackCount == 4 then
        return "125%"
    elseif iStackCount == 5 then
        return "150%"
    elseif iStackCount == 6 then
        return "175%"
    elseif iStackCount == 7 then
        return "200%"
    elseif iStackCount == 8 then
        return "250%"
    elseif iStackCount == 9 then
        return "300%"
    elseif iStackCount == 10 then
        return "500%"
    elseif iStackCount == 11 then
        -- for test
        return "1000%"
    else
        return "100%"
    end
end

