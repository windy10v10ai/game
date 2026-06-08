function OnSpellStart(keys)
    local caster = keys.caster
    local target = keys.target
    local ability = keys.ability

    -- Remove existing modifier if present
    if caster:HasModifier("modifier_phantom_strike_datadriven") then
        caster:RemoveModifierByName("modifier_phantom_strike_datadriven")
    end

    -- Apply fresh modifier
    ability:ApplyDataDrivenModifier(caster, caster, "modifier_phantom_strike_datadriven", {})

    -- 觉醒护身：魔法免疫（复用闪烁的持续时间）
    -- 已有更长魔免（如真 BKB）时跳过，避免短时觉醒魔免缩短/替代它
    local immune_duration = ability:GetSpecialValueFor("untargetable_duration")
    local existing = caster:FindModifierByName("modifier_black_king_bar_immune")
    if not existing or existing:GetRemainingTime() < immune_duration then
        caster:AddNewModifier(caster, ability, "modifier_black_king_bar_immune", { duration = immune_duration })
        caster:EmitSound("DOTA_Item.BlackKingBar.Activate")
    end

    local blink_start_pfx = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_phantom_assassin/phantom_assassin_phantom_strike_start.vpcf", PATTACH_ABSORIGIN,
        caster)
    ParticleManager:ReleaseParticleIndex(blink_start_pfx)
    -- 计算闪烁位置
    local casterOrigin = caster:GetAbsOrigin()
    local targetOrigin = target:GetAbsOrigin()

    -- 计算从目标指向施法者的方向
    local direction = casterOrigin - targetOrigin
    direction.z = 0
    direction = direction:Normalized()

    -- 设置闪烁距离（攻击距离内）
    local blinkDistance = 50

    -- 计算最终位置
    local blinkPosition = targetOrigin + direction * blinkDistance

    -- 执行闪烁
    Timers:CreateTimer(FrameTime(), function()
        FindClearSpaceForUnit(caster, blinkPosition, true)
        local blink_pfx = ParticleManager:CreateParticle(
            "particles/units/heroes/hero_phantom_assassin/phantom_assassin_phantom_strike_end.vpcf",
            PATTACH_ABSORIGIN_FOLLOW,
            caster)
        ParticleManager:ReleaseParticleIndex(blink_pfx)
    end)
    caster:FaceTowards(targetOrigin)

    -- 如果目标是敌方单位，自动攻击
    if target and target:GetTeamNumber() ~= caster:GetTeamNumber() then
        -- 延迟一帧执行攻击，确保传送完成
        Timers:CreateTimer(0.03, function()
            if caster and target and not target:IsNull() and not caster:IsNull() then
                ExecuteOrderFromTable({
                    OrderType = DOTA_UNIT_ORDER_ATTACK_TARGET,
                    UnitIndex = caster:GetEntityIndex(),
                    TargetIndex = target:GetEntityIndex(),
                    Queue = false,
                })
            end
        end)
    end
end
