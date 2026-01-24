-- 引入共享黑名单
require("abilities/ability_blacklist_butterfly")

ability_trigger_on_move = class({})

LinkLuaModifier("modifier_trigger_on_move", "abilities/ability_trigger_on_move", LUA_MODIFIER_MOTION_NONE)
-- 定义需要排除的技能黑名单
-- 这些技能不会被蝴蝶效应物品触发，避免游戏机制冲突或性能问题

function ability_trigger_on_move:GetIntrinsicModifierName()
    return "modifier_trigger_on_move"
end

modifier_trigger_on_move = class({})

function modifier_trigger_on_move:IsHidden()
    return true
end

function modifier_trigger_on_move:IsPermanent()
    return true
end

function modifier_trigger_on_move:RemoveOnDeath()
    return false
end

function modifier_trigger_on_move:IsPurgable()
    return false
end

function modifier_trigger_on_move:OnCreated()
    if not IsServer() then return end

    self.last_position = self:GetParent():GetAbsOrigin()
    self.check_interval = self:GetAbility():GetSpecialValueFor("check_interval") or 0.5 -- 检查间隔
    self.base_distance = 100                                                            -- 基准距离

    -- 使用更长的检查间隔降低开销
    self:StartIntervalThink(self.check_interval)
end

function modifier_trigger_on_move:OnIntervalThink()
    if not IsServer() then return end

    local parent = self:GetParent()
    if not parent or parent:IsNull() or not parent:IsAlive() then return end
    if parent:IsIllusion() then return end

    local current_position = parent:GetAbsOrigin()
    local distance = (current_position - self.last_position):Length2D()

    -- 更新位置
    self.last_position = current_position

    -- 如果移动距离太小,不触发
    if distance < 10 then return end

    -- 计算距离系数: 移动100距离时系数为1.0
    local distance_multiplier = distance / self.base_distance

    -- 触发技能检查
    self:TriggerRandomAbility(distance_multiplier)
end

function modifier_trigger_on_move:TriggerRandomAbility(distance_multiplier)
    local parent = self:GetParent()

    -- 获取基础触发概率
    local passive_level = self:GetAbility():GetLevel()
    if passive_level <= 0 then passive_level = 1 end

    local basic_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("basic_trigger_chance", passive_level - 1)
    local ultimate_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("ultimate_trigger_chance",
        passive_level - 1)

    -- 应用距离系数
    local adjusted_basic_chance = math.min(basic_trigger_chance * distance_multiplier, 100)
    local adjusted_ultimate_chance = math.min(ultimate_trigger_chance * distance_multiplier, 100)

    -- 分别判断终极技能和普通技能的触发
    local trigger_ultimate = RollPseudoRandomPercentage(adjusted_ultimate_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_5,
        parent)
    local trigger_basic = RollPseudoRandomPercentage(adjusted_basic_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_6, parent)

    if not trigger_ultimate and not trigger_basic then
        return
    end

    -- 构建技能列表
    local ultimate_abilities = {}
    local basic_abilities = {}

    for i = 0, parent:GetAbilityCount() - 1 do
        local ability = parent:GetAbilityByIndex(i)
        if ability and ability:GetLevel() > 0
            and not ability:IsPassive()
            and not ability:IsHidden()
            and ability ~= self:GetAbility()
            and not ability:IsItem()
            and not EXCLUDED_ABILITIES_ALLBUTTER[ability:GetAbilityName()] then
            local ability_type = ability:GetAbilityType()
            if ability_type == ABILITY_TYPE_ULTIMATE then
                table.insert(ultimate_abilities, ability)
            else
                table.insert(basic_abilities, ability)
            end
        end
    end

    -- 选择要触发的技能
    local random_ability = nil
    if trigger_ultimate and #ultimate_abilities > 0 then
        random_ability = ultimate_abilities[RandomInt(1, #ultimate_abilities)]
    elseif trigger_basic and #basic_abilities > 0 then
        random_ability = basic_abilities[RandomInt(1, #basic_abilities)]
    end

    if not random_ability then return end

    local ability_name = random_ability:GetAbilityName()
    --print(string.format("[TriggerOnMove Debug] === 开始触发技能: %s ===", ability_name))

    -- 保存冷却和充能状态
    local remaining_cooldown = random_ability:GetCooldownTimeRemaining() or 0
    --print(string.format("[TriggerOnMove Debug] 原始剩余CD: %.2fs", remaining_cooldown))

    -- 【关键修复1】保存当前魔法值
    local current_mana = parent:GetMana()
    local mana_cost = random_ability:GetManaCost(random_ability:GetLevel() - 1)
    --print(string.format("[TriggerOnMove Debug] 当前魔法: %.0f, 技能消耗: %.0f", current_mana, mana_cost))

    -- 【关键修复1】保存原始施法前摇时间
    local original_cast_point = random_ability:GetCastPoint()
    --print(string.format("[TriggerOnMove Debug] 原始施法前摇: %.2fs", original_cast_point))

    local has_charges = random_ability:GetMaxAbilityCharges(random_ability:GetLevel()) > 0
    local current_charges = 0

    if has_charges then
        current_charges = random_ability:GetCurrentAbilityCharges()
        --print(string.format("[TriggerOnMove Debug] 技能有充能, 当前充能数: %d", current_charges))
    else
        --print("[TriggerOnMove Debug] 技能无充能系统")
    end

    -- 临时结束冷却以允许施放
    random_ability:EndCooldown()
    --print("[TriggerOnMove Debug] 已临时结束CD")

    -- 【关键修复2】临时设置施法前摇为0
    random_ability:SetOverrideCastPoint(0)
    --print("[TriggerOnMove Debug] 已设置施法前摇为0")

    -- 【关键修复2】给予足够的魔法以确保施放成功
    if current_mana < mana_cost then
        parent:GiveMana(mana_cost - current_mana)
        --print(string.format("[TriggerOnMove Debug] 魔法不足, 补充了 %.0f 魔法", mana_cost - current_mana))
    end

    -- 施放技能 - 使用与 ability_trigger_on_cast 相同的目标选择逻辑
    local behavior = random_ability:GetBehavior()
    if type(behavior) ~= "number" then
        behavior = tonumber(tostring(behavior))
    end
    local target_team = random_ability:GetAbilityTargetTeam()

    local cast_target = nil
    local target_position = nil

    -- 友方技能 - 对自己释放
    if bit.band(target_team, DOTA_UNIT_TARGET_TEAM_FRIENDLY) ~= 0 then
        cast_target = parent
        target_position = parent:GetAbsOrigin()
        --print("[TriggerOnMove Debug] 友方技能, 对自己释放")
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_ENEMY) ~= 0 then
        local search_radius = 1200
        local enemies = FindUnitsInRadius(
            parent:GetTeamNumber(),
            parent:GetAbsOrigin(),
            nil,
            search_radius,
            DOTA_UNIT_TARGET_TEAM_ENEMY,
            DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
            DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS,
            FIND_CLOSEST,
            false
        )

        if #enemies > 0 then
            cast_target = enemies[1]
            target_position = cast_target:GetAbsOrigin()
            --print(string.format("[TriggerOnMove Debug] 找到敌方目标: %s", cast_target:GetUnitName()))
        elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
            bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
            local cast_range = random_ability:GetCastRange(parent:GetAbsOrigin(), nil)
            if cast_range <= 0 then cast_range = 600 end
            local forward = parent:GetForwardVector()
            target_position = parent:GetAbsOrigin() + forward * cast_range
            --print("[TriggerOnMove Debug] 无敌方目标, 对前方施放")
        else
            --print("[TriggerOnMove Debug] 无有效目标, 跳过并恢复CD")
            random_ability:EndCooldown()
            random_ability:StartCooldown(remaining_cooldown)
            return
        end
    else
        target_position = parent:GetAbsOrigin()
        --print("[TriggerOnMove Debug] 无目标限制技能")
    end

    -- 卡尔天火特殊处理
    if ability_name == "invoker_sun_strike" then
        cast_target = parent
        --print("[TriggerOnMove Debug] 卡尔天火特殊处理")
    end

    -- 根据技能行为类型施放
    local cast_success = false
    if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NO_TARGET) ~= 0 and
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) == 0 and
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) == 0 then
        -- 无目标技能
        --print("[TriggerOnMove Debug] 施放无目标技能")
        -- 使用 CastAbilityImmediately 代替 CastAbilityNoTarget
        cast_success = parent:CastAbilityImmediately(random_ability, parent:GetPlayerOwnerID())
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) ~= 0 then
        if cast_target and not cast_target:IsNull() then
            --print("[TriggerOnMove Debug] 施放单体目标技能")
            parent:SetCursorCastTarget(cast_target)
            cast_success = parent:CastAbilityImmediately(random_ability, parent:GetPlayerOwnerID())
        elseif target_position and bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 then
            --print("[TriggerOnMove Debug] 施放点目标技能(备选)")
            parent:SetCursorPosition(target_position)
            cast_success = parent:CastAbilityImmediately(random_ability, parent:GetPlayerOwnerID())
        end
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
        if target_position then
            --print("[TriggerOnMove Debug] 施放点目标/AOE技能")
            parent:SetCursorPosition(target_position)
            cast_success = parent:CastAbilityImmediately(random_ability, parent:GetPlayerOwnerID())
        else
            --print("[TriggerOnMove Debug] 施放单体目标技能(备选)")
            parent:SetCursorCastTarget(cast_target)
            cast_success = parent:CastAbilityImmediately(random_ability, parent:GetPlayerOwnerID())
        end
    end

    --print(string.format("[TriggerOnMove Debug] 施放结果: %s", tostring(cast_success)))

    -- 施放成功时播放特效
    if cast_success then
        EmitSoundOn("Hero_OgreMagi.Fireblast.x1", parent)
        local particle = ParticleManager:CreateParticle(
            "particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf",
            PATTACH_OVERHEAD_FOLLOW,
            parent
        )
        ParticleManager:SetParticleControl(particle, 1, Vector(1, 1, 1))
        ParticleManager:ReleaseParticleIndex(particle)
    end

    -- 【关键修复5】立即恢复原始魔法值
    local mana_before_restore = parent:GetMana()
    parent:SetMana(current_mana)
    local mana_after_restore = parent:GetMana()
    --print(string.format("[TriggerOnMove Debug] 魔法恢复: 施放后=%.0f, 目标=%.0f, 恢复后=%.0f",
    --    mana_before_restore, current_mana, mana_after_restore))

    -- 【关键修复6】恢复原始施法前摇时间
    random_ability:SetOverrideCastPoint(original_cast_point)
    --print(string.format("[TriggerOnMove Debug] 已恢复施法前摇为: %.2fs", original_cast_point))

    -- 恢复原有冷却状态
    local restore_delay = 0.05

    -- 特殊技能的额外延迟
    if ability_name == "juggernaut_omni_slash" then
        restore_delay = 4.0
        --print("[TriggerOnMove Debug] 剑圣大招特殊延迟: 4.0s")
    end

    --print(string.format("[TriggerOnMove Debug] CD恢复延迟: %.2fs", restore_delay))

    random_ability:SetContextThink("restore_cooldown_" .. random_ability:GetEntityIndex(), function()
        if not random_ability or random_ability:IsNull() then
            --print("[TriggerOnMove Debug] CD恢复失败: 技能对象为空")
            return nil
        end

        --print(string.format("[TriggerOnMove Debug] 开始恢复CD, 技能: %s", ability_name))

        if has_charges then
            if random_ability:IsItem() then
                random_ability:SetCurrentCharges(current_charges)
                --print(string.format("[TriggerOnMove Debug] 恢复物品充能到: %d", current_charges))
            else
                random_ability:SetCurrentAbilityCharges(current_charges)
                --print(string.format("[TriggerOnMove Debug] 恢复技能充能到: %d", current_charges))
            end
        else
            if remaining_cooldown and remaining_cooldown > 0 then
                random_ability:EndCooldown()
                random_ability:StartCooldown(remaining_cooldown)
                local actual_cd = random_ability:GetCooldownTimeRemaining()
                --print(string.format("[TriggerOnMove Debug] 恢复CD: 目标=%.2fs, 实际=%.2fs",
                --    remaining_cooldown, actual_cd))
            else
                random_ability:EndCooldown()
                --print("[TriggerOnMove Debug] CD为0, 直接结束CD")
            end
        end

        --print(string.format("[TriggerOnMove Debug] === 技能 %s 处理完成 ===", ability_name))
        return nil
    end, restore_delay)
end
