
item_orb_of_the_brine = class({})
LinkLuaModifier( "modifier_item_orb_of_the_brine", "items/item_orb_of_the_brine", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_item_orb_of_the_brine_bubble", "items/item_orb_of_the_brine", LUA_MODIFIER_MOTION_NONE )


--------------------------------------------------------------------------------

function item_orb_of_the_brine:Precache( context )
	PrecacheResource( "particle", "particles/act_2/wand_of_the_brine_bubble.vpcf", context )
end

--------------------------------------------------------------------------------

function item_orb_of_the_brine:OnSpellStart()
	if IsServer() then
		self.bubble_duration = self:GetSpecialValueFor( "bubble_duration" )

		local hTarget = self:GetCursorTarget()
		hTarget:AddNewModifier( self:GetCaster(), self, "modifier_item_orb_of_the_brine_bubble", { duration = self.bubble_duration } )

		EmitSoundOn( "DOTA_Item.GhostScepter.Activate", self:GetCaster() )
	end
end

--------------------------------------------------------------------------------

function item_orb_of_the_brine:GetIntrinsicModifierName()
	return "modifier_item_orb_of_the_brine"
end

--------------------------------------------------------------------------------
-- Modifier
--------------------------------------------------------------------------------

modifier_item_orb_of_the_brine = class({})

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine:IsHidden()
	return true
end
function modifier_item_orb_of_the_brine:IsPurgable()
	return false
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine:OnCreated( kv )
	self.bonus_intelligence = self:GetAbility():GetSpecialValueFor( "bonus_intelligence" )
	self.bonus_mana_regen = self:GetAbility():GetSpecialValueFor( "bonus_mana_regen" )
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine:DeclareFunctions()
	local funcs =
	{
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
		MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
	}
	return funcs
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine:GetModifierBonusStats_Intellect( params )
	return self.bonus_intelligence
end

function modifier_item_orb_of_the_brine:GetModifierConstantManaRegen( params )
	return self.bonus_mana_regen
end

--------------------------------------------------------------------------------


modifier_item_orb_of_the_brine_bubble = class({})

function modifier_item_orb_of_the_brine_bubble:GetTexture()
	return "item_orb_of_the_brine"
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine_bubble:OnCreated( kv )
	if IsServer() then
		self.bubble_heal_per_tick = self:GetAbility():GetSpecialValueFor( "bubble_heal_per_tick" )
		self.heal_tick_interval = self:GetAbility():GetSpecialValueFor( "heal_tick_interval" )
		self.bubble_move_speed = self:GetAbility():GetSpecialValueFor( "bubble_move_speed" )

		self.nFXIndex = ParticleManager:CreateParticle( "particles/act_2/wand_of_the_brine_bubble.vpcf", PATTACH_CUSTOMORIGIN, nil )
		ParticleManager:SetParticleControlEnt( self.nFXIndex, 0, self:GetParent(), PATTACH_POINT_FOLLOW, "attach_hitloc", self:GetParent():GetOrigin(), true )
		ParticleManager:SetParticleControl( self.nFXIndex, 1, Vector( 2.5, 2.5, 2.5 ) ) -- target model scale

		self:StartIntervalThink( self.heal_tick_interval )
	end
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine_bubble:OnIntervalThink()
	if IsServer() then
		self:GetParent():Heal( self.bubble_heal_per_tick, self:GetAbility() )
	end
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine_bubble:CheckState()
	local state = {}
	if IsServer()  then
		state[ MODIFIER_STATE_SILENCED ]  = true
		state[ MODIFIER_STATE_MUTED ] = true
		state[ MODIFIER_STATE_DISARMED] = true
		state[ MODIFIER_STATE_OUT_OF_GAME ] = true
		state[ MODIFIER_STATE_MAGIC_IMMUNE ] = true
		state[ MODIFIER_STATE_INVULNERABLE ] = true
		state[ MODIFIER_STATE_UNSELECTABLE ] = true
	end

	return state
end

function modifier_item_orb_of_the_brine_bubble:DeclareFunctions()
	local funcs =
	{
		MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE,
	}
	return funcs
end

function modifier_item_orb_of_the_brine_bubble:GetModifierMoveSpeed_Absolute( params )
	return self.bubble_move_speed
end
--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine_bubble:OnDestroy()
	if IsServer()  then
		ParticleManager:DestroyParticle( self.nFXIndex, false )
	end
end

--------------------------------------------------------------------------------
