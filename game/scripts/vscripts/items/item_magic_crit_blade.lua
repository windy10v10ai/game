item_magic_crit_blade = class({})

function item_magic_crit_blade:GetIntrinsicModifierName()
    return "modifier_item_magic_crit_blade"
end

function item_magic_crit_blade:IsRefreshable()
    return false
end

function item_magic_crit_blade:OnSpellStart()
    local caster = self:GetCaster()
    local modifier = caster:FindModifierByName("modifier_item_magic_crit_blade")

    if not modifier then return end
    if modifier.is_on_cooldown then return end

    local current_mode = modifier:GetStackCount()
    if current_mode == 0 then current_mode = 1 end

    current_mode = current_mode + 1
    if current_mode > 3 then current_mode = 1 end

    modifier:SetStackCount(current_mode)
    self:SetSecondaryCharges(current_mode)
    EmitSoundOn("Item.ToggleOn", caster)
end

function item_magic_crit_blade:GetCooldown(level)
    local modifier = self:GetCaster():FindModifierByName("modifier_item_magic_crit_blade")
    if modifier then
        local mode = modifier:GetStackCount()
        if mode == 0 then mode = 1 end
        return self:GetSpecialValueFor("cooldown_mode" .. mode)
    end
    return 0
end

LinkLuaModifier("modifier_item_magic_crit_blade", "items/item_magic_crit_blade", LUA_MODIFIER_MOTION_NONE)

modifier_item_magic_crit_blade = class({})

function modifier_item_magic_crit_blade:IsHidden()
    return false
end

function modifier_item_magic_crit_blade:IsPurgable()
    return false
end

function modifier_item_magic_crit_blade:RemoveOnDeath()
    return false
end

function modifier_item_magic_crit_blade:GetAttributes()
    return MODIFIER_ATTRIBUTE_MULTIPLE
end

function modifier_item_magic_crit_blade:GetModifierPriority()
    return MODIFIER_PRIORITY_SUPER_ULTRA
end

function modifier_item_magic_crit_blade:OnCreated()
    if IsServer() then
        local ability = self:GetAbility()
        if not ability then return end

        -- 从物品的secondary charges读取保存的模式
        local saved_mode = ability:GetSecondaryCharges()
        if saved_mode > 0 and saved_mode <= 3 then
            self:SetStackCount(saved_mode)
        elseif self:GetStackCount() == 0 then
            self:SetStackCount(1)
        end
        -- 设置SecondaryCharges
        for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
            mod:GetAbility():SetSecondaryCharges(_)
        end
        -- 初始化幻影暴击标记
        self.is_phantom_crit = false

        -- 只在物品有剩余冷却时间时才恢复冷却状态
        local remaining_cooldown = ability:GetCooldownTimeRemaining()
        if remaining_cooldown > 0 then
            self.has_guaranteed_crit = false
            self.is_on_cooldown = true
            self:StartIntervalThink(remaining_cooldown)
        else
            -- 刚购买时,初始化为可用状态
            self.has_guaranteed_crit = true
            self.is_on_cooldown = false
        end
    end

    -- 初始化属性值(客户端和服务端都需要)
    if self:GetAbility() then
        self.spell_amp_per_int = self:GetAbility():GetSpecialValueFor("spell_amp_per_int") or 0.2
        self.spell_lifesteal = self:GetAbility():GetSpecialValueFor("spell_lifesteal") or 50
    else
        -- 默认值
        self.spell_amp_per_int = 0.2
        self.spell_lifesteal = 50
    end
end

function modifier_item_magic_crit_blade:OnDestroy()
    if IsServer() then
    end
end

function modifier_item_magic_crit_blade:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
        MODIFIER_PROPERTY_TOOLTIP,
        MODIFIER_EVENT_ON_ATTACK_LANDED, -- 添加攻击落地事件
    }
end

function modifier_item_magic_crit_blade:OnAttackLanded(params)
    if not IsServer() then return end
    if params.attacker ~= self:GetParent() then return end

    -- 对建筑物无效
    if params.target:IsBuilding() then return end

    -- 幻影暴击概率判定 - 修复:使用正确的函数名
    local phantom_crit_chance = self:GetAbility():GetSpecialValueFor("phantom_crit_chance")
    if not RollPseudoRandomPercentage(phantom_crit_chance, DOTA_PSEUDO_RANDOM_NONE, self) then return end

    -- 造成额外魔法伤害
    local phantom_crit_multiplier = self:GetAbility():GetSpecialValueFor("phantom_crit_multiplier")
    local damage = params.damage * (phantom_crit_multiplier / 100)

    ApplyDamage({
        victim = params.target,
        attacker = params.attacker,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self:GetAbility(),
    })

    -- 播放暴击音效
    EmitSoundOn("Hero_Brewmaster.Brawler.Crit", params.target)
    -- 显示幻影暴击伤害数字(蓝紫色)
    SendOverheadEventMessage(nil, OVERHEAD_ALERT_BONUS_SPELL_DAMAGE, params.target, damage, nil)
end

function modifier_item_magic_crit_blade:GetModifierSpellAmplify_Percentage()
    -- 咖喱棒的固定50%法术增强
    local base_spell_amp = 50

    -- 如果有仙云法杖，不提供智力法术增强（避免叠加）
    if self:GetParent():HasModifier("modifier_item_hallowed_scepter") then
        return base_spell_amp
    end

    -- 仙云法杖的智力法术强化 - 所有模式都生效
    if self:GetAbility() then
        local current_int = self:GetParent():GetIntellect(false)
        local spell_amp_per_int = self.spell_amp_per_int or 0.2
        local int_spell_amp = current_int * spell_amp_per_int
        return base_spell_amp + int_spell_amp
    end

    return base_spell_amp
end

function modifier_item_magic_crit_blade:GetModifierSpellLifestealRegenAmplify_Percentage()
    -- 继承英灵胸针的法术吸血
    return self.spell_lifesteal
end

function modifier_item_magic_crit_blade:OnTooltip()
    return self:GetStackCount()
end

function modifier_item_magic_crit_blade:GetModifierBonusStats_Intellect()
    return self:GetAbility():GetSpecialValueFor("bonus_intellect")
end

function modifier_item_magic_crit_blade:GetModifierPreAttack_BonusDamage()
    -- 继承咖喱棒的600攻击力
    return self:GetAbility():GetSpecialValueFor("bonus_damage")
end

function modifier_item_magic_crit_blade:GetModifierBaseDamageOutgoing_Percentage()
    -- 继承咖喱棒的100%基础伤害加成
    return self:GetAbility():GetSpecialValueFor("bonus_damage_percent")
end

function modifier_item_magic_crit_blade:CheckState()
    return {
        [MODIFIER_STATE_CANNOT_MISS] = true, -- 继承咖喱棒的真实打击
    }
end

function modifier_item_magic_crit_blade:OnTakeDamage(params)
    if not IsServer() then return end

    local parent = self:GetParent()
    local ability = self:GetAbility()

    if params.attacker ~= parent then return end
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION) == DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION then
        return
    end
    if params.damage_type == DAMAGE_TYPE_PHYSICAL then return end

    local target = params.unit
    if not target or target:IsBuilding() then return end

    -- 关键修复: 确保只有第一个modifier实例处理暴击
    local all_modifiers = parent:FindAllModifiersByName("modifier_item_magic_crit_blade")
    if all_modifiers[1] ~= self then return end

    local mode = self:GetStackCount()
    if mode == 0 then mode = 1 end

    local should_crit = false
    local multiplier = 0

    -- 优先检查必然暴击
    if self.has_guaranteed_crit then
        should_crit = true
        multiplier = ability:GetSpecialValueFor("guaranteed_spell_crit_multiplier_mode" .. mode)
        self.triggered_guaranteed_crit = true
        self.triggered_chance_crit = false
    else
        -- 概率暴击判定
        local crit_chance = ability:GetSpecialValueFor("spell_crit_chance_mode" .. mode)
        if RandomFloat(0, 100) <= crit_chance then
            should_crit = true
            multiplier = ability:GetSpecialValueFor("spell_crit_multiplier_mode" .. mode)
            self.triggered_guaranteed_crit = false
            self.triggered_chance_crit = true
        else
            self.triggered_chance_crit = false
        end
    end

    if should_crit then
        local extra_damage = params.original_damage * (multiplier - 1)

        ApplyDamage({
            victim = target,
            attacker = parent,
            damage = extra_damage,
            damage_type = params.damage_type,
            damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
            ability = ability,
        })

        -- 处理必然暴击冷却
        if self.triggered_guaranteed_crit then
            self.has_guaranteed_crit = false
            self.is_on_cooldown = true
            self.triggered_guaranteed_crit = false

            local cooldown = ability:GetSpecialValueFor("cooldown_mode" .. mode)
            ability:StartCooldown(cooldown)
            self:StartIntervalThink(cooldown)
        end

        -- 特效和音效
        local particle = ParticleManager:CreateParticle("particles/units/heroes/hero_zuus/zuus_arc_lightning.vpcf",
            PATTACH_ABSORIGIN_FOLLOW, target)
        ParticleManager:ReleaseParticleIndex(particle)
        EmitSoundOn("Hero_Zuus.ArcLightning.Target", target)

        SendOverheadEventMessage(nil, OVERHEAD_ALERT_BONUS_SPELL_DAMAGE, target, params.original_damage + extra_damage,
            nil)
    end
end

function modifier_item_magic_crit_blade:OnIntervalThink()
    if IsServer() then
        self.has_guaranteed_crit = true
        self.is_on_cooldown = false
        self:StartIntervalThink(-1)
    end
end

function modifier_item_magic_crit_blade:GetTexture()
    local mode = self:GetStackCount()
    if mode == 0 then mode = 1 end

    local textures = {
        [1] = "bloodthorn_ultra",
        [2] = "bloodthorn_ultra",
        [3] = "bloodthorn_ultra"
    }

    return textures[mode]
end
