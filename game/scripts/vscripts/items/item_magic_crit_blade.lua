item_magic_crit_blade = class({})

function item_magic_crit_blade:GetIntrinsicModifierName()
    return "modifier_item_magic_crit_blade"
end

function item_magic_crit_blade:IsRefreshable()
    return false
end

function item_magic_crit_blade:OnSpellStart()
    local caster = self:GetCaster()

    -- 【修复】找到第一个modifier实例来切换模式
    local all_modifiers = caster:FindAllModifiersByName("modifier_item_magic_crit_blade")
    if not all_modifiers or #all_modifiers == 0 then return end

    local first_modifier = all_modifiers[1]
    if first_modifier.is_on_cooldown then return end

    local current_mode = first_modifier:GetStackCount()
    if current_mode == 0 then current_mode = 1 end

    current_mode = current_mode + 1
    if current_mode > 3 then current_mode = 1 end

    -- 【修复】将模式同步到所有modifier实例
    for _, mod in pairs(all_modifiers) do
        mod:SetStackCount(current_mode)
    end

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
    self:OnRefresh()

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
        self.spell_amp_per_int = self:GetAbility():GetSpecialValueFor("spell_amp_per_int") or 0.3
        self.spell_lifesteal = self:GetAbility():GetSpecialValueFor("spell_lifesteal") or 30
    else
        -- 默认值
        self.spell_amp_per_int = 0.3
        self.spell_lifesteal = 30
    end
end

function modifier_item_magic_crit_blade:OnRefresh()
    self.stats_modifier_name = "modifier_item_magic_crit_blade_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_magic_crit_blade:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_magic_crit_blade:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
        MODIFIER_PROPERTY_TOOLTIP,
        MODIFIER_EVENT_ON_ATTACK_LANDED,
    }
end

function modifier_item_magic_crit_blade:OnAttackLanded(params)
    if not IsServer() then return end
    if params.attacker ~= self:GetParent() then return end

    -- 对建筑物无效
    if params.target:IsBuilding() then return end
    -- 【修复】使用SecondaryCharges判断
    if not self:GetAbility() or self:GetAbility():GetSecondaryCharges() ~= 1 then return end

    -- 幻影暴击概率判定
    local phantom_crit_chance = self:GetAbility():GetSpecialValueFor("phantom_crit_chance")
    if not RollPseudoRandomPercentage(phantom_crit_chance, DOTA_PSEUDO_RANDOM_NONE, self) then return end
    -- 基于攻击力计算额外伤害
    local base_damage = params.attacker:GetAverageTrueAttackDamage(params.attacker)
    --local bonus_damage = base_damage * (self.crit_multiplier - 1)
    -- 造成额外魔法伤害
    local phantom_crit_multiplier = self:GetAbility():GetSpecialValueFor("phantom_crit_multiplier")
    local damage = base_damage * (phantom_crit_multiplier / 100)

    -- 【新增】调试输出 - 幻影暴击
    -- print(string.format("[MagicCritBlade] 幻影暴击触发! 原始攻击伤害: %.0f, 暴击倍率: %.0f%%, 额外魔法伤害: %.0f",
    --     params.damage, phantom_crit_multiplier, damage))
    -- 【修改】不添加NO_SPELL_AMPLIFICATION标记,但标记为幻影暴击伤害
    self.is_phantom_crit_damage = true -- 设置标记
    ApplyDamage({
        victim = params.target,
        attacker = params.attacker,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self:GetAbility(),
    })
    -- 在下一帧清除标记
    Timers:CreateTimer(FrameTime(), function()
        self.is_phantom_crit_damage = false
    end)
    -- 播放暴击音效
    EmitSoundOn("Hero_Brewmaster.Brawler.Crit", params.target)
    -- 显示幻影暴击伤害数字(蓝紫色)
    local total_spell_amp = self:GetParent():GetSpellAmplification(false)
    SendOverheadEventMessage(nil, OVERHEAD_ALERT_BONUS_SPELL_DAMAGE, params.target, damage * (total_spell_amp + 1), nil)
end

function modifier_item_magic_crit_blade:GetModifierSpellAmplify_Percentage()
    -- 【推荐方案】使用SecondaryCharges判断,避免FindAllModifiersByName
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        local ability = self:GetAbility()
        if not ability or ability:IsNull() then return 0 end

        local spell_amp_per_int = ability:GetSpecialValueFor("spell_amp_per_int")
        local current_int = self:GetParent():GetIntellect(false)
        return current_int * spell_amp_per_int
    end
    return 0
end

function modifier_item_magic_crit_blade:GetModifierSpellLifestealRegenAmplify_Percentage()
    -- 【修复】使用SecondaryCharges判断,与智力法强保持一致
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        local ability = self:GetAbility()
        if not ability or ability:IsNull() then return 0 end

        local spell_lifesteal = ability:GetSpecialValueFor("spell_lifesteal")
        return spell_lifesteal
    end
    return 0
end

function modifier_item_magic_crit_blade:OnTooltip()
    return self:GetStackCount()
end

function modifier_item_magic_crit_blade:OnTakeDamage(params)
    if not IsServer() then return end

    -- 伤害小于10不不处理，优化性能
    if params.damage < 10 then return end

    local parent = self:GetParent()
    local ability = self:GetAbility()

    if params.attacker ~= parent then return end
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION) == DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION then
        return
    end
    -- 【关键修复】检查反射伤害标志,防止无限循环
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == DOTA_DAMAGE_FLAG_REFLECTION then
        return
    end
    if params.damage_type == DAMAGE_TYPE_PHYSICAL then return end

    -- 【新增】跳过幻影暴击造成的伤害,防止无限循环
    if self.is_phantom_crit_damage then return end
    local target = params.unit
    if not target or target:IsBuilding() then return end

    -- 【修复】使用SecondaryCharges判断
    if not ability or ability:GetSecondaryCharges() ~= 1 then return end

    local mode = self:GetStackCount()
    if mode == 0 then mode = 1 end

    -- 【新增】调试输出 - 基础信息
    -- print(string.format("[MagicCritBlade] 检测到法术伤害: %.0f (模式%d), 目标: %s",
    --     params.original_damage, mode, target:GetUnitName()))

    local should_crit = false
    local multiplier = 0
    local crit_type = ""

    -- 优先检查必然暴击
    if self.has_guaranteed_crit then
        should_crit = true
        multiplier = ability:GetSpecialValueFor("guaranteed_spell_crit_multiplier_mode" .. mode)
        self.triggered_guaranteed_crit = true
        self.triggered_chance_crit = false
        crit_type = "必然暴击"

        -- 【新增】调试输出 - 必然暴击触发
        --print(string.format("[MagicCritBlade] 必然暴击触发! 倍率: %.1fx", multiplier))
    else
        -- 概率暴击判定
        local crit_chance = ability:GetSpecialValueFor("spell_crit_chance_mode" .. mode)
        local roll = RandomFloat(0, 100)

        -- 【新增】调试输出 - 概率判定
        --print(string.format("[MagicCritBlade] 概率暴击判定: %.1f%% vs %.1f%%", roll, crit_chance))

        if roll <= crit_chance then
            should_crit = true
            multiplier = ability:GetSpecialValueFor("spell_crit_multiplier_mode" .. mode)
            self.triggered_guaranteed_crit = false
            self.triggered_chance_crit = true
            crit_type = "概率暴击"

            -- 【新增】调试输出 - 概率暴击触发
            --print(string.format("[MagicCritBlade] 概率暴击触发! 倍率: %.1fx", multiplier))
        else
            self.triggered_chance_crit = false

            -- 【新增】调试输出 - 未触发暴击
            --print("[MagicCritBlade] 未触发暴击")
        end
    end

    if should_crit then
        local extra_damage = params.original_damage * (multiplier - 1)
        local total_damage = params.original_damage + extra_damage

        -- 【新增】调试输出 - 暴击伤害详情
        --print(string.format("[MagicCritBlade] %s - 原始伤害: %.0f, 暴击倍率: %.1fx, 额外伤害: %.0f, 总伤害: %.0f",
        --    crit_type, params.original_damage, multiplier, extra_damage, total_damage))

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
            self.triggered_guaranteed_crit = false

            local cooldown = ability:GetSpecialValueFor("cooldown_mode" .. mode)
            ability:StartCooldown(cooldown)
            self:StartIntervalThink(cooldown)

            -- 【新增】调试输出 - 冷却开始
            --print(string.format("[MagicCritBlade] 必然暴击进入冷却: %.0f秒", cooldown))
        end
        -- 使用CRITICAL伤害类型显示更大的数字
        SendOverheadEventMessage(nil, OVERHEAD_ALERT_BONUS_SPELL_DAMAGE, target, extra_damage, nil)

        -- 【修改】更改音效为更震撼的暴击音效
        EmitSoundOn("Hero_PhantomAssassin.CoupDeGrace", target) -- PA大招音效
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
    return "molongkuangwu"
end
