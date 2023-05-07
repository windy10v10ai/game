item_adi_king=class({})

LinkLuaModifier("modifier_item_adi_king", "items/item_adi_king.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_adi_king_aura", "items/item_adi_king.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_adi_king_buff", "items/item_adi_king.lua", LUA_MODIFIER_MOTION_NONE)

function item_adi_king:GetIntrinsicModifierName()
    return "modifier_item_adi_king"
end

function item_adi_king:OnSpellStart()
	local caster = self:GetCaster()
    local dur = self:GetSpecialValueFor("dur")
    caster:EmitSound( "DOTA_Item.PhaseBoots.Activate" )
    caster:AddNewModifier( caster, self, "modifier_item_adi_king_buff", {duration=dur} )
	-- remove debuff
	caster:Purge(false, true, false, false, false)
end

modifier_item_adi_king=class({})

function modifier_item_adi_king:IsBuff()
    return true
end

function modifier_item_adi_king:IsDebuff()
    return false
end

function modifier_item_adi_king:IsHidden()
    return true
end

function modifier_item_adi_king:IsPurgable()
    return false
end

function modifier_item_adi_king:IsPurgeException()
    return false
end

function modifier_item_adi_king:RemoveOnDeath()
    return self:GetParent():IsIllusion()
end

function modifier_item_adi_king:IsPassive()
    return true
end

function modifier_item_adi_king:IsAura()
    return true
end

function modifier_item_adi_king:GetAuraDuration()
    return 0
end

function modifier_item_adi_king:GetModifierAura()
    return "modifier_item_adi_king_aura"
end

function modifier_item_adi_king:GetAuraRadius()
    return self:GetAbility():GetSpecialValueFor("aura_rd")
end

function modifier_item_adi_king:GetAuraSearchFlags()
    return DOTA_UNIT_TARGET_FLAG_NONE
end

function modifier_item_adi_king:GetAuraSearchTeam()
    return DOTA_UNIT_TARGET_TEAM_FRIENDLY
end

function modifier_item_adi_king:GetAuraSearchType()
    return DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC
end

function modifier_item_adi_king:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE,
        MODIFIER_PROPERTY_EVASION_CONSTANT,
    }
end

function modifier_item_adi_king:OnCreated()
    if self:GetAbility() == nil then
		return
	end
    self.sp=self:GetAbility():GetSpecialValueFor("sp")
    self.att=self:GetAbility():GetSpecialValueFor("att")
    self.ar=self:GetAbility():GetSpecialValueFor("ar")
    self.rate=self:GetAbility():GetSpecialValueFor("rate")
    self.bonus_evasion=self:GetAbility():GetSpecialValueFor("bonus_evasion")
end

function modifier_item_adi_king:GetModifierMoveSpeedBonus_Constant()
    return  self.sp
end

function modifier_item_adi_king:GetModifierPreAttack_BonusDamage()
    return self.att
end

function modifier_item_adi_king:GetModifierPhysicalArmorBonus()
    return  self.ar
end

function modifier_item_adi_king:GetModifierTurnRate_Percentage()
    return  self.rate
end

function modifier_item_adi_king:GetModifierEvasion_Constant()
	return  self.bonus_evasion
end

modifier_item_adi_king_buff=class({})


function modifier_item_adi_king_buff:IsHidden()
    return false
end

function modifier_item_adi_king_buff:IsPurgable()
    return true
end

function modifier_item_adi_king_buff:IsPurgeException()
    return true
end

function modifier_item_adi_king_buff:GetTexture()
    return "item_adi_king"
end


function modifier_item_adi_king_buff:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end

function modifier_item_adi_king_buff:GetEffectName()
    return "particles/econ/events/ti10/phase_boots_ti10.vpcf"
end

function modifier_item_adi_king_buff:CheckState()
    return
    {
        [MODIFIER_STATE_ALLOW_PATHING_THROUGH_CLIFFS] = true,
        [MODIFIER_STATE_NO_UNIT_COLLISION] = true,
    }
end


function modifier_item_adi_king_buff:DeclareFunctions()
    return
    {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_EVASION_CONSTANT,
    }
end

function modifier_item_adi_king_buff:OnCreated()
    if self:GetAbility() == nil then
		return
	end
    self.active_sp=self:GetAbility():GetSpecialValueFor("active_sp")
    self.active_evasion=self:GetAbility():GetSpecialValueFor("active_evasion")
end

function modifier_item_adi_king_buff:GetModifierMoveSpeedBonus_Percentage()
        return self.active_sp
end

function modifier_item_adi_king_buff:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_item_adi_king_buff:GetModifierIgnoreMovespeedLimit()
    return 1
end

function modifier_item_adi_king_buff:GetModifierEvasion_Constant()
	return self.active_evasion
end

modifier_item_adi_king_aura=class({})

function modifier_item_adi_king_aura:IsBuff()
    return true
end

function modifier_item_adi_king_aura:IsHidden()
    return false
end

function modifier_item_adi_king_aura:IsPurgable()
    return false
end

function modifier_item_adi_king_aura:IsPurgeException()
    return false
end

function modifier_item_adi_king_aura:RemoveOnDeath()
    return true
end


function modifier_item_adi_king_aura:OnCreated()
    if self:GetAbility()==nil then
        return
    end
    self.aura_sp=self:GetAbility():GetSpecialValueFor("aura_sp")
end

function modifier_item_adi_king_aura:DeclareFunctions()
    return
    {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
    }
end

function modifier_item_adi_king_aura:GetModifierMoveSpeedBonus_Percentage()
    return self.aura_sp
end
