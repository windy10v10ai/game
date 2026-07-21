-- ========================================
-- DataDriven modifier_item_magic_crit_blade 的 OnCreated 回调
-- ========================================
function MagicCritBladeOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加原生 Devastator modifier 处理巫师之刃 + 魔蚀
    local devastator_modifier = caster:AddNewModifier(caster, ability, "modifier_item_devastator", {})

    -- 添加 Lua 辅助 modifier 处理动态法术增强
    local passive_modifier = nil
    if not caster:HasModifier("modifier_item_magic_crit_blade_passive") then
        passive_modifier = caster:AddNewModifier(caster, ability, "modifier_item_magic_crit_blade_passive", {})
    end

    -- 将添加的 modifier 保存到 ability 上,以便 OnDestroy 时移除
    if not ability.added_modifiers then
        ability.added_modifiers = {}
    end

    -- 使用 modifier 的 entindex 作为唯一标识
    if devastator_modifier then
        table.insert(ability.added_modifiers, devastator_modifier)
    end
    if passive_modifier then
        table.insert(ability.added_modifiers, passive_modifier)
    end
end

-- ========================================
-- DataDriven modifier_item_magic_crit_blade 的 OnDestroy 回调
-- ========================================
function MagicCritBladeOnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability

    if not ability or not ability.added_modifiers then return end

    -- 移除此物品添加的 modifier
    for _, modifier in pairs(ability.added_modifiers) do
        if modifier and not modifier:IsNull() then
            modifier:Destroy()
        end
    end

    -- 清空记录
    ability.added_modifiers = nil
end

-- ========================================
-- DataDriven modifier_item_magic_crit_blade 的 OnSpellStart 回调
-- ========================================
function MagicCritBladeOnSpellStart(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    local duration = ability:GetSpecialValueFor("active_duration")
    local cooldown = ability:GetSpecialValueFor("active_cooldown")

    -- 添加主动效果 modifier，提供2倍法术增强
    caster:AddNewModifier(caster, ability, "modifier_item_magic_crit_blade_active", { duration = duration })

    -- 播放音效和特效
    EmitSoundOn("Hero_DragonKnight.BreathFire", caster)

    ability:StartCooldown(cooldown * caster:GetCooldownReduction())
end

-- ========================================
-- Lua 辅助 modifier - 处理动态法术增强
-- ========================================
LinkLuaModifier("modifier_item_magic_crit_blade_passive", "items/item_magic_crit_blade.lua", LUA_MODIFIER_MOTION_NONE)

modifier_item_magic_crit_blade_passive = class({})

function modifier_item_magic_crit_blade_passive:IsHidden() return true end

function modifier_item_magic_crit_blade_passive:IsPurgable() return false end

function modifier_item_magic_crit_blade_passive:RemoveOnDeath() return false end

function modifier_item_magic_crit_blade_passive:GetAttributes()
    return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE + MODIFIER_ATTRIBUTE_PERMANENT
end

-- function modifier_item_magic_crit_blade_passive:GetModifierPriority()
--     return MODIFIER_PRIORITY_SUPER_ULTRA
-- end

function modifier_item_magic_crit_blade_passive:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
    }
end

-- ========================================
-- 动态法术增强计算(基于智力)
-- ========================================
function modifier_item_magic_crit_blade_passive:GetModifierSpellAmplify_Percentage()
    local ability = self:GetAbility()
    if not ability or ability:IsNull() then return 0 end

    local spell_amp_per_int = ability:GetSpecialValueFor("spell_amp_per_int")
    local current_int = self:GetParent():GetIntellect(false)
    local base_amp = current_int * spell_amp_per_int

    -- 检测是否开启主动技能，如果开启则为倍率增强
    if self:GetParent():HasModifier("modifier_item_magic_crit_blade_active") then
        local multiplier = ability:GetSpecialValueFor("spell_amp_multiplier")
        return base_amp * multiplier
    end

    return base_amp
end

-- ========================================
-- 龙息爆发 - 法术暴击 被动
-- ========================================
function modifier_item_magic_crit_blade_passive:OnTakeDamage(params)
    if not IsServer() then return end

    local original_damage = params.original_damage

    -- 性能优化 - 伤害过低不处理
    if original_damage < 50 then return end

    local parent = self:GetParent()
    local ability = self:GetAbility()

    if params.attacker ~= parent then return end
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION) == DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION then
        return
    end
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == DOTA_DAMAGE_FLAG_REFLECTION then
        return
    end
    if params.damage_type == DAMAGE_TYPE_PHYSICAL then return end

    local target = params.unit
    if not target or target:IsBuilding() then return end
    if not ability then return end

    -- 内置CD,避免AOE多目标同一瞬间重复触发
    local now = GameRules:GetGameTime()
    if now < (self.last_crit_time or 0) + 0.1 then return end

    local crit_chance = ability:GetSpecialValueFor("spell_crit_chance")
    if RandomFloat(0, 100) > crit_chance then return end

    self.last_crit_time = now

    local multiplier = ability:GetSpecialValueFor("spell_crit_multiplier") / 100
    local extra_damage = original_damage * (multiplier - 1)

    ApplyDamage({
        victim = target,
        attacker = parent,
        damage = extra_damage,
        damage_type = params.damage_type,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION + DOTA_DAMAGE_FLAG_REFLECTION,
        ability = ability,
    })

    SendOverheadEventMessage(nil, OVERHEAD_ALERT_DAMAGE, target, params.damage * multiplier, nil)
end

-- ========================================
-- 主动技能 modifier - 龙息爆发
-- ========================================
LinkLuaModifier("modifier_item_magic_crit_blade_active", "items/item_magic_crit_blade.lua", LUA_MODIFIER_MOTION_NONE)

modifier_item_magic_crit_blade_active = class({})

function modifier_item_magic_crit_blade_active:IsHidden() return false end

function modifier_item_magic_crit_blade_active:IsPurgable() return true end

function modifier_item_magic_crit_blade_active:RemoveOnDeath() return true end

function modifier_item_magic_crit_blade_active:GetTexture()
    return "molongkuangwu"
end
