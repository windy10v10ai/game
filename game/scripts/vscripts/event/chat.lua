-- 注册测试人员id
local developerSteamAccountID = {}
developerSteamAccountID[136407523] = "windy"
developerSteamAccountID[1194383041] = "咸鱼"
developerSteamAccountID[916506173] = "Arararara"
developerSteamAccountID[353885092] = "76岁靠谱成年男性"
developerSteamAccountID[385130282] = "mimihua"


local function removeAllPlayerModifiers()
    local modiferList = {
        "property_cooldown_percentage", "property_cast_range_bonus_stacking",
        "property_spell_amplify_percentage",
        "property_status_resistance_stacking", "property_evasion_constant",
        "property_magical_resistance_bonus",
        "property_incoming_damage_percentage", "property_attack_range_bonus",
        "property_physical_armor_bonus", "property_preattack_bonus_damage",
        "property_attackspeed_bonus_constant", "property_stats_strength_bonus",
        "property_stats_agility_bonus", "property_stats_intellect_bonus",
        "property_health_regen_percentage",
        "property_mana_regen_total_percentage", "property_lifesteal",
        "property_spell_lifesteal", "property_movespeed_bonus_constant",
        "property_ignore_movespeed_limit", "property_cannot_miss"
    }
    -- give all player item
    local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil,
        99999, DOTA_UNIT_TARGET_TEAM_BOTH,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER, false)
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
    if not iPlayerID or not sChatMsg then return end
    local steamAccountID = PlayerResource:GetSteamAccountID(iPlayerID)

    -- 开发测试代码
    if developerSteamAccountID[steamAccountID] then
        if sChatMsg:find('^-refresh buyback$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            hHero:SetBuybackCooldownTime(0)
            return
        end

        -- change all hero
        if sChatMsg:find('^-change hero all .+') then
            local heroName = sChatMsg:sub(18)
            Printf("开发者:" .. developerSteamAccountID[steamAccountID] ..
                " 给所有人更换英雄:" .. heroName)
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM,
                Vector(0, 0, 0), nil, 99999,
                DOTA_UNIT_TARGET_TEAM_BOTH,
                DOTA_UNIT_TARGET_HERO,
                DOTA_UNIT_TARGET_FLAG_NONE,
                FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                local playerID = hero:GetPlayerID()
                PlayerResource:ReplaceHeroWith(playerID, heroName, 0, 0)
            end
            return
        end

        if sChatMsg:find('^-hploss$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            hHero:SetHealth(hHero:GetHealth() * 0.1)
            return
        end
    end
end
