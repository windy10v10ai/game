
--[[ ============================================================================================================
	Author: Windy
	Date: September 14, 2021
================================================================================================================= ]]

--------------------
-- Initial
--------------------
if BotItemThink == nil then
	print("Bot Item Think initialize!")
	_G.BotItemThink = class({}) -- put in the global scope
end

--------------------
function BotItemThink:UseActiveItem(hHero)
    -- 获取可使用装备列表
    local tUsableItems = BotItemThink:GetUsableItems(hHero)

    -- 对友军目标
    -- 圣洁吊坠
    if BotItemThink:IsItemCanUse(tUsableItems, "item_holy_locket") then
        local iRange = GetFullCastRange(hHero, tUsableItems["item_holy_locket"])
        local tTeamHeroes = BotThink:FindFriendHeroesInRangeAndVisible(hHero, iRange)
        local iCount = #tTeamHeroes
        for i = 1, iCount do
            local hTeamHero = tTeamHeroes[i]
            if hTeamHero:GetHealthPercent() < 40 then
                if BotItemThink:UseItemOnTarget(tUsableItems, hHero, "item_holy_locket", hTeamHero) then
                    return true
                end
            end
        end
    end
    -- 苍洋魔珠
    if BotItemThink:IsItemCanUse(tUsableItems, "item_orb_of_the_brine") then
        local iRange = GetFullCastRange(hHero, tUsableItems["item_orb_of_the_brine"])
        local tTeamHeroes = BotThink:FindFriendHeroesInRangeAndVisible(hHero, iRange)
        local iCount = #tTeamHeroes
        for i = 1, iCount do
            local hTeamHero = tTeamHeroes[i]
            if hTeamHero:GetHealthPercent() < 40 then
                if BotItemThink:UseItemOnTarget(tUsableItems, hHero, "item_orb_of_the_brine", hTeamHero) then
                    return true
                end
            end
        end
    end

    -- 对敌军目标
    if BotItemThink:IsItemCanUse(tUsableItems, "item_abyssal_blade_v2") then
        if hHero:GetHealthPercent() > 10 then
            local iRange = GetFullCastRange(hHero, tUsableItems["item_abyssal_blade_v2"])
            local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
            if #tAllHeroes > 0 then
                local hTarget = tAllHeroes[1]
                if BotItemThink:UseItemOnTarget(tUsableItems, hHero, "item_abyssal_blade_v2", hTarget) then
                    return true
                end
            end
        end
    end


    -- item_blue_fantasy 苍蓝
    if BotItemThink:IsItemCanUse(tUsableItems, "item_blue_fantasy") then
        local iRange = GetFullCastRange(hHero, tUsableItems["item_blue_fantasy"])
        local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
        if #tAllHeroes > 0 then
            local hTarget = tAllHeroes[1]
            if BotItemThink:UseItemOnTarget(tUsableItems, hHero, "item_blue_fantasy", hTarget) then
                return true
            end
        end
    end

    -- item_necronomicon_staff 死灵法杖
    if BotItemThink:IsItemCanUse(tUsableItems, "item_necronomicon_staff") then
        local iRange = GetFullCastRange(hHero, tUsableItems["item_necronomicon_staff"])
        local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
        if #tAllHeroes > 0 then
            local hTarget = tAllHeroes[1]
            if BotItemThink:UseItemOnTarget(tUsableItems, hHero, "item_necronomicon_staff", hTarget) then
                return true
            end
        end
    end

    -- 大天堂
    if BotItemThink:IsItemCanUse(tUsableItems, "item_heavens_halberd_v2") then
        local iRange = GetFullCastRange(hHero, tUsableItems["item_heavens_halberd_v2"])
        local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
        if #tAllHeroes > 0 then
            local hTarget = tAllHeroes[1]
            if BotItemThink:UseItemOnTarget(tUsableItems, hHero, "item_heavens_halberd_v2", hTarget) then
                return true
            end
        end
    end

    -- 对点目标
    -- 大跳刀
    if BotItemThink:IsItemCanUse(tUsableItems, "item_jump_jump_jump") then
        if hHero:GetHealthPercent() > 20 then
            local iRange = GetFullCastRange(hHero, tUsableItems["item_jump_jump_jump"])
            local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
            if #tAllHeroes > 0 then
                local hTarget = tAllHeroes[1]
                if BotItemThink:UseItemOnPostion(tUsableItems, hHero, "item_jump_jump_jump", hTarget) then
                    return true
                end
            end
        end
    end

    -- 风暴之锤
    if BotItemThink:IsItemCanUse(tUsableItems, "item_gungir_2") then
        local iRange = GetFullCastRange(hHero, tUsableItems["item_gungir_2"])
        local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
        if #tAllHeroes > 0 then
            local hTarget = tAllHeroes[1]
            if BotItemThink:UseItemOnPostion(tUsableItems, hHero, "item_gungir_2", hTarget) then
                return true
            end
        end
    end

    -- 无目标 长距离
    local searchRange = 1200
	local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, searchRange)
	if #tAllHeroes == 0 then
        return false
	end

    -- item_blade_mail_2
    if hHero:GetHealthPercent() < 99 then
        if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_blade_mail_2") then
            return true
        end
    end

    -- item_insight_armor
    if hHero:GetHealthPercent() < 90 then
        if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_insight_armor") then
            return true
        end
    end

    -- 大龙心
    if hHero:GetHealthPercent() < 50 then
        if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_undying_heart") then
            return true
        end
    end

    -- item_silver_edge_2 无敌之刃
    if hHero:GetHealthPercent() < 50 then
        if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_silver_edge_2") then
            return true
        end
    end

    -- item_adi_king
    if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_adi_king") then
        return true
    end

    -- item_adi_king_plus
    if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_adi_king_plus") then
        return true
    end

    -- item_force_field
    if hHero:GetHealthPercent() < 90 then
        if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_force_field") then
            return true
        end
    end

    -- 无目标 中距离
    local searchRange = 900
    local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, searchRange)
    if #tAllHeroes == 0 then
        return false
    end

    -- 大撒旦
    if hHero:GetHealthPercent() < 60 then
        if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_satanic_2") then
            return true
        end
    end

    -- item_black_king_bar_2
    if hHero:GetHealthPercent() < 99 then
        if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_black_king_bar_2") then
            return true
        end
    end

    -- item_magic_scepter 小仙云
    if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_magic_scepter") then
        return true
    end

    -- item_hallowed_scepter 仙云法杖
    if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_hallowed_scepter") then
        return true
    end

    -- 分身斧
    if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_manta_1") then
        return true
    end

    -- item_wasp_despotic
    if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_wasp_despotic") then
        return true
    end

    -- item_wasp_callous
    if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_wasp_callous") then
        return true
    end

    -- item_wasp_golden
    if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_wasp_golden") then
        return true
    end

    -- 无目标 短距离
    local searchRange = 600
    local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, searchRange)
    if #tAllHeroes == 0 then
        return false
    end

    -- item_shivas_guard_2 雅典娜的守护
    if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_shivas_guard_2") then
        return true
    end

    -- refresh 刷新
    if BotItemThink:IsItemCanUse(tUsableItems, "item_refresher") then
        local hAbility6 = hHero:GetAbilityByIndex(5)
        if hAbility6 and hAbility6:GetCooldownTimeRemaining() > 10 then
            if BotItemThink:UseItemNoTarget(tUsableItems, hHero, "item_refresher") then
                return true
            end
        end
    end

    if BotItemThink:IsItemCanUse(tUsableItems, "item_hurricane_pike_2") then
        local itemUseCastRange = 600
        tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, itemUseCastRange)
        if #tAllHeroes > 0 then
            if BotItemThink:UseItemOnTarget(tUsableItems, hHero, "item_hurricane_pike_2", tAllHeroes[1]) then
                return true
            end
        end
    end

    return false
end


--
-- 获取可用的物品，检测CD和蓝耗
--
function BotItemThink:GetUsableItems(hHero)
    -- get hero current mana
    local nCurrentMana = hHero:GetMana()
    local tUsableItems = {}
	for i = 0, 5 do
        local hItem = hHero:GetItemInSlot(i)
        if hItem then
            -- is item in cooldown
            local sItemName = hItem:GetName()
            if hItem:GetCooldownTimeRemaining() == 0 then
                -- is mana enough
                local nItemManaCost = hItem:GetManaCost(-1)
                -- print(hHero:GetName() .. " item " .. sItemName .. " mana cost " .. nItemManaCost)
                if nCurrentMana >= nItemManaCost then
                    tUsableItems[sItemName] = hItem
                end
            end
        end
		if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
	end
    -- print(hHero:GetName() .. " usable item names: ")
    -- PrintTable(tUsableItems)
    return tUsableItems
end

--
-- 使用可用物品 指定物品名称，可用物品列表
-- 施法目标：无
--
function BotItemThink:UseItemNoTarget(tUsableItems, hHero, sItemName)
    local hItem = tUsableItems[sItemName]
    if hItem then
        hHero:CastAbilityNoTarget(hItem, hHero:GetPlayerOwnerID())
        return true
	end
    return false
end

--
-- 使用可用物品 指定物品名称，可用物品列表
-- 施法目标：Postion
--
function BotItemThink:UseItemOnPostion(tUsableItems, hHero, sItemName, hTarget)
    local hItem = tUsableItems[sItemName]
    if hItem then
        hHero:CastAbilityOnPosition(hTarget:GetOrigin(), hItem, hHero:GetPlayerOwnerID())
        return true
	end
    return false
end

--
-- 使用可用物品 指定物品名称，可用物品列表
-- 施法目标：Target
--
function BotItemThink:UseItemOnTarget(tUsableItems, hHero, sItemName, hTarget)
    local hItem = tUsableItems[sItemName]
    if hItem then
        hHero:CastAbilityOnTarget(hTarget, hItem, hHero:GetPlayerOwnerID())
        return true
	end
    return false
end

function BotItemThink:IsItemCanUse(tUsableItems, sItemName)
    local hItem = tUsableItems[sItemName]
    if hItem then
        return true
	end
    return false
end
