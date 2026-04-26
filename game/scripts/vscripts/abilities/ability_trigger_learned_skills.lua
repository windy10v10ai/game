-- 引入共享黑名单
require("abilities/ability_blacklist_butterfly")

ability_trigger_learned_skills = class({})

LinkLuaModifier("modifier_trigger_learned_skills", "abilities/ability_trigger_learned_skills", LUA_MODIFIER_MOTION_NONE)

-- 定义需要排除的技能黑名单
-- 这些技能不会被蝴蝶效应物品触发，避免游戏机制冲突或性能问题
local EXCLUDED_ABILITIES = {

    -- ========================================
    -- 隐身技能
    -- 原因：隐身技能会破坏战斗节奏，且可能导致AI行为异常
    -- ========================================
    ["bounty_hunter_wind_walk"] = true,          -- 赏金猎人 疾风步
    ["invoker_ghost_walk"] = true,               -- 卡尔 幽灵漫步
    --["templar_assassin_meld"] = true,            -- 圣堂刺客 融合（已注释）
    ["weaver_shukuchi"] = true,                  -- 编织者 缩地
    --["sand_king_sand_storm"] = true,             -- 沙王 沙尘暴（已注释）
    ["jack_murderer_of_the_misty_night"] = true, -- Jack 雾夜杀人
    ["jack_presence_concealment"] = true,        -- Jack 气息遮断
}
function ability_trigger_learned_skills:GetIntrinsicModifierName()
    return "modifier_trigger_learned_skills"
end

modifier_trigger_learned_skills = class({})
function modifier_trigger_learned_skills:IsHidden()
    return true
end

function modifier_trigger_learned_skills:IsPermanent()
    return true
end

function modifier_trigger_learned_skills:RemoveOnDeath()
    return false
end

function modifier_trigger_learned_skills:IsPurgable()
    return false
end

function modifier_trigger_learned_skills:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ATTACK_LANDED
    }
end

function modifier_trigger_learned_skills:OnAttackLanded(params)
    if not IsServer() then return end

    local attacker = params.attacker
    local parent = self:GetParent()

    if attacker ~= parent then return end
    if parent:IsIllusion() then return end
    if params.target:IsBuilding() then return end

    -- 过滤由技能触发的攻击
    if params.inflictor and params.inflictor:GetAbilityName() == "puck_dream_coil" then
        -- print("[butter] puck_dream_coil detected")
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

    for i = 0, attacker:GetAbilityCount() - 1 do
        local ability = attacker:GetAbilityByIndex(i)
        if ability and ability:GetLevel() > 0
            and not ability:IsPassive()
            and not ability:IsHidden()
            and ability ~= self:GetAbility()
            and not ability:IsItem()
            and not EXCLUDED_ABILITIES[ability:GetAbilityName()]
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

    -- 优先触发终极技能(如果同时触发)
    if trigger_ultimate and #ultimate_abilities > 0 then
        random_ability = ultimate_abilities[RandomInt(1, #ultimate_abilities)]
    elseif trigger_basic and #basic_abilities > 0 then
        random_ability = basic_abilities[RandomInt(1, #basic_abilities)]
    end

    if not random_ability then return end
    -- 立即获取冷却时间(添加默认值处理)
    local remaining_cooldown = random_ability:GetCooldownTimeRemaining() or 0
    -- 【关键修复1】保存当前魔法值
    local current_mana = attacker:GetMana()
    local mana_cost = random_ability:GetManaCost(random_ability:GetLevel() - 1)
    -- 【关键修复1】保存原始施法前摇时间
    local original_cast_point = random_ability:GetCastPoint()


    -- 保存充能状态
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
        attacker:GiveMana(mana_cost - current_mana)
    end
    --施放技能 - 使用位运算检查行为
    local target = params.target
    local behavior = random_ability:GetBehavior()
    local target_team = random_ability:GetAbilityTargetTeam()

    -- 确定实际施放目标
    local cast_target = target
    local is_valid_target = true

    -- 根据技能目标队伍类型选择目标
    if bit.band(target_team, DOTA_UNIT_TARGET_TEAM_FRIENDLY) ~= 0 then
        -- 友方技能,对自己释放
        cast_target = attacker
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_ENEMY) ~= 0 then
        -- 敌方技能,对攻击目标释放
        cast_target = target
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_BOTH) ~= 0 then
        -- 任意目标技能,对攻击目标释放
        cast_target = target
    end
    -- 卡尔天火特殊处理:强制使用双击版本(施法者位置)
    local ability_name = random_ability:GetAbilityName()
    if ability_name == "invoker_sun_strike" then
        --print("[cast_trigger] 天火")
        cast_target = parent -- 清除单体目标,强制使用点目标模式
    end
    -- 根据技能行为类型施放
    local cast_success = false
    if type(behavior) ~= "number" then
        behavior = tonumber(tostring(behavior))
    end
    if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) ~= 0 then
        -- 单位目标技能
        attacker:SetCursorCastTarget(cast_target)
        cast_success = attacker:CastAbilityImmediately(random_ability, attacker:GetPlayerOwnerID())
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
        -- 点目标或AOE技能,使用目标位置
        attacker:SetCursorPosition(cast_target:GetAbsOrigin())
        cast_success = attacker:CastAbilityImmediately(random_ability, attacker:GetPlayerOwnerID())
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NO_TARGET) ~= 0 then
        -- 无目标技能,直接施放
        cast_success = attacker:CastAbilityImmediately(random_ability, attacker:GetPlayerOwnerID())
    end

    -- 【关键修复5】立即恢复原始魔法值
    attacker:SetMana(current_mana)

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
    EmitSoundOn("Hero_Juggernaut.BladeFury", attacker)
end
