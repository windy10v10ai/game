modifier_player_nmjb = class({})

function modifier_player_nmjb:IsPurgable() return false end
function modifier_player_nmjb:RemoveOnDeath() return false end
function modifier_player_nmjb:GetTexture() return "player/plusIcon" end

function modifier_player_nmjb:OnCreated()
	self.iBonusDamage = 30
end

function modifier_player_nmjb:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
	}
end

function modifier_player_nmjb:GetModifierPreAttack_BonusDamage()
	return self.iBonusDamage
end
