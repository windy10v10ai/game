-- 被动 modifier 创建时添加狂战斧溅射效果和 Desolator 减甲效果
function MagicSwordOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加原生狂战斧 modifier 实现溅射效果
    local battlefury_modifier = caster:AddNewModifier(caster, ability, "modifier_item_battlefury", {})

    -- 添加原生 Desolator modifier 实现减甲效果
    local desolator_modifier = caster:AddNewModifier(caster, ability, "modifier_item_desolator", {})

    -- 将添加的 modifier 保存到 ability 上,以便 OnDestroy 时精确移除
    if not ability.added_modifiers then
        ability.added_modifiers = {}
    end

    if battlefury_modifier then
        table.insert(ability.added_modifiers, battlefury_modifier)
    end
    if desolator_modifier then
        table.insert(ability.added_modifiers, desolator_modifier)
    end
end

-- 被动 modifier 移除时移除狂战斧效果
function MagicSwordOnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability

    if not ability or not ability.added_modifiers then return end

    -- 只移除此物品实例添加的 modifier
    for _, modifier in pairs(ability.added_modifiers) do
        if modifier and not modifier:IsNull() then
            modifier:Destroy()
        end
    end

    -- 清空记录
    ability.added_modifiers = nil
end

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
