-- 链接所有modifier
-- LinkLuaModifier("modifier_item_magic_sword", "items/item_magic_sword", LUA_MODIFIER_MOTION_NONE)
-- LinkLuaModifier("modifier_item_magic_sword_active", "items/item_magic_sword", LUA_MODIFIER_MOTION_NONE)
-- LinkLuaModifier("modifier_item_magic_sword_slow", "items/item_magic_sword", LUA_MODIFIER_MOTION_NONE)

-- 物品主类
-- item_magic_sword = class({})

-- 主动技能效果（datadriven 调用）
-- function MagicSwordOnSpellStart(keys)
--     local caster = keys.caster
--     EmitSoundOn("Hero_Juggernaut.BladeFury", caster)
-- end

-- 溅射效果子函数
function MagicSwordCleaveEffect(params)
    if not IsServer() then return end
    if not params.attacker:IsRealHero() then return end
    if params.attacker:IsRangedAttacker() then return end -- 仅近战有效
    if params.attacker:GetTeam() == params.target:GetTeam() then return end

    local ability = params.ability
    if not ability then return end

    local cleave_distance = ability:GetSpecialValueFor("cleave_distance")
    local cleave_damage_percent = ability:GetSpecialValueFor("cleave_damage_percent")
    local cleave_damage_percent_creep = ability:GetSpecialValueFor("cleave_damage_percent_creep")
    local target_loc = params.target:GetAbsOrigin()

    -- 计算锥形区域内的敌人
    local enemies = FindUnitsInRadius(
        params.attacker:GetTeamNumber(),
        target_loc,
        nil,
        cleave_distance,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_BUILDING,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
        FIND_ANY_ORDER,
        false
    )

    -- 计算基础溅射伤害（基于攻击者的攻击力）
    local attacker_damage = params.attacker:GetAverageTrueAttackDamage(params.target)

    for _, enemy in pairs(enemies) do
        if enemy ~= params.target then
            local damage_percent = enemy:IsCreep() and cleave_damage_percent_creep or cleave_damage_percent
            local cleave_damage = attacker_damage * damage_percent / 100

            ApplyDamage({
                victim = enemy,
                attacker = params.attacker,
                damage = cleave_damage,
                damage_type = DAMAGE_TYPE_PHYSICAL,
                damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
                ability = ability,
            })
        end
    end
end

-- 主动效果创建（datadriven 调用）
-- function MagicSwordActiveOnCreated(keys)
--     if not IsServer() then return end

--     local parent = keys.caster
--     local ability = keys.ability

--     -- 添加特效
--     local fx = ParticleManager:CreateParticle(
--         "particles/units/heroes/hero_juggernaut/juggernaut_blade_fury.vpcf",
--         PATTACH_ABSORIGIN_FOLLOW,
--         parent
--     )
--     ParticleManager:ReleaseParticleIndex(fx)
-- end

-- 主动效果攻击处理（datadriven 调用）
function MagicSwordActiveOnAttackLanded(params)
    if not IsServer() then return end

    if params.attacker ~= params.caster then return end
    -- if params.damage_type ~= DAMAGE_TYPE_PHYSICAL then return end

    local ability = params.ability
    if not ability then return end

    local convert_pct = ability:GetSpecialValueFor("convert_pct")

    -- 根据攻击者的攻击力和目标的防御计算实际伤害
    local attacker_damage = params.attacker:GetAverageTrueAttackDamage(params.target)
    local actual_damage = CalculateActualDamage(attacker_damage, params.target)
    local pure_damage = actual_damage * convert_pct / 100

    -- 造成纯粹伤害
    ApplyDamage({
        victim = params.target,
        attacker = params.attacker,
        damage = pure_damage,
        damage_type = DAMAGE_TYPE_PURE,
        ability = ability,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    })

    -- 显示总伤害数字
    SendOverheadEventMessage(nil, OVERHEAD_ALERT_DAMAGE, params.target, actual_damage + pure_damage, nil)
end

-- ============================================
-- 减速debuff modifier
-- ============================================
-- modifier_item_magic_sword_slow = class({})

-- function modifier_item_magic_sword_slow:IsHidden() return false end

-- function modifier_item_magic_sword_slow:IsDebuff() return true end

-- function modifier_item_magic_sword_slow:IsPurgable() return true end

-- function modifier_item_magic_sword_slow:OnCreated()
--     if not self:GetAbility() then return end
--     self.slow_pct = self:GetAbility():GetSpecialValueFor("slow_pct") or -30
-- end

-- function modifier_item_magic_sword_slow:DeclareFunctions()
--     return {
--         MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
--     }
-- end

-- function modifier_item_magic_sword_slow:GetModifierMoveSpeedBonus_Percentage()
--     return self.slow_pct or -30
-- end

-- function modifier_item_magic_sword_slow:GetTexture()
--     return "item_magic_sword"
-- end
-- ============================================
-- modifier_item_magic_sword_slow = class({})

-- function modifier_item_magic_sword_slow:IsHidden() return false end

-- function modifier_item_magic_sword_slow:IsDebuff() return true end

-- function modifier_item_magic_sword_slow:IsPurgable() return true end

-- function modifier_item_magic_sword_slow:OnCreated()
--     if not self:GetAbility() then return end
--     self.slow_pct = self:GetAbility():GetSpecialValueFor("slow_pct") or -30
-- end

-- function modifier_item_magic_sword_slow:DeclareFunctions()
--     return {
--         MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
--     }
-- end

-- function modifier_item_magic_sword_slow:GetModifierMoveSpeedBonus_Percentage()
--     return self.slow_pct or -30
-- end

-- function modifier_item_magic_sword_slow:GetTexture()
--     return "item_magic_sword"
-- end
