artoria_instinct = class({})

LinkLuaModifier("modifier_artoria_instinct", "heroes/artoria/modifiers/modifier_artoria_instinct", LUA_MODIFIER_MOTION_NONE)

function artoria_instinct:OnCreated()

end

function artoria_instinct:GetIntrinsicModifierName()
	return "modifier_artoria_instinct"
end
