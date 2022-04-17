modifier_member = class({})

function modifier_member:IsPurgable() return false end
function modifier_member:RemoveOnDeath() return false end
function modifier_member:GetTexture() return "member" end

function modifier_member:OnCreated()
	self.iBonusDamage = 10
	self.iBonusHp = 200
	self.iBonusMp = 150
end

function modifier_member:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_HEALTH_BONUS,
		MODIFIER_PROPERTY_MANA_BONUS,
	}
end


function modifier_member:GetModifierPreAttack_BonusDamage()
	return self.iBonusDamage
end

function modifier_member:GetModifierHealthBonus()
	return self.iBonusHp
end

function modifier_member:GetModifierManaBonus()
	return self.iBonusMp
end
