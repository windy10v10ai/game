LinkLuaModifier("modifier_item_shadow_judgment", "items/item_shadow_judgment", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_shadow_judgment_silence", "items/item_shadow_judgment", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_shadow_judgment_mute", "items/item_shadow_judgment", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_shadow_judgment_corruption", "items/item_shadow_judgment", LUA_MODIFIER_MOTION_NONE)

item_shadow_judgment = class({})

function item_shadow_judgment:GetIntrinsicModifierName()
    return "modifier_item_shadow_judgment"
end

function item_shadow_judgment:OnSpellStart()
    if not IsServer() then return end

    local caster = self:GetCaster()
    local target = self:GetCursorTarget()

    -- 简化目标检查(参考禁忌战刃)
    if not target or target:IsNull() then return end

    -- 检查技能吸收
    if target:TriggerSpellAbsorb(self) then return end

    -- 音效和特效
    EmitSoundOn("Hero_Nevermore.Requiem", target)
    local particle = ParticleManager:CreateParticle(
        "particles/econ/items/shadow_fiend/sf_fire_arcana/sf_fire_arcana_requiem.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        target
    )
    ParticleManager:ReleaseParticleIndex(particle)

    -- 1. 一闪效果 - 眩晕和纯粹伤害
    self:ApplyAbyssalEffect(target)

    -- 2. 苍蓝幻想效果 - 驱散和禁用
    if not target:IsMagicImmune() then
        self:ApplyBlueFantasyEffect(target)
    end

    -- 3. 绝对破防效果 - 降低护甲
    self:ApplyDesolatorEffect(target)

    -- 4. 变态辣效果 - 沉默和伤害放大
    if not target:IsMagicImmune() then
        self:ApplyBloodthornEffect(target)
    end
end

function item_shadow_judgment:ApplyAbyssalEffect(target)
    if not IsServer() then return end

    local caster = self:GetCaster()
    local stun_duration = self:GetSpecialValueFor("stun_duration") * (1 - target:GetStatusResistance())

    -- 使用主属性计算伤害
    local active_damage_base = self:GetSpecialValueFor("active_damage_base")
    local active_damage_multi = self:GetSpecialValueFor("active_damage_multi")

    local primary_stat = 0
    if caster:GetPrimaryAttribute() == DOTA_ATTRIBUTE_STRENGTH then
        primary_stat = caster:GetStrength()
    elseif caster:GetPrimaryAttribute() == DOTA_ATTRIBUTE_AGILITY then
        primary_stat = caster:GetAgility()
    elseif caster:GetPrimaryAttribute() == DOTA_ATTRIBUTE_INTELLECT then
        primary_stat = caster:GetIntellect(false)
    end

    local damage = active_damage_base + primary_stat * active_damage_multi

    -- 瞬移特效 - 起始点
    local blink_start_particle = ParticleManager:CreateParticle(
        "particles/econ/events/ti9/blink_dagger_ti9_start_lvl2.vpcf",
        PATTACH_ABSORIGIN,
        caster
    )
    ParticleManager:ReleaseParticleIndex(blink_start_particle)

    -- 瞬移到目标身后
    FindClearSpaceForUnit(caster, target:GetAbsOrigin() - caster:GetForwardVector() * 56, false)

    -- 瞬移特效 - 结束点
    local blink_end_particle = ParticleManager:CreateParticle(
        "particles/econ/events/ti9/blink_dagger_ti9_lvl2_end.vpcf",
        PATTACH_ABSORIGIN,
        caster
    )
    ParticleManager:ReleaseParticleIndex(blink_end_particle)

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

    -- 攻击目标
    caster:MoveToPositionAggressive(target:GetAbsOrigin())

    EmitSoundOn("DOTA_Item.AbyssalBlade.Activate", target)
end

function item_shadow_judgment:ApplyBlueFantasyEffect(target)
    if not IsServer() then return end

    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("mute_duration") * (1 - target:GetStatusResistance())

    -- 驱散
    target:Purge(true, false, false, false, false)

    -- 添加自定义苍蓝幻想debuff
    target:AddNewModifier(caster, self, "modifier_shadow_judgment_mute", {duration = duration})

    EmitSoundOn("DOTA_Item.Nullifier.Target", target)
end

function item_shadow_judgment:ApplyDesolatorEffect(target)
    if not IsServer() then return end

    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("corruption_duration")

    -- 添加自定义破防debuff
    target:AddNewModifier(caster, self, "modifier_shadow_judgment_corruption", {duration = duration})

    EmitSoundOn("DOTA_Item.Desolator.Target", target)
end

function item_shadow_judgment:ApplyBloodthornEffect(target)
    if not IsServer() then return end

    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("silence_duration") * (1 - target:GetStatusResistance())

    -- 添加沉默debuff
    target:AddNewModifier(caster, self, "modifier_shadow_judgment_silence", {duration = duration})

    EmitSoundOn("DOTA_Item.Bloodthorn.Activate", target)
end

-- 被动modifier(参考禁忌战刃的简洁实现)
modifier_item_shadow_judgment = class({})

function modifier_item_shadow_judgment:IsHidden() return true end
function modifier_item_shadow_judgment:IsPurgable() return false end
function modifier_item_shadow_judgment:RemoveOnDeath() return false end
function modifier_item_shadow_judgment:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_shadow_judgment:OnCreated()
    if not self:GetAbility() then return end
    local ability = self:GetAbility()

    -- 读取所有属性(与禁忌战刃相同方式)
    self.bonus_strength = ability:GetSpecialValueFor("bonus_strength")
    self.bonus_agility = ability:GetSpecialValueFor("bonus_agility")
    self.bonus_intellect = ability:GetSpecialValueFor("bonus_intellect")
    self.bonus_damage = ability:GetSpecialValueFor("bonus_damage")
    self.bonus_armor = ability:GetSpecialValueFor("bonus_armor")
    self.bonus_attack_speed = ability:GetSpecialValueFor("bonus_attack_speed")
    self.bonus_health = ability:GetSpecialValueFor("bonus_health")
    self.bonus_mana_regen = ability:GetSpecialValueFor("bonus_mana_regen")
    self.spell_amp = ability:GetSpecialValueFor("spell_amp")

    -- 被动减甲参数
    self.corruption_armor = ability:GetSpecialValueFor("corruption_armor")
    self.corruption_duration = ability:GetSpecialValueFor("corruption_duration")
end

function modifier_item_shadow_judgment:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
        MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
        MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_HEALTH_BONUS,
        MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_EVENT_ON_ATTACK_LANDED,  -- 被动减甲触发
    }
end

-- 被动减甲效果
function modifier_item_shadow_judgment:OnAttackLanded(params)
    if not IsServer() then return end
    if params.attacker ~= self:GetParent() then return end
    --if params.target:IsBuilding() then return end

    -- 施加减甲debuff
    params.target:AddNewModifier(
        self:GetParent(),
        self:GetAbility(),
        "modifier_shadow_judgment_corruption",
        {duration = self.corruption_duration}
    )
end

function modifier_item_shadow_judgment:GetModifierBonusStats_Strength()
    return self.bonus_strength or 0
end

function modifier_item_shadow_judgment:GetModifierBonusStats_Agility()
    return self.bonus_agility or 0
end

function modifier_item_shadow_judgment:GetModifierBonusStats_Intellect()
    return self.bonus_intellect or 0
end

function modifier_item_shadow_judgment:GetModifierPreAttack_BonusDamage()
    return self.bonus_damage or 0
end

function modifier_item_shadow_judgment:GetModifierPhysicalArmorBonus()
    return self.bonus_armor or 0
end

function modifier_item_shadow_judgment:GetModifierAttackSpeedBonus_Constant()
    return self.bonus_attack_speed or 0
end

function modifier_item_shadow_judgment:GetModifierHealthBonus()
    return self.bonus_health or 0
end

function modifier_item_shadow_judgment:GetModifierConstantManaRegen()
    return self.bonus_mana_regen or 0
end

function modifier_item_shadow_judgment:GetModifierSpellAmplify_Percentage()
    return self.spell_amp or 0
end
modifier_shadow_judgment_mute = class({})

function modifier_shadow_judgment_mute:IsHidden() return false end
function modifier_shadow_judgment_mute:IsDebuff() return true end
function modifier_shadow_judgment_mute:IsPurgable() return false end  -- 注意:苍蓝幻想是false
function modifier_shadow_judgment_mute:IsPurgeException() return false end

function modifier_shadow_judgment_mute:GetTexture()
    return "item_blue_fantasy"
end

-- 这三个函数必须在客户端和服务器端都能执行
function modifier_shadow_judgment_mute:GetEffectAttachType()
    return PATTACH_OVERHEAD_FOLLOW
end

function modifier_shadow_judgment_mute:GetEffectName()
    return "particles/items4_fx/nullifier_mute.vpcf"
end

function modifier_shadow_judgment_mute:GetStatusEffectName()
    return "particles/status_fx/status_effect_nullifier.vpcf"
end

function modifier_shadow_judgment_mute:GetPriority()
    return 20
end

function modifier_shadow_judgment_mute:OnCreated()
    -- 客户端和服务器端都需要读取这些值
    self.slow_pct = self:GetAbility():GetSpecialValueFor("slow_pct")
    self.attack_slow = self:GetAbility():GetSpecialValueFor("attack_slow")
    self.max_hp_dmg_pct = self:GetAbility():GetSpecialValueFor("max_hp_dmg_pct") * 0.01
    self.hp_regen_reduction = self:GetAbility():GetSpecialValueFor("hp_regen_reduction")

    if not IsServer() then return end

    -- 服务器端逻辑
    self.damageTable = {
        attacker = self:GetCaster(),
        victim = self:GetParent(),
        damage_type = DAMAGE_TYPE_PURE,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
        ability = self:GetAbility(),
    }

    self:GetParent():EmitSound("DOTA_Item.Nullifier.Slow")
    local FX = ParticleManager:CreateParticle("particles/items4_fx/nullifier_mute_debuff.vpcf", PATTACH_ROOTBONE_FOLLOW, self:GetParent())
    self:AddParticle(FX, false, false, -1, false, false)

    self:StartIntervalThink(1)
end

function modifier_shadow_judgment_mute:OnIntervalThink()
    if not IsServer() then return end

    self:GetParent():Purge(true, false, false, false, false)
    self.damageTable.damage = self:GetParent():GetMaxHealth() * self.max_hp_dmg_pct
    ApplyDamage(self.damageTable)
end

function modifier_shadow_judgment_mute:CheckState()
    return {
        [MODIFIER_STATE_MUTED] = true,
        [MODIFIER_STATE_PASSIVES_DISABLED] = true,
        [MODIFIER_STATE_EVADE_DISABLED] = true
    }
end

function modifier_shadow_judgment_mute:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_HEAL_AMPLIFY_PERCENTAGE_TARGET,
        MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_LIFESTEAL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE
    }
end

function modifier_shadow_judgment_mute:GetModifierMoveSpeedBonus_Percentage()
    return self.slow_pct
end

function modifier_shadow_judgment_mute:GetModifierAttackSpeedBonus_Constant()
    return self.attack_slow
end

function modifier_shadow_judgment_mute:GetModifierHealAmplify_PercentageTarget()
    return self.hp_regen_reduction
end

function modifier_shadow_judgment_mute:GetModifierHPRegenAmplify_Percentage()
    return self.hp_regen_reduction
end

function modifier_shadow_judgment_mute:GetModifierLifestealRegenAmplify_Percentage()
    return self.hp_regen_reduction
end

function modifier_shadow_judgment_mute:GetModifierSpellLifestealRegenAmplify_Percentage()
    return self.hp_regen_reduction
end
-- 破防debuff
modifier_shadow_judgment_corruption = class({})

function modifier_shadow_judgment_corruption:IsHidden() return false end
function modifier_shadow_judgment_corruption:IsDebuff() return true end
function modifier_shadow_judgment_corruption:IsPurgable() return true end

function modifier_shadow_judgment_corruption:GetTexture()
    return "item_desolator"
end

function modifier_shadow_judgment_corruption:OnCreated()
    if not self:GetAbility() then return end
    self.corruption_armor = self:GetAbility():GetSpecialValueFor("corruption_armor")
end

function modifier_shadow_judgment_corruption:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
    }
end

function modifier_shadow_judgment_corruption:GetModifierPhysicalArmorBonus()
    return self.corruption_armor or -50
end

-- 沉默debuff
modifier_shadow_judgment_silence = class({})

function modifier_shadow_judgment_silence:IsHidden() return false end
function modifier_shadow_judgment_silence:IsDebuff() return true end
function modifier_shadow_judgment_silence:IsPurgable() return true end

function modifier_shadow_judgment_silence:GetTexture()
    return "item_bloodthorn"
end

function modifier_shadow_judgment_silence:OnCreated()
    if not IsServer() then return end
    self.damage_record = 0

    if self:GetAbility() then
        self.silence_damage_percent = self:GetAbility():GetSpecialValueFor("silence_damage_percent")
    else
        self.silence_damage_percent = 30
    end
end

function modifier_shadow_judgment_silence:OnDestroy()
    if not IsServer() then return end

    local ability = self:GetAbility()
    if not ability then return end

    local bonus_damage = self.damage_record * self.silence_damage_percent / 100

    ApplyDamage({
        victim = self:GetParent(),
        attacker = self:GetCaster(),
        damage = bonus_damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = ability
    })

    local particle = ParticleManager:CreateParticle(
        "particles/items4_fx/bloodthorn_pop.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        self:GetParent()
    )
    ParticleManager:ReleaseParticleIndex(particle)

    EmitSoundOn("DOTA_Item.Bloodthorn.Target.Pop", self:GetParent())
end

function modifier_shadow_judgment_silence:CheckState()
    return {
        [MODIFIER_STATE_SILENCED] = true,
    }
end

function modifier_shadow_judgment_silence:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_TAKEDAMAGE,
    }
end

function modifier_shadow_judgment_silence:OnTakeDamage(params)
    if not IsServer() then return end
    if params.unit ~= self:GetParent() then return end

    if params.damage > 0 then
        self.damage_record = self.damage_record + params.damage
    end
end
