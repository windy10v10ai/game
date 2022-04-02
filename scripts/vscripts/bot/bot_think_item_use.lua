
--[[ ============================================================================================================
	Author: Windy
	Date: September 14, 2021
================================================================================================================= ]]

--------------------
-- common function
--------------------

-- find item
function FindItemByNameNotIncludeBackpack(hHero, sName)
	for i = 0, 5 do
		if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
	end
	return nil
end

function FindItemByName(hHero, sName)
	for i = 0, 8 do
		if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
	end
	return nil
end

function FindItemByNameIncludeStash(hHero, sName)
	for i = 0, 15 do
		if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
	end
	return nil
end

function IsItemCanUse(hHero, sName)
    if hHero:HasItemInInventory(sName) then
        local item = FindItemByNameNotIncludeBackpack(hHero, sName)
        if item and item:IsCooldownReady() then
            return true
        end
    end
    return false
end
-- find unit
function FindEnemyHeroesInRangeAndVisible(hHero, iRange)
    local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_ANY_ORDER, false)
    return tAllHeroes
end

-- use item
function UseItemOnTarget(hHero, sItemName, hTarget)
	if not hHero:HasItemInInventory(sItemName) then
		return false
	end
    local hItem = FindItemByNameNotIncludeBackpack(hHero, sItemName)
    if hItem then
        if hItem:IsCooldownReady() then
            print("Think use "..hHero:GetName().." try to use item "..sItemName)
            hHero:CastAbilityOnTarget(hTarget, hItem, hHero:GetPlayerOwnerID())
            return true
        end
	end
    return false
end


function UseItemOnPostion(hHero, sItemName, hTarget)
	if not hHero:HasItemInInventory(sItemName) then
		return false
	end
    local hItem = FindItemByNameNotIncludeBackpack(hHero, sItemName)
    if hItem then
        if hItem:IsCooldownReady() then
            print("Think use "..hHero:GetName().." try to use item on postion "..sItemName)
            hHero:CastAbilityOnPosition(hTarget:GetOrigin(), hItem, hHero:GetPlayerOwnerID())
            return true
        end
	end
    return false
end

function UseItem(hHero, sItemName)
	if not hHero:HasItemInInventory(sItemName) then
		return false
	end
    local hItem = FindItemByNameNotIncludeBackpack(hHero, sItemName)
    if hItem then
        if hItem:IsCooldownReady() then
            print("Think use "..hHero:GetName().." try to use item "..sItemName)
            hHero:CastAbilityNoTarget(hItem, hHero:GetPlayerOwnerID())
            return true
        end
	end
    return false
end

--------------------
function UseActiveItem(hHero)
    local itemUseCastRange = 900
    if hHero:HasItemInInventory("arcane_octarine_core") or hHero:HasItemInInventory("item_octarine_core") then
        itemUseCastRange = itemUseCastRange + 300
    end
	local tAllHeroes = FindEnemyHeroesInRangeAndVisible(hHero, itemUseCastRange)
	if #tAllHeroes == 0 then
        return false
	end
    local hTarget = tAllHeroes[1]
    -- item_blade_mail_2
    if UseItem(hHero, "item_blade_mail_2") then
        return true
    end
    -- item_black_king_bar_2
    if UseItem(hHero, "item_black_king_bar_2") then
        return true
    end
    -- item_insight_armor
    if UseItem(hHero, "item_insight_armor") then
        return true
    end
    -- if health < 0.4
    if hHero:GetHealth() < hHero:GetMaxHealth() * 0.4 then
        -- item_undying_heart
        if UseItem(hHero, "item_undying_heart") then
            return true
        end
        -- 大撒旦
        if UseItem(hHero, "item_satanic") then
            return true
        end
        -- item_silver_edge_2 无敌之刃
        if UseItem(hHero, "item_silver_edge_2") then
            return true
        end
    else
        -- item_jump_jump_jump 大跳刀
        if UseItemOnPostion(hHero, "item_jump_jump_jump", hTarget) then
            return true
        end

        if IsItemCanUse(hHero, "item_abyssal_blade_v2") then
            itemUseCastRange = 600
            local tAllHeroesRange600 = FindEnemyHeroesInRangeAndVisible(hHero, itemUseCastRange)
            if #tAllHeroesRange600 > 0 then
                local hTargetRange600 = tAllHeroesRange600[1]

                -- item_abyssal_blade_v2 一闪
                if UseItemOnTarget(hHero, "item_abyssal_blade_v2", hTargetRange600) then
                    return true
                end
            end
        end
    end

    -- item_blue_fantasy 大否决
    if UseItemOnTarget(hHero, "item_blue_fantasy", hTarget) then
        return true
    end
    -- 风暴之锤
    if UseItemOnPostion(hHero, "item_gungir_2", hTarget) then
        return true
    end

    -- item_magic_scepter
    if UseItem(hHero, "item_magic_scepter") then
        return true
    end
    -- item_hallowed_scepter 仙云法杖
    if UseItem(hHero, "item_hallowed_scepter") then
        return true
    end
    -- item_shivas_guard_2 雅典娜的守护
    if UseItem(hHero, "item_shivas_guard_2") then
        return true
    end

    -- item_wasp_despotic
    if UseItem(hHero, "item_wasp_despotic") then
        return true
    end
    -- item_wasp_callous
    if UseItem(hHero, "item_wasp_callous") then
        return true
    end
    -- item_wasp_golden
    if UseItem(hHero, "item_wasp_golden") then
        return true
    end

    -- item_adi_king
    if UseItem(hHero, "item_adi_king") then
        return true
    end
    -- item_adi_king_plus
    if UseItem(hHero, "item_adi_king_plus") then
        return true
    end

    -- refresh 刷新
    if IsItemCanUse(hHero, "item_refresher") then
        local hAbility6 = hHero:GetAbilityByIndex(5)
        if hAbility6 and hAbility6:GetCooldownTimeRemaining() > 10 then
            if UseItem(hHero, "item_refresher") then
                return true
            end
        end
    end

    if IsItemCanUse(hHero, "item_hurricane_pike_2") or IsItemCanUse(hHero, "item_silver_edge_2") then
        itemUseCastRange = 600
        tAllHeroes = FindEnemyHeroesInRangeAndVisible(hHero, itemUseCastRange)
        if #tAllHeroes > 0 then
            -- item_hurricane_pike_2 黄金魔龙枪
            if UseItemOnTarget(hHero, "item_hurricane_pike_2", tAllHeroes[1]) then
                return true
            end
            -- item_silver_edge_2 无敌之刃
            if UseItem(hHero, "item_silver_edge_2") then
                return true
            end
        end
    end

    if IsItemCanUse(hHero, "item_heavens_halberd_v2") then
        itemUseCastRange = 300
        tAllHeroes = FindEnemyHeroesInRangeAndVisible(hHero, itemUseCastRange)
        if #tAllHeroes > 0 then
            -- item_heavens_halberd_v2 大天堂
            if UseItem(hHero, "item_heavens_halberd_v2") then
                return true
            end
        end
    end

    return false
end
