modifier_player_xiayibing = class({})

function modifier_player_xiayibing:IsPurgable() return false end
function modifier_player_xiayibing:RemoveOnDeath() return false end
function modifier_player_xiayibing:GetTexture() return "player/xiayibing" end

function modifier_player_xiayibing:OnCreated()
	self.iSpellAmplify = 10
end
function modifier_player_xiayibing:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_player_xiayibing:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end
