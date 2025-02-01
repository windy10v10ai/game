abyssal_underlord_charge_slash = class({})


function abyssal_underlord_charge_slash:OnSpellStart()
	-- EmitSoundOn( "Hero_Abaddon.DeathCoil.Cast", self:GetCaster() )
	
	self:GetCaster():AddNewModifier(self:GetCaster(),self,"modifier_abyssal_underlord_charge_slash",{duration=3})
	EmitSoundOn( "Hero_PhantomLancer.PhantomEdge", self:GetCaster() )
	self.target = self:GetCursorTarget()
	self:GetCaster():MoveToTargetToAttack(self.target)
end

function abyssal_underlord_charge_slash:OnProjectileHit(target,pos)
	if not target then return end
	
	local caster = self:GetCaster()	
	--造成伤害
	local damage = self:GetSpecialValueFor("damage") + self:GetCaster():GetAverageTrueAttackDamage(nil)*self:GetSpecialValueFor("ad")
	local damageInfo ={victim = target,attacker = caster,damage = self:GetSpecialValueFor("damage"),damage_type = DAMAGE_TYPE_PHYSICAL,ability = self}
	ApplyDamage( damageInfo )
	target:AddNewModifier(caster,self,"modifier_stunned",{duration=self:GetSpecialValueFor("duration")})
end


--------------------------------------------------------------------------------
modifier_abyssal_underlord_charge_slash = class({})
LinkLuaModifier("modifier_abyssal_underlord_charge_slash", "abilities/abyssal_underlord_charge_slash", LUA_MODIFIER_MOTION_NONE)

function modifier_abyssal_underlord_charge_slash:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE,
		MODIFIER_EVENT_ON_ORDER
	}
	return funcs
end
--状态声明
function modifier_abyssal_underlord_charge_slash:CheckState()
	local state = {
		[MODIFIER_STATE_UNSLOWABLE] = true,
		[MODIFIER_STATE_NO_UNIT_COLLISION] = true,
		[MODIFIER_STATE_IGNORING_MOVE_AND_ATTACK_ORDERS ] = true,
	}
	return state
end
--特效
function modifier_abyssal_underlord_charge_slash:GetEffectName()
	return "particles/units/heroes/hero_phantom_lancer/phantomlancer_edge_boost.vpcf"
end
--当攻击
function modifier_abyssal_underlord_charge_slash:OnAttackLanded(keys)
	if keys.attacker == self:GetParent() then
		self:Destroy()
		local caster = self:GetCaster()
		local info = {
			EffectName = "particles/econ/items/sven/sven_ti7_sword/sven_ti7_sword_spell_great_cleave_crit.vpcf",
			Ability = self:GetAbility(),
			vSpawnOrigin = caster:GetOrigin(), 
			fStartRadius = 50,
			fEndRadius = 280,
			vVelocity = caster:GetForwardVector() * 2000,
			fDistance = 400,
			Source = caster,
			iUnitTargetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY,
			iUnitTargetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
		}
		ProjectileManager:CreateLinearProjectile(info)
	end
end
--当命令
function modifier_abyssal_underlord_charge_slash:OnOrder(keys)
	-- for k,v in pairs(keys) do
		-- print(k,v)
	-- end
	if IsServer() and keys.unit==self:GetParent() then
		if keys.order_type == DOTA_UNIT_ORDER_HOLD_POSITION then
			self:Destroy()
		end
	end
end
--攻击速度
function modifier_abyssal_underlord_charge_slash:GetModifierAttackSpeedBonus_Constant()
	return 400
end
--绝对移速
function modifier_abyssal_underlord_charge_slash:GetModifierMoveSpeed_Absolute()
	return 800
end