item_forbidden_blade = class({})

LinkLuaModifier("modifier_item_forbidden_blade", "items/item_forbidden_blade", LUA_MODIFIER_MOTION_NONE)

function item_forbidden_blade:GetIntrinsicModifierName()
    return "modifier_item_forbidden_blade"
end

function item_forbidden_blade:OnSpellStart()
    local caster = self:GetCaster()
    local radius = self:GetSpecialValueFor("radius")
    local target_point = self:GetCursorPosition()  -- 获取目标点位置

    -- 查找范围内的敌人
    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        target_point,  -- 使用目标点
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

    -- 范围特效 - 在目标点显示
    local particle = ParticleManager:CreateParticle(
        "particles/econ/items/juggernaut/jugg_arcana/juggernaut_arcana_v2_omni_slash_tgt.vpcf",
        PATTACH_WORLDORIGIN,  -- 改为世界坐标
        nil
    )
    ParticleManager:SetParticleControl(particle, 0, target_point)  -- 使用目标点
    ParticleManager:ReleaseParticleIndex(particle)
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
    target:AddNewModifier(caster, self, "modifier_stunned", {duration = stun_duration})

    -- 纯粹伤害
    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_PURE,
        ability = self
    })

    -- 特效
    local particle = ParticleManager:CreateParticle(
        "particles/econ/items/juggernaut/jugg_arcana/juggernaut_arcana_v2_omni_slash_tgt.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        target
    )
    ParticleManager:ReleaseParticleIndex(particle)
    EmitSoundOn("DOTA_Item.AbyssalBlade.Activate", target)
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

    local particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_zuus/zuus_lightning_bolt.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        target
    )
    ParticleManager:ReleaseParticleIndex(particle)
    EmitSoundOn("Hero_Zuus.LightningBolt", target)
end

function item_forbidden_blade:ApplyBlueFantasyEffect(target)
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("mute_duration") * (1 - target:GetStatusResistance())

    target:Purge(true, false, false, false, false)
    target:AddNewModifier(caster, self, "modifier_item_blue_fantasy_debuff", {duration = duration})

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
    if not self:GetAbility() then return end
    local ability = self:GetAbility()

    -- 继承所有配件属性
    self.bonus_strength = ability:GetSpecialValueFor("bonus_strength")
    self.bonus_agility = ability:GetSpecialValueFor("bonus_agility")
    self.bonus_damage = ability:GetSpecialValueFor("bonus_damage")
    self.bonus_armor = ability:GetSpecialValueFor("bonus_armor")
    self.bonus_attack_speed = ability:GetSpecialValueFor("bonus_attack_speed")
    self.bonus_health = ability:GetSpecialValueFor("bonus_health")
    self.spell_amp = ability:GetSpecialValueFor("spell_amp")
    self.bonus_aoe = ability:GetSpecialValueFor("bonus_aoe")
end

function modifier_item_forbidden_blade:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
        MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_HEALTH_BONUS,
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
    }
end

function modifier_item_forbidden_blade:GetModifierBonusStats_Strength()
    return self.bonus_strength or 0
end

function modifier_item_forbidden_blade:GetModifierBonusStats_Agility()
    return self.bonus_agility or 0
end

function modifier_item_forbidden_blade:GetModifierPreAttack_BonusDamage()
    return self.bonus_damage or 0
end

function modifier_item_forbidden_blade:GetModifierPhysicalArmorBonus()
    return self.bonus_armor or 0
end

function modifier_item_forbidden_blade:GetModifierAttackSpeedBonus_Constant()
    return self.bonus_attack_speed or 0
end

function modifier_item_forbidden_blade:GetModifierHealthBonus()
    return self.bonus_health or 0
end

function modifier_item_forbidden_blade:GetModifierSpellAmplify_Percentage()
    return self.spell_amp or 0
end

function modifier_item_forbidden_blade:GetModifierCastRangeBonusStacking()
    return self.bonus_aoe or 0
end
