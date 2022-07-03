goku_kamehameha = goku_kamehameha or class({})

--------------------------------------------------------------------------------
-- Ability Start

function goku_kamehameha:GetAbilityDamageType()
	if self:GetCaster():HasScepter() then
		return DAMAGE_TYPE_PURE
	else
		return DAMAGE_TYPE_MAGICAL
	end
end

function goku_kamehameha:GetCastRange()
	if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
		return 15000
	else
		return self:GetSpecialValueFor("length") + self:GetCaster():GetCastRangeBonus()
	end

end

function goku_kamehameha:GetChannelTime()
	return self:GetSpecialValueFor("channel")
end

function goku_kamehameha:GetAbilityTextureName()
	if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
		return "custom/goku/goku_kamehameha_ss"
	else
		return "custom/goku/goku_kamehameha"
	end
end

function  goku_kamehameha:OnAbilityPhaseStart()
	local caster = self:GetCaster()
	EmitSoundOnLocationForAllies( caster:GetOrigin(), "goku.1", caster )
	self.particle_storager = ParticleManager:CreateParticle("particles/custom/goku/goku_kamehameha_lase_energy_storager.vpcf", PATTACH_CUSTOMORIGIN_FOLLOW, caster)
	ParticleManager:SetParticleControlEnt(self.particle_storager, 0, caster, PATTACH_POINT_FOLLOW, "attach_attack1", caster:GetAbsOrigin(), true)
	ParticleManager:SetParticleControlEnt(self.particle_storager, 1, caster, PATTACH_POINT_FOLLOW, "attach_attack1", caster:GetAbsOrigin(), true)
	if caster:HasModifier("modifier_goku_super_saiyan") then
		ParticleManager:SetParticleControl(self.particle_storager,60,Vector(255,255,0))
	else
		ParticleManager:SetParticleControl(self.particle_storager,60,Vector(0,255,255))
	end
	return true
end

function  goku_kamehameha:OnAbilityPhaseInterrupted()
	local caster = self:GetCaster()
	StopSoundOn("goku.1", caster)
	ParticleManager:DestroyParticle(self.particle_storager,true)
	ParticleManager:ReleaseParticleIndex(self.particle_storager)
end

function goku_kamehameha:OnSpellStart()
	-- -- unit identifier
	if not IsServer() then return end

	local caster = self:GetCaster()
	local origin = caster:GetAbsOrigin()
	local point = self:GetCursorPosition()
	local vector = caster:GetForwardVector()

	self.FowViwers = {}
	self.width = self:GetSpecialValueFor("width")
	self.tick = self:GetSpecialValueFor("dmg_tick")
	self.manacost = self:GetSpecialValueFor("manacost_pre_second")
	self.times = 0
	local speed = self:GetSpecialValueFor("speed")
	local damage = self:GetSpecialValueFor("damage_pre_second") * self.tick
	local length = self:GetSpecialValueFor("length") + self:GetCaster():GetCastRangeBonus()
	self.time = GameRules:GetDOTATime(true,false)
	if  origin ~= point then
		vector = (point -  origin):Normalized()
	end

	self.startPos = origin + vector * self.width
	self.endPos = origin

	ParticleManager:SetParticleControl(self.particle_storager,4, -vector * 50)
	ParticleManager:DestroyParticle(self.particle_storager,false)
	ParticleManager:ReleaseParticleIndex(self.particle_storager)

	self.particle = ParticleManager:CreateParticle("particles/custom/goku/goku_kamehameha_laser.vpcf", PATTACH_CUSTOMORIGIN_FOLLOW, caster)
	ParticleManager:SetParticleControlEnt(self.particle, 0, caster, PATTACH_POINT_FOLLOW, "attach_attack1", caster:GetAbsOrigin(), true)
	ParticleManager:SetParticleControlEnt(self.particle, 9, caster, PATTACH_POINT_FOLLOW, "attach_attack1", caster:GetAbsOrigin(), true)
	if caster:HasModifier("modifier_goku_super_saiyan") then
		local damage_multiple = self:GetSpecialValueFor("super_saiyan_damage_multiple")
		damage = damage * damage_multiple

		local super_saiyan_mana_percent = self:GetSpecialValueFor("super_saiyan_mana_percent")
		local max_mana = caster:GetMaxMana()
		print("max_mana",max_mana)
		self.manacost = self.manacost + max_mana * super_saiyan_mana_percent/100

		length = self:GetSpecialValueFor("super_saiyan_length")
		speed = length

		ParticleManager:SetParticleControl(self.particle,60,Vector(255,255,0))
	else
		ParticleManager:SetParticleControl(self.particle,60,Vector(0,255,255))
	end


	self.damagetable =
	{
		victim = caster,
		attacker = caster,
		damage = damage,
		damage_type = DAMAGE_TYPE_MAGICAL,
		damage_flags = DOTA_DAMAGE_FLAG_NONE,
		ability = self
	}

	if caster:HasScepter() then
		self.damagetable.damage_type = DAMAGE_TYPE_PURE
	end

	local info = {
		Source = caster,
		Ability = self,
		vSpawnOrigin = caster:GetAbsOrigin(),

		iUnitTargetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY,
		iUnitTargetFlags = DOTA_UNIT_TARGET_FLAG_NONE,
		iUnitTargetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,

		fDistance = length,
		fStartRadius = self.width,
		fEndRadius = self.width,
		vVelocity = vector * speed,

		bProvidesVision = true,
		iVisionRadius = 200,
		iVisionTeamNumber = caster:GetTeamNumber(),
	}

	self.projectile = ProjectileManager:CreateLinearProjectile(info)

	for i = 1, length / self.width, 1 do
		table.insert(self.FowViwers,AddFOWViewer(self:GetCaster():GetTeamNumber(), origin + vector * i * self.width, self.width, 99999, false))
	end

	StopSoundOn("goku.1", caster)
	EmitSoundOnLocationForAllies( caster:GetOrigin(), "goku.1_1", caster )
end


function goku_kamehameha:OnChannelThink(tick)
	local caster = self:GetCaster()
	if caster:GetMana() < self.manacost *tick  then
		caster:InterruptChannel()
		return
	end
	caster:SpendMana(self.manacost * tick,self)
	local t_endPos
	if self.projectile then
		t_endPos = ProjectileManager:GetLinearProjectileLocation(self.projectile)
	end
	if ConvertNumber(t_endPos.x,4) ~= 0 and ConvertNumber(t_endPos.y,4) ~= 0 then
		if self.endPos ~= t_endPos then
			self.endPos = t_endPos
		end
	end


	self:IntervalDetection()
	ParticleManager:SetParticleControl(self.particle,1,self.endPos + Vector(0,0,120))
end

function goku_kamehameha:OnChannelFinish(bInterrupted)
	local t_endPos
	if self.projectile then
		t_endPos = ProjectileManager:GetLinearProjectileLocation(self.projectile)
	end
	if ConvertNumber(t_endPos.x,4) ~= 0 and ConvertNumber(t_endPos.y,4) ~= 0 and ConvertNumber(t_endPos.z,4) ~= 0 then
		if self.endPos ~= t_endPos then
			self.endPos = t_endPos
		end
	end
	self:IntervalDetection()
	ProjectileManager:DestroyLinearProjectile(self.projectile)
	self.projectile = nil
	ParticleManager:DestroyParticle(self.particle,true)
	ParticleManager:ReleaseParticleIndex(self.particle)
	for index, FowView in ipairs(self.FowViwers) do
		RemoveFOWViewer(self:GetCaster():GetTeamNumber(),FowView)
	end
end


-- function goku_kamehameha:OnProjectileThink(location)
-- 	self.endPos = location
-- 	self:IntervalDetection()
-- 	ParticleManager:SetParticleControl(self.particle,1,location + Vector(0,0,120))
-- end

function goku_kamehameha:IntervalDetection()
	local caster = self:GetCaster()
	local t_time = GameRules:GetDOTATime(true,false)
	local pre_time = ConvertNumber(t_time - self.time,3)
	local t_times = (pre_time-(pre_time%self.tick)) / self.tick
	if self.times ~= t_times then
		local target_flag = DOTA_UNIT_TARGET_FLAG_NONE
		if caster:HasScepter() then
			target_flag = DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES
		end
		local units = FindUnitsInLine(caster:GetTeamNumber(),self.startPos,self.endPos,nil,self.width,DOTA_UNIT_TARGET_TEAM_ENEMY,DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,target_flag)
		for _, unit in ipairs(units) do
			local talent = caster:FindAbilityByName("special_bonus_unique_goku_4")
			if talent and talent:GetLevel() == 1 then
				unit:Purge(true,false,false,false,true)
			end
			self.damagetable.victim = unit
			ApplyDamage(self.damagetable)
		end
		self.times = t_times
	end
end

function ConvertNumber(number,count)
	local num = math.pow(10,count)
	return math.floor(number * num + 0.5) / num
end
