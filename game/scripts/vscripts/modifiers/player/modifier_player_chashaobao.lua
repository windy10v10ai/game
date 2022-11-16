modifier_player_chashaobao = class({})

function modifier_player_chashaobao:IsPurgable() return false end
function modifier_player_chashaobao:RemoveOnDeath() return false end
function modifier_player_chashaobao:GetTexture() return "player/chashaobao" end

function modifier_player_chashaobao:OnCreated()
	self.iIncomingDamage = -8
end


function modifier_player_chashaobao:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
	}
end

function modifier_player_chashaobao:GetModifierIncomingDamage_Percentage()
	return self.iIncomingDamage
end
