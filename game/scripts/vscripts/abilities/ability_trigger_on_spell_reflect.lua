-- 引入共享黑名单
require("abilities/ability_blacklist_butterfly")

ability_trigger_on_spell_reflect = class({})

LinkLuaModifier("modifier_trigger_on_spell_reflect", "abilities/ability_trigger_on_spell_reflect",
    LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_trigger_on_spell_reflect_cooldown", "abilities/ability_trigger_on_spell_reflect",
    LUA_MODIFIER_MOTION_NONE)

function ability_trigger_on_spell_reflect:GetIntrinsicModifierName()
    return "modifier_trigger_on_spell_reflect"
end

modifier_trigger_on_spell_reflect = class({})

function modifier_trigger_on_spell_reflect:IsHidden()
    return true
end

function modifier_trigger_on_spell_reflect:IsPermanent()
    return true
end

function modifier_trigger_on_spell_reflect:RemoveOnDeath()
    return false
end

function modifier_trigger_on_spell_reflect:IsPurgable()
    return false
end

function modifier_trigger_on_spell_reflect:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_TAKEDAMAGE
    }
end

function modifier_trigger_on_spell_reflect:OnTakeDamage(params)
    if not IsServer() then return end

    local parent = self:GetParent()
    local attacker = params.attacker

    -- 检查内置冷却
    if parent:HasModifier("modifier_trigger_on_spell_reflect_cooldown") then
        --print("[SpellReflect] On cooldown, skipping")
        return
    end

    -- 确保是自己受到伤害
    if params.unit ~= parent then
        --print("[SpellReflect] Not parent unit, skipping")
        return
    end
    if parent:IsIllusion() then
        --print("[SpellReflect] Is illusion, skipping")
        return
    end

    --print("[SpellReflect] OnTakeDamage triggered for", parent:GetUnitName())

    -- 只处理技能伤害,不处理普通攻击
    if not params.inflictor then
        --print("[SpellReflect] No inflictor (not ability damage), skipping")
        return
    end

    --print("[SpellReflect] Damage from ability:", params.inflictor:GetAbilityName(), "Damage:", params.original_damage)

    -- 关键修改: 检查是否为指向性技能
    local ability = params.inflictor
    local behavior = ability:GetBehavior()

    if ability:IsItem() then
        --print("[SpellReflect] Checking item ability behavior")
        if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) == 0 then
            --print("[SpellReflect] Not unit target item, skipping")
            return
        end
    else
        --print("[SpellReflect] Checking normal ability behavior")
        if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) == 0 then
            --print("[SpellReflect] Not unit target ability, skipping")
            return
        end
    end

    --print("[SpellReflect] Passed unit target check")

    -- 获取触发概率
    local passive_level = self:GetAbility():GetLevel()
    if passive_level <= 0 then passive_level = 1 end

    local reflect_chance = self:GetAbility():GetLevelSpecialValueFor("reflect_chance", passive_level - 1)
    local basic_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("basic_trigger_chance", passive_level - 1)
    local ultimate_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("ultimate_trigger_chance",
        passive_level - 1)

    --print("[SpellReflect] Reflect chance:", reflect_chance, "Basic trigger chance:", basic_trigger_chance,"Ultimate trigger chance:", ultimate_trigger_chance)

    -- 判断是否触发反弹
    local should_reflect = RollPseudoRandomPercentage(reflect_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_7, parent)

    --print("[SpellReflect] Should reflect:", should_reflect)

    if should_reflect then
        -- 反弹伤害
        local reflect_pct = self:GetAbility():GetLevelSpecialValueFor("reflect_damage_pct", passive_level - 1)
        local reflect_damage = params.original_damage * (reflect_pct / 100)

        --print("[SpellReflect] Reflecting", reflect_damage, "damage (", reflect_pct, "% of", params.original_damage, ")")

        ApplyDamage({
            victim = attacker,
            attacker = parent,
            damage = reflect_damage,
            damage_type = params.damage_type,
            damage_flags = DOTA_DAMAGE_FLAG_REFLECTION,
            ability = self:GetAbility(),
        })

        -- 播放反弹特效
        local particle = ParticleManager:CreateParticle(
            "particles/units/heroes/hero_antimage/antimage_spellshield_reflect.vpcf",
            PATTACH_CUSTOMORIGIN,
            nil
        )
        ParticleManager:SetParticleControl(particle, 0, parent:GetAbsOrigin())
        ParticleManager:SetParticleControl(particle, 1, attacker:GetAbsOrigin())
        ParticleManager:ReleaseParticleIndex(particle)

        EmitSoundOn("Hero_Antimage.SpellShield.Reflect", parent)

        -- 分别判断大招和小技能的触发
        local trigger_ultimate = RollPseudoRandomPercentage(ultimate_trigger_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_8,
            parent)
        local trigger_basic = RollPseudoRandomPercentage(basic_trigger_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_9, parent)

        --print("[SpellReflect] Should trigger ultimate:", trigger_ultimate)
        --print("[SpellReflect] Should trigger basic:", trigger_basic)

        -- 如果两者都没触发,不执行技能释放
        if not trigger_ultimate and not trigger_basic then
            --print("[SpellReflect] Neither ultimate nor basic triggered")
            return
        end

        -- 添加内置冷却
        local cooldown_duration = self:GetAbility():GetSpecialValueFor("cooldown_duration")
        --print("[SpellReflect] Adding cooldown:", cooldown_duration, "seconds")

        parent:AddNewModifier(parent, self:GetAbility(), "modifier_trigger_on_spell_reflect_cooldown",
            { duration = cooldown_duration })

        -- 触发随机技能,传递触发类型
        self:TriggerRandomAbility(attacker, trigger_ultimate, trigger_basic)
    end
end

function modifier_trigger_on_spell_reflect:TriggerRandomAbility(original_attacker, trigger_ultimate, trigger_basic)
    local parent = self:GetParent()

    --print("[SpellReflect] TriggerRandomAbility called, trigger_ultimate:", trigger_ultimate, "trigger_basic:",trigger_basic)
    -- 构建技能列表
    local ultimate_abilities = {}
    local basic_abilities = {}

    for i = 0, parent:GetAbilityCount() - 1 do
        local ability = parent:GetAbilityByIndex(i)
        if ability and ability:GetLevel() > 0
            and not ability:IsPassive()
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

    --print("[SpellReflect] Found", #basic_abilities, "basic abilities and", #ultimate_abilities, "ultimate abilities")

    -- 根据触发类型选择技能
    local random_ability = nil
    if trigger_ultimate and #ultimate_abilities > 0 then
        random_ability = ultimate_abilities[RandomInt(1, #ultimate_abilities)]
        --print("[SpellReflect] Selected ultimate ability:", random_ability:GetAbilityName())
    elseif trigger_basic and #basic_abilities > 0 then
        random_ability = basic_abilities[RandomInt(1, #basic_abilities)]
        --print("[SpellReflect] Selected basic ability:", random_ability:GetAbilityName())
    end

    if not random_ability then
        --print("[SpellReflect] No valid ability found for triggered type")
        return
    end

    -- 保存冷却和充能状态
    local remaining_cooldown = random_ability:GetCooldownTimeRemaining() or 0
    local has_charges = random_ability:GetMaxAbilityCharges(random_ability:GetLevel()) > 0
    local current_charges = 0

    if has_charges then
        current_charges = random_ability:GetCurrentAbilityCharges()
        --print("[SpellReflect] Ability has charges:", current_charges)
        --else
        --print("[SpellReflect] Ability cooldown:", remaining_cooldown)
    end

    -- 临时结束冷却
    random_ability:EndCooldown()

    -- 施放技能 - 参照 ability_trigger_on_cast 的目标选择逻辑
    local behavior = random_ability:GetBehavior()
    local target_team = random_ability:GetAbilityTargetTeam()

    local cast_target = nil
    local target_position = nil
    local is_friendly = original_attacker:GetTeamNumber() == parent:GetTeamNumber()

    --print("[SpellReflect] Is friendly:", is_friendly, "Target team:", target_team)

    -- 友方技能 - 对自己释放
    if bit.band(target_team, DOTA_UNIT_TARGET_TEAM_FRIENDLY) ~= 0 then
        cast_target = parent
        target_position = parent:GetAbsOrigin()
        --print("[SpellReflect] Friendly ability, casting on self")
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_ENEMY) ~= 0 then
        if original_attacker and not original_attacker:IsNull() and original_attacker:IsAlive() and not is_friendly then
            cast_target = original_attacker
            target_position = original_attacker:GetAbsOrigin()
            --print("[SpellReflect] Enemy ability, casting on attacker")
        else
            --print("[SpellReflect] Searching for nearby enemies")
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
                --print("[SpellReflect] Found enemy:", cast_target:GetUnitName())
            else
                cast_target = parent
                target_position = parent:GetAbsOrigin()
                --print("[SpellReflect] No enemies found, casting on self position")
            end
        end
    else
        target_position = parent:GetAbsOrigin()
        --print("[SpellReflect] No team restriction, casting on self position")
    end

    -- 根据技能行为类型施放 - 使用 -1 强制施放
    local cast_success = false
    if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NO_TARGET) ~= 0 and
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) == 0 and
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) == 0 then
        --print("[SpellReflect] Casting no-target ability (forced)")
        cast_success = parent:CastAbilityNoTarget(random_ability, -1) -- 使用 -1 强制施放
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) ~= 0 then
        if cast_target and not cast_target:IsNull() then
            --print("[SpellReflect] Casting unit-target ability on", cast_target:GetUnitName(), "(forced)")
            parent:SetCursorCastTarget(cast_target)
            cast_success = parent:CastAbilityImmediately(random_ability, -1) -- 使用 -1 强制施放
        end
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
        if target_position then
            --print("[SpellReflect] Casting point/AOE ability at position (forced)")
            parent:SetCursorPosition(target_position)
            cast_success = parent:CastAbilityImmediately(random_ability, -1) -- 使用 -1 强制施放
        end
    end

    --print("[SpellReflect] Cast success:", cast_success)

    -- 延迟返还魔法
    Timers:CreateTimer(0.1, function()
        if cast_success then
            local mana_cost = random_ability:GetManaCost(random_ability:GetLevel() - 1)
            --print("[SpellReflect] Returning mana:", mana_cost)
            parent:GiveMana(mana_cost)
            EmitSoundOn("Hero_OgreMagi.Fireblast.x1", parent)
            local particle = ParticleManager:CreateParticle(
                "particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf",
                PATTACH_OVERHEAD_FOLLOW,
                parent
            )
            ParticleManager:SetParticleControl(particle, 1, Vector(1, 1, 1))
            ParticleManager:ReleaseParticleIndex(particle)
        end
    end)



    -- 获取技能的抬手时间
    local cast_point = random_ability:GetCastPoint()
    --print(string.format("[Trigger Debug] Ability cast point: %.2fs", cast_point))

    -- 恢复原有冷却状态 - 加入抬手时间
    local restore_delay = cast_point + 0.01

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
end

-- 内置冷却modifier
modifier_trigger_on_spell_reflect_cooldown = class({})

function modifier_trigger_on_spell_reflect_cooldown:IsHidden()
    return true
end

function modifier_trigger_on_spell_reflect_cooldown:IsPurgable()
    return false
end

function modifier_trigger_on_spell_reflect_cooldown:RemoveOnDeath()
    return false
end
