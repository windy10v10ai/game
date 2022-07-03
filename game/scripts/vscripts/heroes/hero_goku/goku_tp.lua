LinkLuaModifier( "modifier_goku_tp", "heroes/hero_goku/goku_tp", LUA_MODIFIER_MOTION_NONE )

goku_tp = goku_tp or class({})
modifier_goku_tp = modifier_goku_tp or class({})

--------------------------------------------------------------------------------
-- Ability Start


function goku_tp:GetAbilityTextureName()
	if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
		return "custom/goku/goku_tp_ss"
	else
		return "custom/goku/goku_tp"
	end
end

function goku_tp:OnSpellStart()
	if not IsServer() then return end
	local caster = self:GetCaster()
	local duration = self:GetSpecialValueFor("duration")
	caster:EmitSound("goku.5_1")
	caster:AddNewModifier(caster,self,"modifier_goku_tp",{duration = duration})
end

function modifier_goku_tp:OnCreated(keys)
	local caster = self:GetCaster()
	-- caster:AddActivityModifier("fly")
	self.bonus_movespeed = self:GetAbility():GetSpecialValueFor("bonus_movespeed")
	self.particle = nil
	if caster:HasModifier("modifier_goku_super_saiyan") then
		self.particle = ParticleManager:CreateParticle("particles/custom/goku/goku_tp_statue_super_saiyan.vpcf",PATTACH_ABSORIGIN_FOLLOW, caster)
		ParticleManager:SetParticleControl(self.particle,60,Vector(255,255,0))
	else
		self.particle = ParticleManager:CreateParticle("particles/custom/goku/goku_tp_statue.vpcf",PATTACH_ABSORIGIN_FOLLOW, caster)
		ParticleManager:SetParticleControl(self.particle,60,Vector(0,255,255))
	end
	self:SetHasCustomTransmitterData(true)
end

function modifier_goku_tp:OnRefresh(keys)
	ParticleManager:DestroyParticle(self.particle,true)
	ParticleManager:ReleaseParticleIndex(self.particle)
	self:OnCreated(keys)
end

function modifier_goku_tp:OnDestroy()
	-- self:GetCaster():ClearActivityModifiers()
	ParticleManager:DestroyParticle(self.particle,true)
	ParticleManager:ReleaseParticleIndex(self.particle)
end

-- function modifier_goku_tp:AddCustomTransmitterData()
--     return {
--         bonus_movespeed = self.bonus_movespeed,
--     }
-- end

-- function modifier_goku_tp:HandleCustomTransmitterData(keys)
--     self.bonus_movespeed = keys.bonus_movespeed
-- end

function modifier_goku_tp:CheckState()
	local statues =
	{
		[MODIFIER_STATE_NO_HEALTH_BAR] = true,
		[MODIFIER_STATE_UNTARGETABLE] = true,
		[MODIFIER_STATE_FLYING_FOR_PATHING_PURPOSES_ONLY] = true
	}
	return statues
end

function modifier_goku_tp:DeclareFunctions()
	local func =
	{
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
		MODIFIER_PROPERTY_TRANSLATE_ACTIVITY_MODIFIERS
	}
	if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
	func =
	{
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
		MODIFIER_PROPERTY_TRANSLATE_ACTIVITY_MODIFIERS,
		MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT
	}
	end
	return func
end

function modifier_goku_tp:GetModifierMoveSpeedBonus_Percentage()
	return self.bonus_movespeed
end

function modifier_goku_tp:GetModifierIgnoreMovespeedLimit()
	return 1
end

function modifier_goku_tp:GetActivityTranslationModifiers()
	return "fly"
end

function modifier_goku_tp:GetStatusEffectName()
	if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
		return "particles/custom/goku/goku_tp_statue_color_super_saiyan.vpcf"
	else
		return "particles/custom/goku/goku_tp_statue_color.vpcf"
	end
end
