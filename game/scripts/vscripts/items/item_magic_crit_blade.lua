-- ========================================
-- DataDriven modifier_item_magic_crit_blade 的 OnCreated 回调
-- ========================================
function MagicCritBladeOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加原生 Revenants Brooch modifier 处理幻影暴击
    local brooch_modifier = caster:AddNewModifier(caster, ability, "modifier_item_revenants_brooch", {})

    -- 添加 Lua 辅助 modifier 处理动态法术增强和龙息爆发
    local passive_modifier = caster:AddNewModifier(caster, ability, "modifier_item_magic_crit_blade_passive", {})

    -- 将添加的 modifier 保存到 ability 上,以便 OnDestroy 时移除
    if not ability.added_modifiers then
        ability.added_modifiers = {}
    end

    -- 使用 modifier 的 entindex 作为唯一标识
    if brooch_modifier then
        table.insert(ability.added_modifiers, brooch_modifier)
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
-- Lua 辅助 modifier - 处理动态法术增强和龙息爆发
-- ========================================
LinkLuaModifier("modifier_item_magic_crit_blade_passive", "items/item_magic_crit_blade.lua", LUA_MODIFIER_MOTION_NONE)

modifier_item_magic_crit_blade_passive = class({})

function modifier_item_magic_crit_blade_passive:IsHidden() return true end
function modifier_item_magic_crit_blade_passive:IsPurgable() return false end
function modifier_item_magic_crit_blade_passive:RemoveOnDeath() return false end

function modifier_item_magic_crit_blade_passive:GetAttributes()
    return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_magic_crit_blade_passive:GetModifierPriority()
    return MODIFIER_PRIORITY_SUPER_ULTRA
end

function modifier_item_magic_crit_blade_passive:OnCreated()
    if not IsServer() then return end

    local ability = self:GetAbility()
    if not ability then return end

    -- 初始化必然暴击状态
    self.has_guaranteed_crit = true
    self.is_on_cooldown = false
end

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
    return current_int * spell_amp_per_int
end

-- ========================================
-- 龙息爆发 - 法术暴击
-- ========================================
function modifier_item_magic_crit_blade_passive:OnTakeDamage(params)
    if not IsServer() then return end

    -- 性能优化 - 伤害小于10不处理
    if params.damage < 10 then return end

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

    local should_crit = false
    local multiplier = 0

    -- 优先检查必然暴击
    if self.has_guaranteed_crit then
        should_crit = true
        multiplier = ability:GetSpecialValueFor("guaranteed_spell_crit_multiplier")
        self.triggered_guaranteed_crit = true
    else
        -- 概率暴击判定
        local crit_chance = ability:GetSpecialValueFor("spell_crit_chance")
        if RandomFloat(0, 100) <= crit_chance then
            should_crit = true
            multiplier = ability:GetSpecialValueFor("spell_crit_multiplier")
            self.triggered_guaranteed_crit = false
        end
    end

    if should_crit then
        local extra_damage = params.damage * (multiplier - 1)

        ApplyDamage({
            victim = target,
            attacker = parent,
            damage = extra_damage,
            damage_type = params.damage_type,
            damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION + DOTA_DAMAGE_FLAG_REFLECTION,
            ability = ability,
        })

        -- 处理必然暴击冷却
        if self.triggered_guaranteed_crit then
            self.has_guaranteed_crit = false
            self.is_on_cooldown = true

            local cooldown = ability:GetSpecialValueFor("spell_crit_cooldown")
            self:StartIntervalThink(cooldown)
        end

        -- 显示暴击伤害
        SendOverheadEventMessage(nil, OVERHEAD_ALERT_BONUS_SPELL_DAMAGE, target, extra_damage, nil)
        EmitSoundOn("Hero_PhantomAssassin.CoupDeGrace", target)
    end
end

-- ========================================
-- 冷却恢复
-- ========================================
function modifier_item_magic_crit_blade_passive:OnIntervalThink()
    if IsServer() then
        self.has_guaranteed_crit = true
        self.is_on_cooldown = false
        self:StartIntervalThink(-1)
    end
end
