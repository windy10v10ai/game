LinkLuaModifier( "modifier_dummy_unit_passive", "units/dummy_unit_passive", LUA_MODIFIER_MOTION_NONE )
dummy_unit_passive2 = dummy_unit_passive2 or class({})
modifier_dummy_unit_passive = modifier_dummy_unit_passive or class({})

function dummy_unit_passive2:Spawn()
    if self:GetLevel() == 0 then
        self:SetLevel(1)
    end
end

function dummy_unit_passive2:GetIntrinsicModifierName()
    return "modifier_dummy_unit_passive"
end

function modifier_dummy_unit_passive:CheckState()
    local status =
    {
        [MODIFIER_STATE_NO_HEALTH_BAR] = true,
        [MODIFIER_STATE_UNSELECTABLE] = true,
        [MODIFIER_STATE_INVULNERABLE] = true,
        [MODIFIER_STATE_NOT_ON_MINIMAP] = true,
        [MODIFIER_STATE_FLYING] = true,
        [MODIFIER_STATE_NO_UNIT_COLLISION] = true
    }
    return status
end
