modifier_player_adolphzero = class({})

function modifier_player_adolphzero:IsPurgable() return false end
function modifier_player_adolphzero:RemoveOnDeath() return false end
function modifier_player_adolphzero:GetTexture() return "player/adolphzero" end

function modifier_player_adolphzero:OnCreated()
end
function modifier_player_adolphzero:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
	}
end

function modifier_player_adolphzero:GetPriority()
	return MODIFIER_PRIORITY_LOW
end

function modifier_player_adolphzero:GetModifierBaseAttackTimeConstant()
	if self.bat_check ~= true then
		self.bat_check = true
        local current_bat = self:GetParent():GetBaseAttackTime()

        local bat_reduction = 0.1
        local new_bat = current_bat - bat_reduction
        self.bat_check = false
        return new_bat
    end
end
