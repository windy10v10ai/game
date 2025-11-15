-- ========================================
-- DataDriven modifier_item_magic_crit_blade 的 OnCreated 回调
-- ========================================
function MagicCritBladeOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加 Lua 辅助 modifier 处理特殊功能
    caster:AddNewModifier(caster, ability, "modifier_item_magic_crit_blade_passive", {})
end

-- ========================================
-- DataDriven modifier_item_magic_crit_blade 的 OnDestroy 回调
-- ========================================
function MagicCritBladeOnDestroy(keys)
    if not IsServer() then return end

    local caster = keys.caster

    if not caster then return end

    -- 移除 Lua 辅助 modifier
    caster:RemoveModifierByName("modifier_item_magic_crit_blade_passive")
end

-- ========================================
-- Lua 辅助 modifier - 处理动态法术增强和暴击
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
    self.is_phantom_crit_damage = false
end

function modifier_item_magic_crit_blade_passive:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
        MODIFIER_EVENT_ON_ATTACK_LANDED,
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
-- 幻影暴击 - 物理攻击触发魔法伤害
-- ========================================
function modifier_item_magic_crit_blade_passive:OnAttackLanded(params)
    if not IsServer() then return end
    if params.attacker ~= self:GetParent() then return end
    if params.target:IsBuilding() then return end

    local ability = self:GetAbility()
    if not ability then return end

    local phantom_crit_chance = ability:GetSpecialValueFor("phantom_crit_chance")
    if not RollPseudoRandomPercentage(phantom_crit_chance, DOTA_PSEUDO_RANDOM_NONE, self) then return end

    local base_damage = params.attacker:GetAverageTrueAttackDamage(params.attacker)
    local phantom_crit_multiplier = ability:GetSpecialValueFor("phantom_crit_multiplier")
    local damage = base_damage * (phantom_crit_multiplier / 100)

    -- 标记为幻影暴击伤害,防止触发法术暴击
    self.is_phantom_crit_damage = true
    ApplyDamage({
        victim = params.target,
        attacker = params.attacker,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = ability,
    })

    -- 下一帧清除标记
    Timers:CreateTimer(FrameTime(), function()
        self.is_phantom_crit_damage = false
    end)

    -- 播放暴击音效和伤害数字
    EmitSoundOn("Hero_Brewmaster.Brawler.Crit", params.target)
    local total_spell_amp = self:GetParent():GetSpellAmplification(false)
    SendOverheadEventMessage(nil, OVERHEAD_ALERT_BONUS_SPELL_DAMAGE, params.target, damage * (total_spell_amp + 1), nil)
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

    -- 跳过幻影暴击造成的伤害
    if self.is_phantom_crit_damage then return end

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
