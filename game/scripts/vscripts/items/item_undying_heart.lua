--[[ 不朽之心：力量与回复借原版龙心，主动瞬发回血并驱散，随后的持续回复由 KV buff 提供。 ]]

local BUFF_MODIFIER = "modifier_item_undying_heart_buff"

function UndyingHeartOnCreated(keys)
    if not IsServer() then return end

    local unit = keys.caster
    local ability = keys.ability
    if not unit or not ability or ability.heartModifier then return end

    -- 句柄按物品实例保存，多件时各摘各的
    ability.heartModifier = unit:AddNewModifier(unit, ability, "modifier_item_heart", {})
end

function UndyingHeartOnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability
    local modifier = ability and ability.heartModifier
    if not modifier then return end
    ability.heartModifier = nil

    if not modifier:IsNull() then
        modifier:Destroy()
    end
end

function UndyingHeartOnSpellStart(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability
    if not caster or not ability then return end

    caster:EmitSound("Item.GuardianGreaves.Activate")
    local fx = ParticleManager:CreateParticle("particles/items3_fx/warmage.vpcf", PATTACH_ABSORIGIN, caster)
    ParticleManager:ReleaseParticleIndex(fx)

    ApplyItemDataDrivenModifier(nil, caster, caster, BUFF_MODIFIER, {
        duration = ability:GetSpecialValueFor("dur"),
    })

    local healAmount = ability:GetSpecialValueFor("active_hp_regen")
        + caster:GetMaxHealth() * ability:GetSpecialValueFor("active_hp_regen_pct") / 100
    caster:Heal(healAmount, caster)
    SendOverheadEventMessage(caster, OVERHEAD_ALERT_HEAL, caster, healAmount, nil)
    local fx2 = ParticleManager:CreateParticle("particles/items3_fx/warmage_recipient.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:ReleaseParticleIndex(fx2)

    caster:Purge(false, true, false, false, false)
end
