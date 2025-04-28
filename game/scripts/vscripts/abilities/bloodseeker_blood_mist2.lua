bloodseeker_blood_mist2 = class({})

function bloodseeker_blood_mist2:OnToggle()
	if self:GetToggleState() then
		EmitSoundOn("Hero_Bloodseeker.BloodRite.Cast", self:GetCaster())
		self:GetCaster():AddNewModifier(self:GetCaster(), self, "modifier_bloodseeker_blood_mist2", {})
	else
		self:GetCaster():RemoveModifierByName("modifier_bloodseeker_blood_mist2")
	end
end

--------------------------------------------------------------------------------------------------
modifier_bloodseeker_blood_mist2 = class({})
LinkLuaModifier("modifier_bloodseeker_blood_mist2", "abilities/bloodseeker_blood_mist2", LUA_MODIFIER_MOTION_NONE)

-- 无法驱散
function modifier_bloodseeker_blood_mist2:IsPurgable() return false end

--当创建
function modifier_bloodseeker_blood_mist2:OnCreated(keys)
	if not IsServer() then return end
	self:StartIntervalThink(1)
	self.particle = ParticleManager:CreateParticle(
		"particles/units/heroes/hero_bloodseeker/bloodseeker_scepter_blood_mist_aoe.vpcf", 1, self:GetCaster())
	ParticleManager:SetParticleControl(self.particle, 1, Vector(450, 0, 0))
end

--当创建
function modifier_bloodseeker_blood_mist2:OnDestroy(keys)
	if not IsServer() then return end
	ParticleManager:DestroyParticle(self.particle, false)
end

--think
function modifier_bloodseeker_blood_mist2:OnIntervalThink()
	--造成伤害
	local damage = self:GetCaster():GetMaxHealth() * self:GetAbility():GetSpecialValueFor("damage") * 0.01
	local damageInfoSelf = {
		victim = self:GetCaster(),
		attacker = self:GetCaster(),
		damage = damage,
		damage_type =
			DAMAGE_TYPE_MAGICAL,
		ability = self:GetAbility(),
		damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION + DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL
	}
	ApplyDamage(damageInfoSelf)
	--搜寻单位
	local caster = self:GetCaster()
	local radius = self:GetAbility():GetSpecialValueFor("radius")
	local units = FindUnitsInRadius(caster:GetTeamNumber(), caster:GetOrigin(), nil, radius, DOTA_UNIT_TARGET_TEAM_ENEMY,
		DOTA_UNIT_TARGET_BASIC + 1, 48, FIND_ANY_ORDER, false)
	for k, v in pairs(units) do
		--造成伤害
		local damageInfo = {
			victim = v,
			attacker = caster,
			damage = damage,
			damage_type = DAMAGE_TYPE_MAGICAL,
			ability =
				self:GetAbility(),
			damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
		}
		ApplyDamage(damageInfo)
	end
end
