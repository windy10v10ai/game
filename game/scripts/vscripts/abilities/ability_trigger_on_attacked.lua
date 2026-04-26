-- 引入共享黑名单
require("abilities/ability_blacklist_butterfly")

ability_trigger_on_attacked = class({})

LinkLuaModifier("modifier_trigger_on_attacked", "abilities/ability_trigger_on_attacked",
    LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_trigger_on_attacked_cooldown",
    "abilities/ability_trigger_on_attacked", LUA_MODIFIER_MOTION_NONE)

function ability_trigger_on_attacked:GetIntrinsicModifierName()
    return "modifier_trigger_on_attacked"
end

modifier_trigger_on_attacked = class({})

function modifier_trigger_on_attacked:IsHidden()
    return true
end

function modifier_trigger_on_attacked:IsPermanent()
    return true
end

function modifier_trigger_on_attacked:RemoveOnDeath()
    return false
end

function modifier_trigger_on_attacked:IsPurgable()
    return false
end

function modifier_trigger_on_attacked:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ATTACKED -- 关键修改:监听被攻击事件
    }
end

function modifier_trigger_on_attacked:OnAttacked(params)
    if not IsServer() then return end

    local attacker = params.attacker
    local parent = self:GetParent() -- 被攻击者

    -- 确保是自己被攻击
    if params.target ~= parent then return end
    if parent:IsIllusion() then return end
    if attacker:IsBuilding() then return end

    -- 检查内置冷却(0.1秒)
    if parent:HasModifier("modifier_trigger_on_attacked_cooldown") then
        return
    end

    -- 获取触发概率
    local passive_level = self:GetAbility():GetLevel()
    if passive_level <= 0 then passive_level = 1 end

    local basic_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("basic_trigger_chance", passive_level - 1)
    local ultimate_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("ultimate_trigger_chance",
        passive_level - 1)

    -- 分别判断终极技能和普通技能的触发
    local trigger_ultimate = RollPseudoRandomPercentage(ultimate_trigger_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_1, parent)
    local trigger_basic = RollPseudoRandomPercentage(basic_trigger_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_2, parent)

    if not trigger_ultimate and not trigger_basic then
        return
    end

    -- 构建技能列表(按类型分类)
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
            if ability_type == 1 then
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

    -- 立即获取冷却时间(添加默认值处理)
    local remaining_cooldown = random_ability:GetCooldownTimeRemaining() or 0
    -- 【关键修复1】保存当前魔法值
    local current_mana = parent:GetMana()
    local mana_cost = random_ability:GetManaCost(random_ability:GetLevel() - 1)
    -- 【关键修复1】保存原始施法前摇时间
    local original_cast_point = random_ability:GetCastPoint()
    local has_charges = random_ability:GetMaxAbilityCharges(random_ability:GetLevel()) > 0
    local current_charges = 0

    if has_charges then
        current_charges = random_ability:GetCurrentAbilityCharges()
    end

    -- 临时结束冷却以允许施放
    random_ability:EndCooldown()
    -- 【关键修复2】临时设置施法前摇为0
    random_ability:SetOverrideCastPoint(0)
    -- 【关键修复2】给予足够的魔法以确保施放成功
    if current_mana < mana_cost then
        parent:GiveMana(mana_cost - current_mana)
    end
    -- 施放技能
    local target = attacker -- 对攻击者释放技能
    local behavior = random_ability:GetBehavior()
    if type(behavior) ~= "number" then
        behavior = tonumber(tostring(behavior))
    end
    local target_team = random_ability:GetAbilityTargetTeam()

    local cast_target = target

    -- 根据技能目标队伍类型选择目标
    if bit.band(target_team, DOTA_UNIT_TARGET_TEAM_FRIENDLY) ~= 0 then
        cast_target = parent   -- 友方技能对自己释放
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_ENEMY) ~= 0 then
        cast_target = attacker -- 敌方技能对攻击者释放
    end
    -- 卡尔天火特殊处理:强制使用双击版本(施法者位置)
    local ability_name = random_ability:GetAbilityName()
    if ability_name == "invoker_sun_strike" then
        --print("[cast_trigger] 天火")
        cast_target = parent -- 清除单体目标,强制使用点目标模式
    end
    -- 根据技能行为类型施放
    local cast_success = false
    if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) ~= 0 then
        parent:SetCursorCastTarget(cast_target)
        cast_success = parent:CastAbilityImmediately(random_ability, parent:GetPlayerOwnerID())
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
        parent:SetCursorPosition(cast_target:GetAbsOrigin())
        cast_success = parent:CastAbilityImmediately(random_ability, parent:GetPlayerOwnerID())
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NO_TARGET) ~= 0 then
        cast_success = parent:CastAbilityImmediately(random_ability, parent:GetPlayerOwnerID())
    end

    -- 施放成功时返还魔法并添加内置冷却
    if cast_success then
        --print("GiveMana", random_ability:GetManaCost(random_ability:GetLevel() - 1))
        --parent:GiveMana(random_ability:GetManaCost(random_ability:GetLevel() - 1))
        local cooldown_duration = self:GetAbility():GetSpecialValueFor("cooldown_duration")
        parent:AddNewModifier(parent, self:GetAbility(), "modifier_trigger_on_attacked_cooldown",
            { duration = cooldown_duration })
    end

    -- 【关键修复5】立即恢复原始魔法值
    parent:SetMana(current_mana)

    -- 【关键修复6】恢复原始施法前摇时间
    random_ability:SetOverrideCastPoint(original_cast_point)

    -- 恢复原有冷却状态 - 加入抬手时间
    local restore_delay = FrameTime()

    -- 特殊技能的额外延迟
    if ability_name == "juggernaut_omni_slash" then
        restore_delay = 4.0
        --print("[Trigger Debug] Special delay for juggernaut_omni_slash: 4.0s")
    end

    --print(string.format("[Trigger Debug] CD restore delay: %.2fs (cast_point=%.2fs + 0.1s buffer)",restore_delay, cast_point))

    random_ability:SetContextThink("restore_cooldown_" .. random_ability:GetEntityIndex(), function()
        if not random_ability or random_ability:IsNull() then
            --print("[Trigger Debug] Ability is null, cannot restore CD")
            return nil
        end

        if has_charges then
            if random_ability:IsItem() then
                random_ability:SetCurrentCharges(current_charges)
            else
                random_ability:SetCurrentAbilityCharges(current_charges)
            end
            --print(string.format("[Trigger Debug] Restored charges to %d", current_charges))
        else
            if remaining_cooldown and remaining_cooldown > 0 then
                random_ability:EndCooldown()                     -- 先结束
                random_ability:StartCooldown(remaining_cooldown) -- 再用剩余时间开始
                --print(string.format("[Trigger Debug] Restored cooldown: %.2fs", remaining_cooldown))
            else
                random_ability:EndCooldown()
                --print("[Trigger Debug] Ended cooldown (was 0)")
            end
        end

        return nil
    end, restore_delay)

    -- 特效
    EmitSoundOn("Hero_Juggernaut.BladeFury", parent)
end

-- 内置冷却modifier
modifier_trigger_on_attacked_cooldown = class({})

function modifier_trigger_on_attacked_cooldown:IsHidden()
    return true
end

function modifier_trigger_on_attacked_cooldown:IsPurgable()
    return false
end

function modifier_trigger_on_attacked_cooldown:RemoveOnDeath()
    return false
end
