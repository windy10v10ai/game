item_magic_abyss_staff = class({})

LinkLuaModifier("modifier_item_magic_abyss_staff", "items/item_magic_abyss_staff", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_magic_abyss_staff_active", "items/item_magic_abyss_staff", LUA_MODIFIER_MOTION_NONE)

function item_magic_abyss_staff:GetIntrinsicModifierName()
    return "modifier_item_magic_abyss_staff"
end

function item_magic_abyss_staff:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("active_duration") or 4

    caster:AddNewModifier(caster, self, "modifier_item_magic_abyss_staff_active", { duration = duration })

    EmitSoundOn("Hero_Oracle.FortunesEnd.Target", caster)
end

-- 被动modifier
modifier_item_magic_abyss_staff = class({})

function modifier_item_magic_abyss_staff:IsHidden() return true end

function modifier_item_magic_abyss_staff:IsPurgable() return false end

function modifier_item_magic_abyss_staff:RemoveOnDeath() return false end

function modifier_item_magic_abyss_staff:OnCreated()
    self.stats_modifier_name = "modifier_item_magic_abyss_staff_stats"
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_magic_abyss_staff:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_magic_abyss_staff:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
    }
end

function modifier_item_magic_abyss_staff:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_magic_abyss_staff:GetModifierSpellAmplify_Percentage()
    if self:GetParent():HasModifier("modifier_item_hallowed_scepter") then
        return 0
    end

    -- ✅ 修复: 先获取ability对象
    local ability = self:GetAbility()
    if not ability then return 0 end

    local spell_amp_per_int = ability:GetSpecialValueFor("spell_amp_per_int")
    if not spell_amp_per_int or spell_amp_per_int == 0 then
        return 0
    end

    local current_int = self:GetParent():GetIntellect(false)
    local int_spell_amp = current_int * spell_amp_per_int

    return int_spell_amp
end

-- 主动效果modifier
modifier_item_magic_abyss_staff_active = class({})

function modifier_item_magic_abyss_staff_active:IsHidden() return false end

function modifier_item_magic_abyss_staff_active:IsPurgable() return false end

function modifier_item_magic_abyss_staff_active:IsDebuff() return false end

function modifier_item_magic_abyss_staff_active:OnCreated()
    if not IsServer() then return end

    local parent = self:GetParent()
    -- 【新增】缓存转化比例用于tooltip显示
    local ability = self:GetAbility()
    if ability then
        self.convert_pct = ability:GetSpecialValueFor("convert_pct") or 10
    end
    -- 添加特效
    local fx = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_oracle/oracle_fortune_purge.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        parent
    )
    self:AddParticle(fx, false, false, -1, false, false)
end

function modifier_item_magic_abyss_staff_active:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_TAKEDAMAGE,
        MODIFIER_PROPERTY_TOOLTIP, -- 【新增】声明tooltip属性
    }
end

-- 【新增】返回tooltip数值
function modifier_item_magic_abyss_staff_active:OnTooltip()
    return self.convert_pct or 10
end

function modifier_item_magic_abyss_staff_active:OnTakeDamage(params)
    if not IsServer() then return end

    -- 伤害小于10不不处理，优化性能
    if params.damage < 10 then return end

    -- 只处理自己造成的伤害
    if params.attacker ~= self:GetParent() then return end

    -- 只转换魔法伤害
    if params.damage_type ~= DAMAGE_TYPE_MAGICAL then return end

    -- 避免无限循环
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == DOTA_DAMAGE_FLAG_REFLECTION then
        return
    end

    local ability = self:GetAbility()
    if not ability then return end

    local convert_pct = ability:GetSpecialValueFor("convert_pct") or 10
    local pure_damage = params.damage * convert_pct / 100

    -- 造成额外的纯粹伤害
    local actual_damage = ApplyDamage({
        victim = params.unit,
        attacker = self:GetParent(),
        damage = pure_damage,
        damage_type = DAMAGE_TYPE_PURE,
        ability = ability,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION + DOTA_DAMAGE_FLAG_REFLECTION,
    })

    -- 【新增】显示金色伤害数字
    SendOverheadEventMessage(nil, OVERHEAD_ALERT_DAMAGE, params.unit, actual_damage, nil)
end

function modifier_item_magic_abyss_staff_active:GetTexture()
    return "moyuanfazhang"
end
