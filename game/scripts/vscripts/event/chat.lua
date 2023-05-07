
-- 注册测试人员id
local developerSteamAccountID = {}
developerSteamAccountID[136407523] = "windy"
developerSteamAccountID[1194383041] = "咸鱼"
developerSteamAccountID[916506173] = "Arararara"
developerSteamAccountID[353885092] = "76岁靠谱成年男性"

local function removeAllItems()
    local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
    for _, hero in pairs(tAllHeroes) do
        for i = 0, 8 do
            local item = hero:GetItemInSlot(i)
            if item then
                hero:RemoveItem(item)
            end
        end
    end
end

local function removeAllPlayerModifiers()

    local modiferList = {
        "property_cooldown_percentage",
        "property_cast_range_bonus_stacking",
        "property_spell_amplify_percentage",
        "property_status_resistance_stacking",
        "property_magical_resistance_bonus",
        "property_incoming_damage_percentage",
        "property_attack_range_bonus",
        "property_physical_armor_bonus",
        "property_preattack_bonus_damage",
        "property_attackspeed_bonus_constant",
        "property_stats_strength_bonus",
        "property_stats_agility_bonus",
        "property_stats_intellect_bonus",
        "property_health_regen_percentage",
        "property_mana_regen_total_percentage",
        "property_lifesteal",
        "property_spell_lifesteal",
        "property_movespeed_bonus_constant",
        "property_ignore_movespeed_limit",
        "property_cannot_miss",
    }
    -- give all player item
    local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
    for _, hero in pairs(tAllHeroes) do
        local hereModifiers = hero:FindAllModifiers()
        for _, modifier in pairs(hereModifiers) do
            for _, modifierName in pairs(modiferList) do
                if modifier:GetName() == modifierName then
                    hero:RemoveModifierByName(modifierName)
                end
            end
        end
    end
end
function AIGameMode:OnPlayerChat(event)
    local iPlayerID = event.playerid
    local sChatMsg = event.text
    if not iPlayerID or not sChatMsg then
        return
    end
    local steamAccountID = PlayerResource:GetSteamAccountID(iPlayerID)

    -- 开发测试代码
    if developerSteamAccountID[steamAccountID] then
    -- if AIGameMode.DebugMode and developerSteamAccountID[steamAccountID] then
        if sChatMsg:find('^-pos$') then
            -- get position
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            -- print position
            local pos = hHero:GetAbsOrigin()
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] .. " 的位置是:" .. pos.x .. "," .. pos.y ..
                    "," .. pos.z)
            return
        end

        if sChatMsg:find('^-modifier$') then
            -- get position
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            -- print all modifiers
            local modifiers = hHero:FindAllModifiers()
            for _, modifier in pairs(modifiers) do
                Printf("Get here modifiers: "..modifier:GetName())
            end
            return
        end

        if sChatMsg:find('^-kill$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            hHero:ForceKill(true)
            return
        end

        if sChatMsg:find('^-kill hero$') then
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                hero:ForceKill(true)
            end
            return
        end

        if sChatMsg:find('^-kill creep$') then
            local tAllCreep = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_CREEP, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, creep in pairs(tAllCreep) do
                creep:ForceKill(true)
            end
            return
        end

        if sChatMsg:find('^-refresh buyback$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            hHero:SetBuybackCooldownTime(0)
            return
        end

        if sChatMsg:find('^-shard$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            hHero:AddItemByName('item_aghanims_shard')
            return
        end
        if sChatMsg:find('^-lottery$') then
            AIGameMode.tIfItemChosen[iPlayerID] = false
            AIGameMode.tIfItemChooseInited[iPlayerID] = false
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            AIGameMode:SpecialItemAdd(hHero)
            return
        end

        -- player info all
        if sChatMsg:find('^-player info all$') then
            for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
                if PlayerResource:IsValidPlayerID(playerID) and PlayerResource:IsValidPlayer(playerID) and
                        PlayerResource:GetSelectedHeroEntity(playerID) then
                    if PlayerResource:GetTeam(playerID) == DOTA_TEAM_GOODGUYS then
                        local hero = PlayerResource:GetSelectedHeroEntity(playerID)
                        local playerName = PlayerResource:GetPlayerName(playerID)
                        local heroName = hero:GetUnitName()
                        Printf("玩家:" .. playerName .. " playerID:" .. playerID .. " 英雄:" .. heroName)
                    end
                end
            end
            return
        end


        if sChatMsg:find('^-item all .+') then
            local item = sChatMsg:sub(11)
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] .. " 给所有人添加物品:" .. item)
            -- give all player item
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                hero:AddItemByName(item)
            end
            return
        end

        if sChatMsg:find('^-change item all .+') then
            local item = sChatMsg:sub(18)
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] .. " 给所有人替换所有物品:" .. item)

            removeAllItems()

            -- give all player item
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                hero:AddItemByName(item)
                hero:AddItemByName(item)
                hero:AddItemByName(item)
                hero:AddItemByName(item)
                hero:AddItemByName(item)
                hero:AddItemByName(item)
            end
            return
        end

        -- remove item
        if sChatMsg:find('^-remove item$') then
            removeAllItems()
            return
        end

        -- remove item modifer
        if sChatMsg:find('^-remove item modifier$') then
            local modiferList = {
                "modifier_item_aghanims_shard",
                "modifier_item_ultimate_scepter",
                "modifier_item_ultimate_scepter_2_consumed",
                "modifier_item_wings_of_haste_consumed",
                "modifier_item_moon_shard_datadriven_consumed",
                "modifier_agi_tome",
                "modifier_str_tome",
                "modifier_int_tome",
                "modifier_luoshu_tome",
            }
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                for _, modifier in pairs(modiferList) do
                    if hero:HasModifier(modifier) then
                        hero:RemoveModifierByName(modifier)
                    end
                end
            end
            return
        end

        -- add all modifier
        if sChatMsg:find('^-add modifier all .+') then
            local modifier = sChatMsg:sub(19)
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] .. " 给所有人添加modifier:" .. modifier)
            -- give all player item
            removeAllPlayerModifiers()
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                -- loop 100 times
                for i = 1, 100 do
                    hero:AddNewModifier(hero, nil, modifier, {value = 1, level = 1})
                end
            end
            return
        end

        -- remove all modifier
        if sChatMsg:find('^-remove player modifier') then
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] .. " 给所有人移除player modifier")
            removeAllPlayerModifiers()
            return
        end


        -- change all hero
        if sChatMsg:find('^-change hero all .+') then
            local heroName = sChatMsg:sub(18)
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] .. " 给所有人更换英雄:" .. heroName)
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                local playerID = hero:GetPlayerID()
                PlayerResource:ReplaceHeroWith(playerID, heroName, 0, 0)
            end
            return
        end

        if sChatMsg:find('^-g$') then
            local hero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            PlayerResource:ModifyGold(iPlayerID, 99999, true, DOTA_ModifyGold_CheatCommand)
            hero:AddExperience(99999, DOTA_ModifyXP_Unspecified, false, false)
            return
        end

        if sChatMsg:find('^-gall$') then
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                hero:ModifyGold(99999, true, DOTA_ModifyGold_CheatCommand)
                hero:AddExperience(999999, DOTA_ModifyXP_Unspecified, false, false)
            end
            return
        end

        if sChatMsg:find('^-hploss$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            hHero:SetHealth(hHero:GetHealth() * 0.1)
            return
        end

        if sChatMsg:find('^-postgame$') then
            print("[AIGameMode] SendEndGameInfo POST_GAME")
            local endData = AIGameMode:EndScreenStats(2, true)
            GameController:SendEndGameInfo(endData)
            return
        end

        if sChatMsg:find('^-f$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            LinkLuaModifier("modifier_wtf", "modifiers/test/modifier_wtf.lua", LUA_MODIFIER_MOTION_NONE)
            if hHero:HasModifier("modifier_wtf") then
                hHero:RemoveModifierByName("modifier_wtf")
            else
                hHero:AddNewModifier(hHero, nil, "modifier_wtf", { duration = 3600 })
            end
            return
        end

        if sChatMsg:find('^-cg$') then
            local totalMemory = collectgarbage("count");
            Printf("内存占用: " .. math.floor(totalMemory) .. " kb")
            return
        end
        if sChatMsg:find('^-cg .+') then
            local opt = sChatMsg:sub(5)
            local result = collectgarbage(opt);
            Printf(result)
            return
        end
    end
end
