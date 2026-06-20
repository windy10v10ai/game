-- 巫医 神语-觉醒：死亡守卫/变身术守卫被召唤时，攻击力按巫医当前技能增强% 等比提升
function OnAbilityExecuted(params)
    local caster = params.caster
    local event_ability = params.event_ability

    local ability_name = event_ability:GetAbilityName()
    if ability_name ~= "witch_doctor_death_ward" and ability_name ~= "witch_doctor_voodoo_switcheroo" then
        return
    end

    -- 召唤瞬间锁定 spell amp（0.x 小数），无增强则无加成
    local spell_amp = caster:GetSpellAmplification(false)
    if spell_amp <= 0 then
        return
    end
    local mult = 1 + spell_amp

    -- 延迟一帧等守卫生成
    Timers:CreateTimer(0.1, function()
        local search_radius = params.search_radius
        local target_pos = ability_name == "witch_doctor_death_ward" and event_ability:GetCursorPosition()
            or caster:GetAbsOrigin()

        local wards = Entities:FindAllByClassname("npc_dota_witch_doctor_death_ward")
        for _, ward in ipairs(wards) do
            if ward:GetTeam() == caster:GetTeam()
                and not ward._wd_awaken_amped
                and (ward:GetAbsOrigin() - target_pos):Length2D() <= search_radius then
                ward._wd_awaken_amped = true
                ward:SetBaseDamageMin(ward:GetBaseDamageMin() * mult)
                ward:SetBaseDamageMax(ward:GetBaseDamageMax() * mult)
            end
        end
    end)
end
