-- game/scripts/vscripts/items/item_beast_shield.lua
if item_beast_shield == nil then item_beast_shield = class({}) end

LinkLuaModifier("modifier_item_beast_shield", "items/item_beast_shield.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_beast_shield_active", "items/item_beast_shield.lua", LUA_MODIFIER_MOTION_NONE)

function item_beast_shield:GetIntrinsicModifierName()
    return "modifier_item_beast_shield"
end

function item_beast_shield:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("active_duration")

    EmitSoundOn("DOTA_Item.BladeMail.Activate", caster)
    caster:AddNewModifier(caster, self, "modifier_item_beast_shield_active", { duration = duration })
end

-- 被动modifier
modifier_item_beast_shield = class({})

function modifier_item_beast_shield:IsHidden() return true end
function modifier_item_beast_shield:IsPurgable() return false end
function modifier_item_beast_shield:RemoveOnDeath() return false end

function modifier_item_beast_shield:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_beast_shield:OnCreated()
    if not IsServer() then return end
    if not self:GetAbility() then self:Destroy() return end

    -- 设置叠加计数
    for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
        mod:GetAbility():SetSecondaryCharges(_)
    end
end

function modifier_item_beast_shield:OnDestroy()
    if not IsServer() then return end

    for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
        mod:GetAbility():SetSecondaryCharges(_)
    end
end

-- 在modifier_item_beast_shield的DeclareFunctions中添加
function modifier_item_beast_shield:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
        MODIFIER_PROPERTY_HEALTH_BONUS,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
        MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_EVENT_ON_TAKEDAMAGE,  -- 新增：监听受到伤害事件
    }
end

-- 在modifier_item_beast_shield中添加OnCreated
function modifier_item_beast_shield:OnCreated()
    if not IsServer() then return end
    if not self:GetAbility() then self:Destroy() return end

    -- 设置叠加计数
    for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
        mod:GetAbility():SetSecondaryCharges(_)
    end

    -- 法师泳衣被动参数
    self.mana_restore_pct = 25  -- 受到魔法伤害转化为魔法的百分比
    self.stack_threshold = 100  -- 每受到100点技能伤害获得一层
    self.stack_duration = 10    -- 叠加效果持续10秒
    self.max_stacks = 10        -- 最多10层
    self.stack_resist = 3       -- 每层增加3%魔抗

    self.damage_taken = 0       -- 累计受到的技能伤害
end

-- 新增：处理受到伤害事件
function modifier_item_beast_shield:OnTakeDamage(params)
    if not IsServer() then return end
    if params.unit ~= self:GetParent() then return end
    if params.attacker == self:GetParent() then return end

    -- 只处理魔法伤害
    if params.damage_type ~= DAMAGE_TYPE_MAGICAL then return end

    -- 被动：游泳 - 受到魔法伤害回复魔法
    local mana_restore = params.original_damage * self.mana_restore_pct / 100
    self:GetParent():GiveMana(mana_restore)

    -- 显示魔法恢复特效
    local particle = ParticleManager:CreateParticle("particles/items3_fx/mana_amulet.vpcf", PATTACH_ABSORIGIN_FOLLOW, self:GetParent())
    ParticleManager:ReleaseParticleIndex(particle)

    -- 被动：潜水服 - 累计伤害并增加魔抗层数
    self.damage_taken = self.damage_taken + params.original_damage

    while self.damage_taken >= self.stack_threshold do
        self.damage_taken = self.damage_taken - self.stack_threshold

        -- 添加魔抗叠加效果
        local modifier = self:GetParent():FindModifierByName("modifier_item_beast_shield_resist_stack")
        if modifier then
            if modifier:GetStackCount() < self.max_stacks then
                modifier:IncrementStackCount()
                modifier:ForceRefresh()
            end
        else
            local new_modifier = self:GetParent():AddNewModifier(
                self:GetParent(),
                self:GetAbility(),
                "modifier_item_beast_shield_resist_stack",
                { duration = self.stack_duration }
            )
            if new_modifier then
                new_modifier:SetStackCount(1)
            end
        end
    end
end


function modifier_item_beast_shield:GetModifierBonusStats_Strength()
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        return self:GetAbility():GetSpecialValueFor("bonus_strength")
    end
end

function modifier_item_beast_shield:GetModifierHealthBonus()
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        return self:GetAbility():GetSpecialValueFor("bonus_health")
    end
end

function modifier_item_beast_shield:GetModifierPhysicalArmorBonus()
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        return self:GetAbility():GetSpecialValueFor("bonus_armor")
    end
end

function modifier_item_beast_shield:GetModifierMagicalResistanceBonus()
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        return self:GetAbility():GetSpecialValueFor("bonus_spell_resist")
    end
end

function modifier_item_beast_shield:GetModifierConstantHealthRegen()
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        return self:GetAbility():GetSpecialValueFor("bonus_health_regen")
    end
end

function modifier_item_beast_shield:GetModifierConstantManaRegen()
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        return self:GetAbility():GetSpecialValueFor("bonus_mana_regen")
    end
end

function modifier_item_beast_shield:GetModifierAttackSpeedBonus_Constant()
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        return self:GetAbility():GetSpecialValueFor("bonus_attack_speed")
    end
end

-- 新增：魔抗叠加modifier
LinkLuaModifier("modifier_item_beast_shield_resist_stack", "items/item_beast_shield.lua", LUA_MODIFIER_MOTION_NONE)

modifier_item_beast_shield_resist_stack = class({})

function modifier_item_beast_shield_resist_stack:IsHidden() return false end
function modifier_item_beast_shield_resist_stack:IsDebuff() return false end
function modifier_item_beast_shield_resist_stack:IsPurgable() return false end

function modifier_item_beast_shield_resist_stack:OnCreated()
    if not self:GetAbility() then return end
    self.stack_resist = 3  -- 每层3%魔抗
end

function modifier_item_beast_shield_resist_stack:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
    }
end

function modifier_item_beast_shield_resist_stack:GetModifierMagicalResistanceBonus()
    return self:GetStackCount() * self.stack_resist
end

function modifier_item_beast_shield_resist_stack:GetTexture()
    return "item_eternal_shroud"
end
-- 主动modifier
modifier_item_beast_shield_active = class({})

function modifier_item_beast_shield_active:IsHidden() return false end
function modifier_item_beast_shield_active:IsPurgable() return false end

function modifier_item_beast_shield_active:CheckState()
    return {
        [MODIFIER_STATE_DISARMED] = true,
        [MODIFIER_STATE_ROOTED] = true,
    }
end

function modifier_item_beast_shield_active:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
        MODIFIER_PROPERTY_HEALTH_BONUS,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
        MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
    }
end

function modifier_item_beast_shield_active:GetModifierBonusStats_Strength()
    local base = self:GetAbility():GetSpecialValueFor("bonus_strength")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierHealthBonus()
    local base = self:GetAbility():GetSpecialValueFor("bonus_health")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierPhysicalArmorBonus()
    local base = self:GetAbility():GetSpecialValueFor("bonus_armor")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierMagicalResistanceBonus()
    local base = self:GetAbility():GetSpecialValueFor("bonus_spell_resist")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierConstantHealthRegen()
    local base = self:GetAbility():GetSpecialValueFor("bonus_health_regen")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierConstantManaRegen()
    local base = self:GetAbility():GetSpecialValueFor("bonus_mana_regen")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetTexture()
    return "item_beast_shield"
end

function modifier_item_beast_shield_active:GetEffectName()
    return "particles/items_fx/immunity_sphere.vpcf"
end

function modifier_item_beast_shield_active:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end
