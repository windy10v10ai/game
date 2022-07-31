modifier_membership = class({})

function modifier_membership:IsPurgable() return false end
function modifier_membership:RemoveOnDeath() return false end
function modifier_membership:GetTexture() return "player/member" end

function modifier_membership:OnCreated()
	self.iBonusDamage = 10
	self.iBonusHp = 200
	self.iBonusMp = 150
end

function modifier_membership:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_HEALTH_BONUS,
		MODIFIER_PROPERTY_MANA_BONUS,
	}
end


function modifier_membership:GetModifierPreAttack_BonusDamage()
	return self.iBonusDamage
end

function modifier_membership:GetModifierHealthBonus()
	return self.iBonusHp
end

function modifier_membership:GetModifierManaBonus()
	return self.iBonusMp
end
