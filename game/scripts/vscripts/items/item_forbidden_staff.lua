item_forbidden_staff = class({})

LinkLuaModifier("modifier_item_forbidden_staff", "items/item_forbidden_staff", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_forbidden_staff_sheep", "items/item_forbidden_staff", LUA_MODIFIER_MOTION_NONE)

function item_forbidden_staff:GetIntrinsicModifierName()
    return "modifier_item_forbidden_staff"
end

function item_forbidden_staff:OnSpellStart()
    local caster = self:GetCaster()
    local radius = self:GetSpecialValueFor("radius")
    local target_point = self:GetCursorPosition() -- 获取目标点位置

    -- 查找范围内的敌人
    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        target_point,
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES, -- ← 包含魔免单位
        FIND_ANY_ORDER,
        false
    )
    -- 添加沉默音效
    EmitSoundOn("Hero_Silencer.Curse.Cast", self:GetParent())

    for _, enemy in pairs(enemies) do
        if not enemy:IsMagicImmune() and not enemy:TriggerSpellAbsorb(self) then
            -- 1. 死灵冲击效果 (包含变形) - 添加这一行!
            self:ApplyNecrolyteEffect(enemy)
            -- 2. 闪电风暴效果
            self:ApplyLightningEffect(enemy)
        end
    end

    -- 范围特效
    local particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_necrolyte/necrolyte_pulse.vpcf",
        PATTACH_WORLDORIGIN,
        nil
    )
    ParticleManager:SetParticleControl(particle, 0, target_point)
    ParticleManager:SetParticleControl(particle, 1, Vector(radius, 0, 0))
    ParticleManager:ReleaseParticleIndex(particle)
end

function item_forbidden_staff:ApplyNecrolyteEffect(target)
    local caster = self:GetCaster()

    -- 使用死灵法杖的伤害计算方式 - 基于全属性
    local blast_att_multiplier = self:GetSpecialValueFor("necrolyte_att_multiplier")

    -- 计算施法者的全属性
    local allAtt = caster:GetStrength() + caster:GetAgility() + caster:GetIntellect(false)
    local damage = allAtt * blast_att_multiplier

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self
    })

    EmitSoundOn("DOTA_Item.Sheepstick.Activate", target)

    -- 添加变形效果
    local duration = self:GetSpecialValueFor("sheep_duration") * (1 - target:GetStatusResistance())
    target:AddNewModifier(caster, self, "modifier_item_forbidden_staff_sheep", { duration = duration })
end

function item_forbidden_staff:ApplyLightningEffect(target)
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

-- 被动modifier
modifier_item_forbidden_staff = class({})

function modifier_item_forbidden_staff:IsHidden() return true end

function modifier_item_forbidden_staff:IsPurgable() return false end

function modifier_item_forbidden_staff:RemoveOnDeath() return false end

function modifier_item_forbidden_staff:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_forbidden_staff:OnCreated()
    self:OnRefresh()
end

function modifier_item_forbidden_staff:OnRefresh()
    self.stats_modifier_name = "modifier_item_forbidden_staff_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_forbidden_staff:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_forbidden_staff:DeclareFunctions()
    return {}
end

-- 死灵冲击变形debuff
modifier_item_forbidden_staff_sheep = class({})

function modifier_item_forbidden_staff_sheep:IsHidden() return false end

function modifier_item_forbidden_staff_sheep:IsDebuff() return true end

function modifier_item_forbidden_staff_sheep:IsPurgable() return true end

function modifier_item_forbidden_staff_sheep:GetTexture()
    return "item_forbidden_staff"
end

function modifier_item_forbidden_staff_sheep:OnCreated()
    if not IsServer() then return end

    -- 随机选择模型(猪或羊)
    local model_list = { "models/props_gameplay/pig.vmdl", "models/props_gameplay/sheep01.vmdl" }
    self.model_file = model_list[RandomInt(1, #model_list)]

    if self:GetAbility() then
        self.sheep_movement_speed = self:GetAbility():GetSpecialValueFor("sheep_movement_speed") or 140
    end
end

function modifier_item_forbidden_staff_sheep:CheckState()
    return {
        [MODIFIER_STATE_SILENCED] = true,
        [MODIFIER_STATE_MUTED] = true,
        [MODIFIER_STATE_DISARMED] = true,
        [MODIFIER_STATE_HEXED] = true,
    }
end

function modifier_item_forbidden_staff_sheep:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BASE_OVERRIDE,
        MODIFIER_PROPERTY_MODEL_CHANGE,
    }
end

function modifier_item_forbidden_staff_sheep:GetModifierMoveSpeedOverride()
    return self.sheep_movement_speed or 140
end

function modifier_item_forbidden_staff_sheep:GetModifierModelChange()
    return self.model_file
end
