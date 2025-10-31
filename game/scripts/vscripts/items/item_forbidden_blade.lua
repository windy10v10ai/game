item_forbidden_blade = class({})

LinkLuaModifier("modifier_item_forbidden_blade", "items/item_forbidden_blade", LUA_MODIFIER_MOTION_NONE)

function item_forbidden_blade:GetIntrinsicModifierName()
    return "modifier_item_forbidden_blade"
end

-- 添加这个函数来显示范围指示器
function item_forbidden_blade:GetAOERadius()
    return self:GetSpecialValueFor("radius")
end

function item_forbidden_blade:OnSpellStart()
    local caster = self:GetCaster()
    local radius = self:GetSpecialValueFor("radius")
    local target_point = self:GetCursorPosition() -- 获取目标点位置

    -- 查找范围内的敌人
    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        target_point, -- 使用目标点
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
        FIND_ANY_ORDER,
        false
    )

    EmitSoundOn("Hero_Juggernaut.OmniSlash.Damage", caster)

    for _, enemy in pairs(enemies) do
        -- 1. 一闪效果 (不瞬移,直接眩晕和伤害)
        self:ApplyAbyssalEffect(enemy)

        -- 2. 闪电风暴效果
        self:ApplyLightningEffect(enemy)

        -- 3. 苍蓝幻想毁灭终曲效果
        if not enemy:IsMagicImmune() and not enemy:TriggerSpellAbsorb(self) then
            self:ApplyBlueFantasyEffect(enemy)
        end
    end
    local effect_radius = radius + 200
    -- 肉山重击特效
    local particle = ParticleManager:CreateParticle(
        "particles/neutral_fx/roshan_slam.vpcf",
        PATTACH_WORLDORIGIN,
        nil
    )
    ParticleManager:SetParticleControl(particle, 0, target_point)
    ParticleManager:SetParticleControl(particle, 1, Vector(effect_radius, effect_radius, effect_radius))
    ParticleManager:ReleaseParticleIndex(particle)

    EmitSoundOn("DOTA_Item.MeteorHammer.Cast", caster)
end

function item_forbidden_blade:ApplyAbyssalEffect(target)
    local caster = self:GetCaster()
    local stun_duration = self:GetSpecialValueFor("stun_duration") * (1 - target:GetStatusResistance())

    -- 使用主属性计算伤害
    local active_damage_base = self:GetSpecialValueFor("active_damage_base")
    local active_damage_multi = self:GetSpecialValueFor("active_damage_multi")

    -- 获取主属性值
    local primary_stat = 0
    if caster:GetPrimaryAttribute() == DOTA_ATTRIBUTE_STRENGTH then
        primary_stat = caster:GetStrength()
    elseif caster:GetPrimaryAttribute() == DOTA_ATTRIBUTE_AGILITY then
        primary_stat = caster:GetAgility()
    elseif caster:GetPrimaryAttribute() == DOTA_ATTRIBUTE_INTELLECT then
        primary_stat = caster:GetIntellect(false)
    end

    local damage = active_damage_base + primary_stat * active_damage_multi

    -- 眩晕
    target:AddNewModifier(caster, self, "modifier_stunned", { duration = stun_duration })

    -- 纯粹伤害
    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_PURE,
        ability = self
    })
end

function item_forbidden_blade:ApplyLightningEffect(target)
    local caster = self:GetCaster()
    local damage = self:GetSpecialValueFor("lightning_damage")

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self
    })

    EmitSoundOn("Hero_Zuus.LightningBolt", target)
end

function item_forbidden_blade:ApplyBlueFantasyEffect(target)
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("mute_duration") * (1 - target:GetStatusResistance())

    target:Purge(true, false, false, false, false)
    target:AddNewModifier(caster, self, "modifier_item_blue_fantasy_debuff", { duration = duration })

    EmitSoundOn("DOTA_Item.Nullifier.Target", target)
end

-- 被动modifier
modifier_item_forbidden_blade = class({})

function modifier_item_forbidden_blade:IsHidden() return true end

function modifier_item_forbidden_blade:IsPurgable() return false end

function modifier_item_forbidden_blade:RemoveOnDeath() return false end

function modifier_item_forbidden_blade:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_forbidden_blade:OnCreated()
    self:OnRefresh()
end

function modifier_item_forbidden_blade:OnRefresh()
    self.stats_modifier_name = "modifier_item_forbidden_blade_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_forbidden_blade:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_forbidden_blade:DeclareFunctions()
    return {}
end
