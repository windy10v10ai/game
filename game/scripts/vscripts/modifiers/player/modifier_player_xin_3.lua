modifier_player_xin_3 = class({})

function modifier_player_xin_3:IsPurgable() return false end
function modifier_player_xin_3:RemoveOnDeath() return false end
function modifier_player_xin_3:GetTexture() return "player/xin_3" end

function modifier_player_xin_3:OnCreated()
	self.iCastRange = 200
end


function modifier_player_xin_3:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
	}
end

function modifier_player_xin_3:GetModifierCastRangeBonusStacking()
	return self.iCastRange
end
