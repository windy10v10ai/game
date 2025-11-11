require("abilities/ability_blacklist_butterfly")

item_skill_talisman = class({})
LinkLuaModifier("modifier_skill_talisman_tracker", "items/item_skill_talisman.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_skill_talisman_display", "items/item_skill_talisman.lua", LUA_MODIFIER_MOTION_NONE)
if not _G.TalismanSkillData then
    _G.TalismanSkillData = {}
end

function item_skill_talisman:GetIntrinsicModifierName()
    return "modifier_skill_talisman_tracker"
end

function item_skill_talisman:OnSpellStart()
    local caster = self:GetCaster()
    local player_id = caster:GetPlayerOwnerID()
    local cursor_pos = self:GetCursorPosition()

    local stored_ability = _G.TalismanSkillData[player_id]

    if stored_ability and stored_ability.ability_name then
        -- 先消耗充能,防止失败时也消耗
        local item_consumed = false
        for item_slot = DOTA_ITEM_SLOT_1, DOTA_STASH_SLOT_6 do
            local item = caster:GetItemInSlot(item_slot)
            if item and item:GetName() == "item_skill_talisman" then
                local charges = item:GetCurrentCharges()
                if charges > 0 then
                    item:SetCurrentCharges(charges - 1)
                    item_consumed = true
                    if charges - 1 <= 0 then
                        item:RemoveSelf()
                    end
                    break
                end
            end
        end

        if not item_consumed then
            return
        end

        -- 设置标记,防止触发OnAbilityExecuted
        self.is_casting_stored_ability = true

        local existing_ability = caster:FindAbilityByName(stored_ability.ability_name)
        local temp_ability = nil
        local should_remove = false

        if existing_ability then
            temp_ability = existing_ability
        else
            temp_ability = caster:AddAbility(stored_ability.ability_name)
            should_remove = true
        end

        if temp_ability then
            local original_level = temp_ability:GetLevel()
            local original_cooldown = temp_ability:GetCooldownTimeRemaining()

            temp_ability:SetLevel(stored_ability.ability_level or 1)
            temp_ability:EndCooldown()

            local mana_cost = temp_ability:GetManaCost(-1)
            if caster:GetMana() < mana_cost then
                caster:GiveMana(mana_cost)
            end

            local behavior = temp_ability:GetBehavior()

            -- 检查是否为持续施法技能
            --local is_channelled = bit.band(behavior, DOTA_ABILITY_BEHAVIOR_CHANNELLED) ~= 0


            local cast_success = false

            if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) ~= 0 then
                local target_team = temp_ability:GetAbilityTargetTeam()
                local target_type = temp_ability:GetAbilityTargetType()
                local target_flags = temp_ability:GetAbilityTargetFlags()
                local cast_range = temp_ability:GetCastRange(cursor_pos, nil)

                local units = FindUnitsInRadius(
                    caster:GetTeamNumber(),
                    cursor_pos,
                    nil,
                    cast_range,
                    target_team,
                    target_type,
                    target_flags,
                    FIND_CLOSEST,
                    false
                )

                if #units > 0 then
                    caster:SetCursorCastTarget(units[1])
                    cast_success = caster:CastAbilityOnTarget(units[1], temp_ability, player_id)
                else
                    caster:SetCursorPosition(cursor_pos)
                    cast_success = caster:CastAbilityOnPosition(cursor_pos, temp_ability, player_id)
                end
            elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
                caster:SetCursorPosition(cursor_pos)
                cast_success = caster:CastAbilityOnPosition(cursor_pos, temp_ability, player_id)
            else
                cast_success = caster:CastAbilityNoTarget(temp_ability, player_id)
            end

            if not cast_success then
                caster:SetCursorPosition(cursor_pos)
                temp_ability:OnSpellStart()
            end

            -- 延长清理时间,确保技能效果完成
            if should_remove then
                Timers:CreateTimer(0.5, function()
                    if not caster:IsNull() then
                        caster:RemoveAbility(stored_ability.ability_name)
                    end
                end)
            else
                temp_ability:SetLevel(original_level)
                if original_cooldown > 0 then
                    temp_ability:StartCooldown(original_cooldown)
                end
            end
        end

        -- 清除标记
        Timers:CreateTimer(0.03, function()
            self.is_casting_stored_ability = false
        end)
    end
end

function item_skill_talisman:GetAbilitySpecialValue(key)
    if key == "stored_ability" then
        local caster = self:GetCaster()
        if not caster then return "无" end

        local player_id = caster:GetPlayerOwnerID()
        local stored_ability = _G.TalismanSkillData[player_id]

        if stored_ability and stored_ability.ability_name then
            return stored_ability.ability_name
        end
        return "无"
    end
    return 0
end

-- 添加tooltip更新函数
function item_skill_talisman:OnOwnerChanged(params)
    if IsServer() then
        local new_owner = params.new_owner
        if new_owner then
            -- 强制刷新tooltip
            self:SetLevel(self:GetLevel())
        end
    end
end

-- Modifier保持不变
modifier_skill_talisman_tracker = class({})

function modifier_skill_talisman_tracker:IsHidden()
    return true
end

function modifier_skill_talisman_tracker:IsPurgable()
    return false
end

function modifier_skill_talisman_tracker:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ABILITY_EXECUTED
    }
end

function modifier_skill_talisman_tracker:OnCreated()
    if IsServer() then
        local caster = self:GetCaster()
        local player_id = caster:GetPlayerOwnerID()
        --print("[modifier_skill_talisman_tracker] OnCreated for player:", player_id)

        -- 检查是否有存储的技能
        local stored_data = _G.TalismanSkillData[player_id]
        if stored_data and stored_data.ability_name then
            -- 添加 display modifier
            caster:AddNewModifier(caster, self:GetAbility(), "modifier_skill_talisman_display", {
                ability_name = stored_data.ability_name
            })
        end
    end
end

function modifier_skill_talisman_tracker:OnDestroy()
    if IsServer() then
        local caster = self:GetCaster()
        local player_id = caster:GetPlayerOwnerID()
        -- 立即移除 display modifier
        caster:RemoveModifierByName("modifier_skill_talisman_display")
        Timers:CreateTimer(0.1, function()
            local has_talisman = false

            for item_slot = DOTA_ITEM_SLOT_1, DOTA_STASH_SLOT_6 do
                local item = caster:GetItemInSlot(item_slot)
                if item and item:GetName() == "item_skill_talisman" then
                    has_talisman = true
                    break
                end
            end

            if not has_talisman then
                local items = Entities:FindAllByClassname("dota_item_drop")
                for _, item_entity in pairs(items) do
                    local item = item_entity:GetContainedItem()
                    if item and item:GetName() == "item_skill_talisman" and item:GetPurchaser() == caster then
                        has_talisman = true
                        break
                    end
                end
            end

            if not has_talisman then
                _G.TalismanSkillData[player_id] = nil
                -- print("[modifier_skill_talisman_tracker] Cleared stored ability for player", player_id,
                --     "(no talisman found)")
                -- Remove the display modifier
                caster:RemoveModifierByName("modifier_skill_talisman_display")
                -- print("[modifier_skill_talisman_tracker] Cleared stored ability for player", player_id,
                --     "(no talisman found)")
            else
                -- print("[modifier_skill_talisman_tracker] Player", player_id, "still has talisman, keeping stored ability")
            end
        end)
    end
end

function modifier_skill_talisman_tracker:OnAbilityExecuted(params)
    if not IsServer() then return end

    local caster = self:GetCaster()
    if params.unit ~= caster then return end

    local ability = params.ability
    if not ability or ability:IsItem() then return end

    local ability_name = ability:GetAbilityName()

    -- 防止记录物品本身
    if ability_name == "item_skill_talisman" then return end

    -- 防止记录通过物品释放的技能
    local talisman_item = caster:FindItemInInventory("item_skill_talisman")
    if talisman_item and talisman_item.is_casting_stored_ability then
        return
    end

    local player_id = caster:GetPlayerOwnerID()

    if _G.TalismanSkillData[player_id] then
        return
    end


    -- 使用共享黑名单检查
    if EXCLUDED_ABILITIES_ALLBUTTER[ability_name] then -- 通知玩家无法存储持续施法技能
        CustomGameEventManager:Send_ServerToPlayer(
            PlayerResource:GetPlayer(player_id),
            "talisman_cannot_store_EXCLUDED_ABILITIES_ALLBUTTER",
            { ability_name = ability_name }
        )
        return
    end

    -- 额外检查持续施法技能
    local behavior = ability:GetBehavior()
    if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_CHANNELLED) ~= 0 then -- 通知玩家无法存储持续施法技能
        CustomGameEventManager:Send_ServerToPlayer(
            PlayerResource:GetPlayer(player_id),
            "talisman_cannot_store_channelled",
            { ability_name = ability_name }
        )
        return
    end
    local behavior = ability:GetBehavior()

    -- 新增:排除持续施法技能
    if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_CHANNELLED) ~= 0 then
        -- 通知玩家无法存储持续施法技能
        CustomGameEventManager:Send_ServerToPlayer(
            PlayerResource:GetPlayer(player_id),
            "talisman_cannot_store_channelled",
            { ability_name = ability_name }
        )
        return
    end

    local stored_data = {
        ability_name = ability_name,
        ability_level = ability:GetLevel(),
        behavior = behavior
    }
    --print("[modifier_skill_talisman_display] stored_data")

    _G.TalismanSkillData[player_id] = stored_data
    CustomGameEventManager:Send_ServerToPlayer(PlayerResource:GetPlayer(player_id), "talisman_skill_stored", {
        ability_name = ability_name
    })
    --print("[modifier_skill_talisman_display] Send_ServerToPlayer")

    CustomNetTables:SetTableValue("skill_talisman", tostring(player_id), {
        ability_name = ability_name,
        ability_level = ability:GetLevel()
    })
    --print("[modifier_skill_talisman_display] SettedTableValue")

    -- Apply the display modifier to show the icon in buff bar
    -- 添加显示 modifier，并传递 ability_name
    caster:AddNewModifier(caster, self:GetAbility(), "modifier_skill_talisman_display", {
        ability_name = ability_name -- 关键：传递参数
    })
    --print("[modifier_skill_talisman_display] AddedNewModifier")
end

-- 先声明类
modifier_skill_talisman_display = class({})

function modifier_skill_talisman_display:IsHidden()
    return false
end

function modifier_skill_talisman_display:IsPurgable()
    return false
end

function modifier_skill_talisman_display:OnCreated(params)
    if IsServer() then
        -- 添加调试输出
        --print("[modifier_skill_talisman_display] OnCreated")
        --print("[modifier_skill_talisman_display] params:", params)
        --print("[modifier_skill_talisman_display] params.ability_name:", params.ability_name)

        -- 从参数中获取技能名称
        self.ability_name = params.ability_name

        --print("[modifier_skill_talisman_display] self.ability_name set to:", self.ability_name)

        -- 启用自定义数据传输
        self:SetHasCustomTransmitterData(true)
    end
end

-- 服务器端：打包要发送到客户端的数据
function modifier_skill_talisman_display:AddCustomTransmitterData()
    --print("[modifier_skill_talisman_display] AddCustomTransmitterData called")
    --print("[modifier_skill_talisman_display] self.ability_name:", self.ability_name)
    return {
        ability_name = self.ability_name
    }
end

-- 客户端：接收并处理服务器发来的数据
function modifier_skill_talisman_display:HandleCustomTransmitterData(data)
    self.ability_name = data.ability_name
end

function modifier_skill_talisman_display:GetTexture()
    -- 现在客户端也有 self.ability_name 了
    return self.ability_name or "item_ultimate_scepter"
end
