if item_shotgun == nil then item_shotgun = class({}) end

LinkLuaModifier("modifier_item_shotgun", "items/item_shotgun.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_shotgun_cooldown", "items/item_shotgun.lua", LUA_MODIFIER_MOTION_NONE)


function item_shotgun:GetIntrinsicModifierName()
	return "modifier_item_shotgun"
end

if modifier_item_shotgun == nil then modifier_item_shotgun = class({}) end

function modifier_item_shotgun:IsDebuff() return false end

function modifier_item_shotgun:IsHidden() return true end

function modifier_item_shotgun:IsPurgable() return false end

function modifier_item_shotgun:GetAttributes()
	return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE +
		MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_shotgun:OnCreated()
	self.stats_modifier_name = "modifier_item_shotgun_stats"
	local ability = self:GetAbility()
	self.attack_radius = ability:GetSpecialValueFor("attack_radius")
	self.attack_percent = ability:GetSpecialValueFor("attack_percent")
	self.internal_cooldown = ability:GetSpecialValueFor("internal_cooldown")

	if not IsServer() then return end

	RefreshItemDataDrivenModifier(self:GetAbility(), self.stats_modifier_name)
	for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
		mod:GetAbility():SetSecondaryCharges(_)
	end
end

function modifier_item_shotgun:OnDestroy()
	if not IsServer() then return end

	RefreshItemDataDrivenModifier(self:GetAbility(), self.stats_modifier_name)
	for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
		mod:GetAbility():SetSecondaryCharges(_)
	end
end

function modifier_item_shotgun:DeclareFunctions()
	local funcs = {
		MODIFIER_PROPERTY_PROCATTACK_FEEDBACK
	}
	return funcs
end

function modifier_item_shotgun:GetModifierProcAttack_Feedback(keys)
	if not keys.attacker:IsRealHero() or not keys.attacker:IsRangedAttacker() then return end
	if keys.attacker:GetTeam() == keys.target:GetTeam() then return end
	if keys.target:IsBuilding() then return end

	-- if item in cooldown then return end
	if keys.attacker:HasModifier("modifier_item_shotgun_cooldown") then return end
	if keys.attacker:HasModifier("modifier_item_shotgun_v2_cooldown") then return end

	local ability = self:GetAbility()
	local target_loc = keys.target:GetAbsOrigin()
	local actual_damage = CalculateActualDamage(keys.damage, keys.target)
	local damage = actual_damage * self.attack_percent / 100

	local blast_pfx = ParticleManager:CreateParticle("particles/custom/shrapnel.vpcf", PATTACH_CUSTOMORIGIN, nil)
	ParticleManager:SetParticleControl(blast_pfx, 0, target_loc)
	ParticleManager:ReleaseParticleIndex(blast_pfx)

	local enemies = FindUnitsInRadius(keys.attacker:GetTeamNumber(), target_loc, nil, self.attack_radius,
		ability:GetAbilityTargetTeam(), ability:GetAbilityTargetType(), DOTA_UNIT_TARGET_FLAG_NONE,
		FIND_ANY_ORDER, false)
	for _, enemy in pairs(enemies) do
		if enemy ~= keys.target then
			ApplyDamage({
				victim       = enemy,
				attacker     = keys.attacker,
				damage       = damage,
				damage_type  = ability:GetAbilityDamageType(),
				damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
				ability      = ability,
			})
		end
	end

	keys.attacker:AddNewModifier(keys.attacker, self:GetAbility(), "modifier_item_shotgun_cooldown",
		{ duration = self.internal_cooldown })
end

if modifier_item_shotgun_cooldown == nil then modifier_item_shotgun_cooldown = class({}) end

function modifier_item_shotgun_cooldown:IsDebuff() return false end

function modifier_item_shotgun_cooldown:IsHidden() return true end

function modifier_item_shotgun_cooldown:IsPurgable() return false end

function modifier_item_shotgun_cooldown:RemoveOnDeath() return true end
