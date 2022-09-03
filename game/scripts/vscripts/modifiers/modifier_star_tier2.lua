modifier_star_tier2 = class({})
function modifier_star_tier2:IsHidden() return true end
function modifier_star_tier2:IsDebuff() return false end
function modifier_star_tier2:IsPurgable() return false end
function modifier_star_tier2:IsPurgeException() return false end
function modifier_star_tier2:RemoveOnDeath() return true end
function modifier_star_tier2:OnCreated(table)
	self.caster = self:GetCaster()
	self.parent = self:GetParent()
	self.ability = self:GetAbility()
	local caster = self:GetCaster()
	
	
	if IsServer() then
		self:StopAllMusic()
	end
	if caster:GetUnitName()== "npc_dota_hero_phantom_lancer" then
	if caster:HasScepter() then
	EmitGlobalSound("star.theme2_43")
	else
	EmitGlobalSound("star.theme2_42")
	end
	end
	
	
	

	if not IsServer() or not self.parent:IsRealHero() then
		return nil
	end
	
self:StartIntervalThink(2)
	
end
function modifier_star_tier2:OnIntervalThink()
	if IsServer() then
		self:StopAllMusic2()
	end
end



function modifier_star_tier2:OnDestroy()
	self.caster = self:GetCaster()
	self.parent = self:GetParent()
	self.ability = self:GetAbility()
	local caster = self:GetCaster()
if caster:GetUnitName()== "npc_dota_hero_phantom_lancer" then
	StopGlobalSound("star.theme2_42")
	StopGlobalSound("star.theme2_43")

end
end
function modifier_star_tier2:StopAllMusic()
	if IsServer() then
		

		for i = 1, 100 do
			StopGlobalSound("star.theme2_"..i)
		end
			for i = 1, 6 do
			StopGlobalSound("star.horn_"..i)
		end
	
	
end
end
function modifier_star_tier2:StopAllMusic2()
	if IsServer() then
		
self.caster = self:GetCaster()
	self.parent = self:GetParent()
	self.ability = self:GetAbility()
	local caster = self:GetCaster()
	local enemies = FindUnitsInRadius(
		caster:GetTeamNumber(),	-- int, your team number
		caster:GetOrigin(),	-- point, center point
		nil,	-- handle, cacheUnit. (not known)
		FIND_UNITS_EVERYWHERE,	-- float, radius. or use FIND_UNITS_EVERYWHERE
		DOTA_UNIT_TARGET_TEAM_BOTH,	-- int, team filter
		DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,	-- int, type filter
		DOTA_UNIT_TARGET_FLAG_INVULNERABLE + DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,	-- int, flag filter
		0,	-- int, order filter
		false	-- bool, can grow cache
	)

	for _,enemy in pairs(enemies) do
		enemy:RemoveModifierByName("modifier_star_tier1")
		enemy:RemoveModifierByName("modifier_buff_chance")
		enemy:RemoveModifierByName("modifier_horn_tier1")
		enemy:RemoveModifierByName("modifier_debuff_chance")
	end
		

		
	end
end