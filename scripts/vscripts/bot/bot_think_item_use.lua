
--[[ ============================================================================================================
	Author: Windy
	Date: September 14, 2021
================================================================================================================= ]]


--------------------
function UseActiveItem(hHero)
    local itemUseCastRange = 900
    if hHero:HasItemInInventory("arcane_octarine_core") or hHero:HasItemInInventory("item_octarine_core") then
        itemUseCastRange = itemUseCastRange + 300
    end
	local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, itemUseCastRange)
	if #tAllHeroes == 0 then
        return false
	end
    local hTarget = tAllHeroes[1]
    -- item_blade_mail_2
    if BotThink:UseItem(hHero, "item_blade_mail_2") then
        return true
    end
    -- item_black_king_bar_2
    if BotThink:UseItem(hHero, "item_black_king_bar_2") then
        return true
    end
    -- item_insight_armor
    if BotThink:UseItem(hHero, "item_insight_armor") then
        return true
    end
    -- if health < 0.4
    if hHero:GetHealth() < hHero:GetMaxHealth() * 0.4 then
        -- item_undying_heart
        if BotThink:UseItem(hHero, "item_undying_heart") then
            return true
        end
        -- 大撒旦
        if BotThink:UseItem(hHero, "item_satanic_2") then
            return true
        end
        -- item_silver_edge_2 无敌之刃
        if BotThink:UseItem(hHero, "item_silver_edge_2") then
            return true
        end
    else
        -- item_jump_jump_jump 大跳刀
        if BotThink:UseItemOnPostion(hHero, "item_jump_jump_jump", hTarget) then
            return true
        end

        if BotThink:IsItemCanUse(hHero, "item_abyssal_blade_v2") then
            itemUseCastRange = 600
            local tAllHeroesRange600 = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, itemUseCastRange)
            if #tAllHeroesRange600 > 0 then
                local hTargetRange600 = tAllHeroesRange600[1]

                -- item_abyssal_blade_v2 一闪
                if BotThink:UseItemOnTarget(hHero, "item_abyssal_blade_v2", hTargetRange600) then
                    return true
                end
            end
        end
    end

    -- item_blue_fantasy 大否决
    if BotThink:UseItemOnTarget(hHero, "item_blue_fantasy", hTarget) then
        return true
    end
    -- 风暴之锤
    if BotThink:UseItemOnPostion(hHero, "item_gungir_2", hTarget) then
        return true
    end

    -- item_magic_scepter
    if BotThink:UseItem(hHero, "item_magic_scepter") then
        return true
    end
    -- item_hallowed_scepter 仙云法杖
    if BotThink:UseItem(hHero, "item_hallowed_scepter") then
        return true
    end
    -- item_shivas_guard_2 雅典娜的守护
    if BotThink:UseItem(hHero, "item_shivas_guard_2") then
        return true
    end

    -- item_wasp_despotic
    if BotThink:UseItem(hHero, "item_wasp_despotic") then
        return true
    end
    -- item_wasp_callous
    if BotThink:UseItem(hHero, "item_wasp_callous") then
        return true
    end
    -- item_wasp_golden
    if BotThink:UseItem(hHero, "item_wasp_golden") then
        return true
    end

    -- item_adi_king
    if BotThink:UseItem(hHero, "item_adi_king") then
        return true
    end
    -- item_adi_king_plus
    if BotThink:UseItem(hHero, "item_adi_king_plus") then
        return true
    end

    -- refresh 刷新
    if BotThink:IsItemCanUse(hHero, "item_refresher") then
        local hAbility6 = hHero:GetAbilityByIndex(5)
        if hAbility6 and hAbility6:GetCooldownTimeRemaining() > 10 then
            if BotThink:UseItem(hHero, "item_refresher") then
                return true
            end
        end
    end

    if BotThink:IsItemCanUse(hHero, "item_hurricane_pike_2") or BotThink:IsItemCanUse(hHero, "item_silver_edge_2") then
        itemUseCastRange = 600
        tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, itemUseCastRange)
        if #tAllHeroes > 0 then
            -- item_hurricane_pike_2 黄金魔龙枪
            if BotThink:UseItemOnTarget(hHero, "item_hurricane_pike_2", tAllHeroes[1]) then
                return true
            end
            -- item_silver_edge_2 无敌之刃
            if BotThink:UseItem(hHero, "item_silver_edge_2") then
                return true
            end
        end
    end

    if BotThink:IsItemCanUse(hHero, "item_heavens_halberd_v2") then
        itemUseCastRange = 300
        tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, itemUseCastRange)
        if #tAllHeroes > 0 then
            -- item_heavens_halberd_v2 大天堂
            if BotThink:UseItem(hHero, "item_heavens_halberd_v2") then
                return true
            end
        end
    end

    return false
end
