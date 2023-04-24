
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

        if sChatMsg:find('^-itemall .+') then
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] .. " 给所有人添加物品:" .. sChatMsg:sub(10))
            local item = sChatMsg:sub(10)
            -- give all player item
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                hero:AddItemByName(item)
            end
            return
        end

        if sChatMsg:find('^-itemreplace .+') then
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] .. " 给所有人替换所有物品:" .. sChatMsg:sub(14))

            removeAllItems()

            local item = sChatMsg:sub(14)
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

        -- remove all item
        if sChatMsg:find('^-rai$') then
            removeAllItems()
            return
        end

        -- remove all item modifer
        if sChatMsg:find('^-raim$') then
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

        -- change all hero
        if sChatMsg:find('^-changehero .+') then
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] .. " 给所有人更换英雄:" .. sChatMsg:sub(13))
            local heroName = sChatMsg:sub(13)
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
            hero:AddExperience(49999, DOTA_ModifyXP_Unspecified, false, false)
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
