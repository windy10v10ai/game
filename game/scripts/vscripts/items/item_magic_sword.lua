-- 被动 modifier 创建时添加狂战斧溅射效果
function MagicSwordOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加原生狂战斧 modifier 实现溅射效果
    caster:AddNewModifier(caster, ability, "modifier_item_battlefury", {})
end

-- 被动 modifier 移除时移除狂战斧效果
function MagicSwordOnDestroy(keys)
    if not IsServer() then return end

    local caster = keys.caster

    if not caster then return end

    caster:RemoveModifierByName("modifier_item_battlefury")
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
