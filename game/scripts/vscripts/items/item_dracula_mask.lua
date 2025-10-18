LinkLuaModifier("modifier_item_dracula_mask", "items/item_dracula_mask", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_dracula_mask_active", "items/item_dracula_mask", LUA_MODIFIER_MOTION_NONE)

item_dracula_mask = class({})

function item_dracula_mask:GetIntrinsicModifierName()
    return "modifier_item_dracula_mask"
end

function item_dracula_mask:OnSpellStart()
    if not IsServer() then return end

    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("active_duration")

    -- 永恒之盘触发音效
    caster:EmitSound("DOTA_Item.AeonDisk.Activate")
    -- 撒旦触发音效
    caster:EmitSound("DOTA_Item.Satanic.Activate")
    -- 添加主动buff
    caster:AddNewModifier(caster, self, "modifier_item_dracula_mask_active", {duration = duration})

    -- 驱散负面效果
    caster:Purge(false, true, false, true, true)
    -- 永恒之盘触发特效 - 护盾爆发效果
    local particle = ParticleManager:CreateParticle(
        "particles/items4_fx/combo_breaker_buff.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        caster
    )
    ParticleManager:ReleaseParticleIndex(particle)
end

-- 被动modifier
modifier_item_dracula_mask = class({})

function modifier_item_dracula_mask:IsHidden() return true end
function modifier_item_dracula_mask:IsPurgable() return false end
function modifier_item_dracula_mask:IsPurgeException() return false end
function modifier_item_dracula_mask:RemoveOnDeath() return false end
function modifier_item_dracula_mask:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_dracula_mask:OnCreated()
    self.stats_modifier_name = "modifier_item_dracula_mask_stats"

    if not self:GetAbility() then return end
    local ability = self:GetAbility()

    -- 读取属性(客户端和服务器端都需要)
    self.bonus_health = ability:GetSpecialValueFor("bonus_health")
    self.bonus_strength = ability:GetSpecialValueFor("bonus_strength")
    self.bonus_damage = ability:GetSpecialValueFor("bonus_damage")
    self.lifesteal_percent = ability:GetSpecialValueFor("lifesteal_percent")
    self.spell_lifesteal = ability:GetSpecialValueFor("spell_lifesteal")
    self.bonus_movement_speed = ability:GetSpecialValueFor("bonus_movement_speed")
    self.bonus_health_regen = ability:GetSpecialValueFor("bonus_health_regen")
    self.hp_threshold = ability:GetSpecialValueFor("hp_threshold")

    if IsServer() then
        RefreshItemDataDrivenModifier(_, ability, self.stats_modifier_name)
        self:StartIntervalThink(0.1)  -- 每0.1秒检查生命值
    end
end
function modifier_item_dracula_mask:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_HEALTH_BONUS,
        MODIFIER_PROPERTY_STRENGTH_BONUS,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
        MODIFIER_PROPERTY_CONSTANT_HEALTH_REGEN,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
    }
end
function modifier_item_dracula_mask:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_dracula_mask:OnIntervalThink()
    if not IsServer() then return end

    local parent = self:GetParent()
    local ability = self:GetAbility()

    if not ability or ability:IsNull() then return end

    -- 检查生命值是否低于阈值
    local hp_pct = parent:GetHealthPercent()
    if hp_pct <= self.hp_threshold and ability:IsFullyCastable() then
        -- 自动触发主动技能
        ability:OnSpellStart()
        ability:UseResources(false, false, false, true)  -- 消耗冷却
    end
end
-- 被动双吸血效果(物理+法术)
function modifier_item_dracula_mask:OnTakeDamage(params)
    if not IsServer() then return end

    local parent = self:GetParent()
    local attacker = params.attacker

    -- 只处理自己造成的伤害
    if attacker ~= parent then return end

    -- 被动物理吸血:只对普通攻击的物理伤害生效
    if not params.inflictor and params.damage_type == DAMAGE_TYPE_PHYSICAL then
        local heal = params.damage * (self.lifesteal_percent or 30) / 100
        parent:Heal(heal, self:GetAbility())

    end

    -- 被动法术吸血:对技能造成的魔法伤害生效
    if params.inflictor and params.damage_type ~= DAMAGE_TYPE_PURE then
        -- 排除反弹伤害和HP移除
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == 0 and
    bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_HPLOSS) == 0 then

            local spell_heal = params.damage * (self.spell_lifesteal or 25) / 100

            -- 非英雄目标降低吸血效果
            if not params.unit:IsHero() then
                spell_heal = spell_heal * 0.2
            end

            parent:Heal(spell_heal, self:GetAbility())

            -- 【修复】法术吸血特效 - 使用定时器销毁
            local particle = ParticleManager:CreateParticle(
                "particles/items3_fx/octarine_core_lifesteal.vpcf",
                PATTACH_ABSORIGIN_FOLLOW,
                parent
            )
            -- 1秒后销毁特效
            Timers:CreateTimer(1.0, function()
                ParticleManager:DestroyParticle(particle, false)
                ParticleManager:ReleaseParticleIndex(particle)
            end)
        end
    end
end

function modifier_item_dracula_mask:GetModifierStrengthBonus()
    return self.bonus_strength or 0
end
function modifier_item_dracula_mask:GetModifierHealthBonus()
    return self.bonus_health or 0
end

function modifier_item_dracula_mask:GetModifierPreAttack_BonusDamage()
    return self.bonus_damage or 0
end

function modifier_item_dracula_mask:GetModifierMoveSpeedBonus_Percentage()
    return self.bonus_movement_speed or 0
end

function modifier_item_dracula_mask:GetModifierConstantHealthRegen()
    return self.bonus_health_regen or 0
end

function modifier_item_dracula_mask:GetModifierLifestealRegenAmplify_Percentage()
    return self.lifesteal_percent or 0
end

function modifier_item_dracula_mask:GetModifierSpellLifestealRegenAmplify_Percentage()
    return self.spell_lifesteal or 0
end

-- 主动buff
modifier_item_dracula_mask_active = class({})

function modifier_item_dracula_mask_active:IsHidden() return false end
function modifier_item_dracula_mask_active:IsDebuff() return false end
function modifier_item_dracula_mask_active:IsPurgable() return false end

function modifier_item_dracula_mask_active:GetTexture()
    return "item_dracula_mask"
end

function modifier_item_dracula_mask_active:OnCreated()
    if not self:GetAbility() then return end

    -- 客户端和服务器端都需要读取
    self.lifesteal_active = self:GetAbility():GetSpecialValueFor("lifesteal_active")
    self.spell_lifesteal_active = self:GetAbility():GetSpecialValueFor("spell_lifesteal_active")
    self.bonus_attack_speed_active = self:GetAbility():GetSpecialValueFor("bonus_attack_speed_active")
    self.bonus_movement_speed_active = self:GetAbility():GetSpecialValueFor("bonus_movement_speed_active")
    self.damage_reduction = self:GetAbility():GetSpecialValueFor("damage_reduction") or -30
    self.status_resistance = self:GetAbility():GetSpecialValueFor("status_resistance_active") or 80

    if not IsServer() then return end

    -- 服务器端逻辑
    self.damage_reduction = self:GetAbility():GetSpecialValueFor("damage_reduction") or -100  -- 100%减伤 = 不受任何伤害

end


function modifier_item_dracula_mask_active:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
        MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
        MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
    }
end
-- 主动期间增强双吸血效果
function modifier_item_dracula_mask_active:OnTakeDamage(params)
    if not IsServer() then return end

    local parent = self:GetParent()
    local attacker = params.attacker

    if attacker ~= parent then return end

    -- 主动期间物理吸血
    if not params.inflictor and params.damage_type == DAMAGE_TYPE_PHYSICAL then
        local heal = params.damage * (self.lifesteal_active or 200) / 100
        parent:Heal(heal, self:GetAbility())

    end

    -- 主动期间法术吸血
    if params.inflictor and params.damage_type ~= DAMAGE_TYPE_PURE then
        if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == 0 and
            bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_HPLOSS) == 0 then

            local spell_heal = params.damage * (self.spell_lifesteal_active or 100) / 100

            if not params.unit:IsHero() then
                spell_heal = spell_heal * 0.2
            end

            parent:Heal(spell_heal, self:GetAbility())

            -- 【修复】法术吸血特效 - 使用定时器销毁
            local particle = ParticleManager:CreateParticle(
                "particles/items3_fx/octarine_core_lifesteal.vpcf",
                PATTACH_ABSORIGIN_FOLLOW,
                parent
            )
            Timers:CreateTimer(1.0, function()
                ParticleManager:DestroyParticle(particle, false)
                ParticleManager:ReleaseParticleIndex(particle)
            end)
        end
    end
end
function modifier_item_dracula_mask_active:GetModifierAttackSpeedBonus_Constant()
    return self.bonus_attack_speed_active or 0
end

function modifier_item_dracula_mask_active:GetModifierMoveSpeedBonus_Percentage()
    return self.bonus_movement_speed_active or 0
end

function modifier_item_dracula_mask_active:GetModifierIncomingDamage_Percentage()
    return self.damage_reduction or -30
end

function modifier_item_dracula_mask_active:GetModifierStatusResistanceStacking()
    return self.status_resistance or 80
end

function modifier_item_dracula_mask_active:GetModifierLifestealRegenAmplify_Percentage()
    return self.lifesteal_active or 200
end

function modifier_item_dracula_mask_active:GetModifierSpellLifestealRegenAmplify_Percentage()
    return self.spell_lifesteal_active or 100
end

function modifier_item_dracula_mask_active:CheckState()
    return {
        [MODIFIER_STATE_UNSLOWABLE] = true,
        [MODIFIER_STATE_DEBUFF_IMMUNE] = true,
    }
end
