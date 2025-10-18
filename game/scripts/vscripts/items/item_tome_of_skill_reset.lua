if item_tome_of_skill_reset == nil then item_tome_of_skill_reset = class({}) end

-- 排除的技能黑名单
local EXCLUDED_ABILITIES = {
    -- 属性加成
    ["special_bonus_attributes"] = true,
    -- 地图功能性技能
    ["ability_capture"] = true,
    ["ability_lamp_use"] = true,
    ["twin_gate_portal_warp"] = true,
    ["abyssal_underlord_portal_warp"] = true,
    ["teleport"] = true,
    ["courier_burst"] = true,
    ["courier_shield"] = true,
    -- 天赋技能
    ["special_bonus_"] = true, -- 所有以此开头的技能
}
function item_tome_of_skill_reset:OnSpellStart()
    if not IsServer() then return end

    local caster = self:GetCaster()
    local playerID = caster:GetPlayerOwnerID()

    print("[SkillReset] OnSpellStart called")
    print("[SkillReset] PlayerID: " .. playerID)

    local steamAccountID = PlayerResource:GetSteamAccountID(playerID)
    print("[SkillReset] SteamAccountID: " .. steamAccountID)

    -- 收集当前技能
    local current_abilities = {}
    local count = 0
    for i = 0, caster:GetAbilityCount() - 1 do
        local ability = caster:GetAbilityByIndex(i)
        if ability and ability:GetLevel() > 0 and not ability:IsPassive() and not ability:IsItem() then
            count = count + 1
            -- 关键修改:使用字符串键而不是数字索引
            current_abilities[tostring(count)] = {
                name = ability:GetAbilityName(),
                index = i,
                level = ability:GetLevel()
            }
        end
    end

    print("[SkillReset] Collected " .. count .. " current abilities")

    -- 获取可学习的技能列表(这里需要实现技能池逻辑)
    local available_abilities = {}

    -- 准备要设置的数据
    local data = {
        current_abilities = current_abilities,
        available_abilities = available_abilities
    }

    print("[SkillReset] Setting CustomNetTables...")
    print("[SkillReset] Data to set:")
    print("  current_abilities count: " .. count)

    -- 设置 CustomNetTables
    CustomNetTables:SetTableValue("skill_reset", tostring(steamAccountID), data)

    print("[SkillReset] CustomNetTables set successfully")

    -- 验证数据是否正确设置
    local verification = CustomNetTables:GetTableValue("skill_reset", tostring(steamAccountID))
    if verification then
        print("[SkillReset] Verification: Data exists in CustomNetTables")
        local verify_count = 0
        for k, v in pairs(verification.current_abilities) do
            verify_count = verify_count + 1
        end
        print("[SkillReset] Verification: current_abilities count = " .. verify_count)
    else
        print("[SkillReset] Verification: Data NOT found in CustomNetTables!")
    end

    -- 消耗物品
    caster:RemoveItem(self)
end

function item_tome_of_skill_reset:IsExcludedAbility(ability_name)
    if EXCLUDED_ABILITIES[ability_name] then
        return true
    end

    -- 检查是否以特定前缀开头
    if string.find(ability_name, "^special_bonus_") then
        return true
    end

    return false
end

function item_tome_of_skill_reset:GetRandomAbilities(hero, count)
    -- 这里可以复用抽奖系统的技能池
    -- 简化实现:返回一些示例技能
    local ability_pool = {
        "juggernaut_blade_fury",
        "sven_storm_bolt",
        "earthshaker_fissure",
        "pudge_meat_hook",
        "lion_impale",
        "lina_dragon_slave"
    }

    local result = {}
    local hero_abilities = {}

    -- 收集英雄已有的技能
    for i = 0, hero:GetAbilityCount() - 1 do
        local ability = hero:GetAbilityByIndex(i)
        if ability then
            hero_abilities[ability:GetAbilityName()] = true
        end
    end

    -- 随机选择技能,排除已有的
    for i = 1, math.min(count, #ability_pool) do
        local ability_name = ability_pool[i]
        if not hero_abilities[ability_name] then
            table.insert(result, {
                name = ability_name,
                level = 1
            })
        end
    end

    return result
end

-- 监听移除技能事件
function item_tome_of_skill_reset:RegisterEvents()
    CustomGameEventManager:RegisterListener("skill_reset_remove_ability", function(_, event)
        local playerID = event.PlayerID
        local ability_name = event.ability_name
        local ability_index = event.ability_index

        local hero = PlayerResource:GetSelectedHeroEntity(playerID)
        if not hero then return end

        local ability = hero:GetAbilityByName(ability_name)
        if not ability then return end

        -- 保存技能索引位置
        local saved_index = ability:GetAbilityIndex()

        -- 返还技能点
        local skill_points = ability:GetLevel()
        hero:SetAbilityPoints(hero:GetAbilityPoints() + skill_points)

        -- 移除技能
        hero:RemoveAbility(ability_name)

        -- 保存索引供后续使用
        hero.last_removed_ability_index = saved_index
    end)

    CustomGameEventManager:RegisterListener("skill_reset_add_ability", function(_, event)
        local playerID = event.PlayerID
        local ability_name = event.ability_name

        local hero = PlayerResource:GetSelectedHeroEntity(playerID)
        if not hero then return end

        -- 添加新技能
        local new_ability = hero:AddAbility(ability_name)
        if not new_ability then return end

        -- 如果有保存的索引位置,将新技能移到该位置
        if hero.last_removed_ability_index then
            local current_ability_at_index = hero:GetAbilityByIndex(hero.last_removed_ability_index)
            if current_ability_at_index then
                hero:SwapAbilities(
                    current_ability_at_index:GetAbilityName(),
                    new_ability:GetAbilityName(),
                    false,
                    true
                )
            end
            hero.last_removed_ability_index = nil
        end

        -- 消耗1点技能点学习技能
        if hero:GetAbilityPoints() > 0 then
            new_ability:SetLevel(1)
            hero:SetAbilityPoints(hero:GetAbilityPoints() - 1)
        end
    end)
end

-- 在游戏开始时注册事件
if IsServer() then
    ListenToGameEvent("game_rules_state_change", function()
        if GameRules:State_Get() == DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP then
            local item = item_tome_of_skill_reset()
            item:RegisterEvents()
        end
    end, nil)
end
