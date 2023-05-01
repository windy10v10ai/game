item_adi_king_plus=class({})

LinkLuaModifier("modifier_item_adi_king_plus", "items/item_adi_king_plus.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_adi_king_plus_aura", "items/item_adi_king_plus.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_adi_king_plus_buff", "items/item_adi_king_plus.lua", LUA_MODIFIER_MOTION_NONE)

function item_adi_king_plus:GetIntrinsicModifierName()
    return "modifier_item_adi_king_plus"
end

function item_adi_king_plus:OnSpellStart()
	local caster = self:GetCaster()
    local dur = self:GetSpecialValueFor("dur")
    caster:EmitSound( "DOTA_Item.PhaseBoots.Activate" )
    caster:AddNewModifier( caster, self, "modifier_item_adi_king_plus_buff", {duration=dur} )
	-- remove debuff
	caster:Purge(false, true, false, false, false)
end

modifier_item_adi_king_plus=class({})

function modifier_item_adi_king_plus:IsBuff()
    return true
end

function modifier_item_adi_king_plus:IsDebuff()
    return false
end

function modifier_item_adi_king_plus:IsHidden()
    return true
end

function modifier_item_adi_king_plus:IsPurgable()
    return false
end

function modifier_item_adi_king_plus:IsPurgeException()
    return false
end

function modifier_item_adi_king_plus:RemoveOnDeath()
    return self:GetParent():IsIllusion()
end

function modifier_item_adi_king_plus:IsPassive()
    return true
end

function modifier_item_adi_king_plus:IsAura()
    return true
end

function modifier_item_adi_king_plus:GetAuraDuration()
    return 0
end

function modifier_item_adi_king_plus:GetModifierAura()
    return "modifier_item_adi_king_plus_aura"
end

function modifier_item_adi_king_plus:GetAuraRadius()
    return self:GetAbility():GetSpecialValueFor("aura_rd")
end

function modifier_item_adi_king_plus:GetAuraSearchFlags()
    return DOTA_UNIT_TARGET_FLAG_NONE
end

function modifier_item_adi_king_plus:GetAuraSearchTeam()
    return DOTA_UNIT_TARGET_TEAM_FRIENDLY
end

function modifier_item_adi_king_plus:GetAuraSearchType()
    return DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC
end

function modifier_item_adi_king_plus:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE,
        MODIFIER_PROPERTY_EVASION_CONSTANT,
    }
end

function modifier_item_adi_king_plus:OnCreated()
    if self:GetAbility() == nil then
		return
	end
    self.sp=self:GetAbility():GetSpecialValueFor("sp")
    self.att=self:GetAbility():GetSpecialValueFor("att")
    self.ar=self:GetAbility():GetSpecialValueFor("ar")
    self.rate=self:GetAbility():GetSpecialValueFor("rate")
    self.bonus_evasion=self:GetAbility():GetSpecialValueFor("bonus_evasion")
end

function modifier_item_adi_king_plus:GetModifierMoveSpeedBonus_Constant()
    return  self.sp
end

function modifier_item_adi_king_plus:GetModifierPreAttack_BonusDamage()
    return self.att
end

function modifier_item_adi_king_plus:GetModifierPhysicalArmorBonus()
    return  self.ar
end

function modifier_item_adi_king_plus:GetModifierTurnRate_Percentage()
    return  self.rate
end

function modifier_item_adi_king_plus:GetModifierEvasion_Constant()
	return  self.bonus_evasion
end

modifier_item_adi_king_plus_buff=class({})


function modifier_item_adi_king_plus_buff:IsHidden()
    return false
end

function modifier_item_adi_king_plus_buff:IsPurgable()
    return true
end

function modifier_item_adi_king_plus_buff:IsPurgeException()
    return true
end

function modifier_item_adi_king_plus_buff:GetTexture()
    return "item_adi_king_plus"
end


function modifier_item_adi_king_plus_buff:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end

function modifier_item_adi_king_plus_buff:GetEffectName()
    return "particles/econ/events/ti10/phase_boots_ti10.vpcf"
end

function modifier_item_adi_king_plus_buff:CheckState()
    return
    {
        [MODIFIER_STATE_ALLOW_PATHING_THROUGH_CLIFFS] = true,
        [MODIFIER_STATE_NO_UNIT_COLLISION] = true,
    }
end


function modifier_item_adi_king_plus_buff:DeclareFunctions()
    return
    {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_EVASION_CONSTANT,
    }
end

function modifier_item_adi_king_plus_buff:OnCreated()
    if self:GetAbility() == nil then
		return
	end
    self.active_sp=self:GetAbility():GetSpecialValueFor("active_sp")
    self.active_evasion=self:GetAbility():GetSpecialValueFor("active_evasion")
end

function modifier_item_adi_king_plus_buff:GetModifierMoveSpeedBonus_Percentage()
        return self.active_sp
end

function modifier_item_adi_king_plus_buff:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_item_adi_king_plus_buff:GetModifierIgnoreMovespeedLimit()
    return 1
end

function modifier_item_adi_king_plus_buff:GetModifierEvasion_Constant()
	return self.active_evasion
end

modifier_item_adi_king_plus_aura=class({})

function modifier_item_adi_king_plus_aura:IsBuff()
    return true
end

function modifier_item_adi_king_plus_aura:IsHidden()
    return false
end

function modifier_item_adi_king_plus_aura:IsPurgable()
    return false
end

function modifier_item_adi_king_plus_aura:IsPurgeException()
    return false
end

function modifier_item_adi_king_plus_aura:RemoveOnDeath()
    return true
end


function modifier_item_adi_king_plus_aura:OnCreated()
    if self:GetAbility()==nil then
        return
    end
    self.aura_sp=self:GetAbility():GetSpecialValueFor("aura_sp")
end

function modifier_item_adi_king_plus_aura:DeclareFunctions()
    return
    {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
    }
end

function modifier_item_adi_king_plus_aura:GetModifierMoveSpeedBonus_Percentage()
    return self.aura_sp
end
