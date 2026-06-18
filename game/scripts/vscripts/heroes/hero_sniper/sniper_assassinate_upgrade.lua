LinkLuaModifier("modifier_sniper_assassinate_target", "heroes/hero_sniper/sniper_assassinate_upgrade",
	LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_assassinate_caster_crit", "heroes/hero_sniper/sniper_assassinate_upgrade",
	LUA_MODIFIER_MOTION_NONE)


special_bonus_unique_sniper_assassinate_upgrade = class({})

function special_bonus_unique_sniper_assassinate_upgrade:GetAOERadius()
	return self:GetSpecialValueFor("scepter_radius")
end

function special_bonus_unique_sniper_assassinate_upgrade:OnUpgrade()
	local caster = self:GetCaster()
	local keen_scope = caster:FindAbilityByName("sniper_keen_scope")

	if keen_scope then
		keen_scope:SetLevel(self:GetLevel())
	end
end

function special_bonus_unique_sniper_assassinate_upgrade:OnSpellStart()
	local caster = self:GetCaster()
	local target_point = self:GetCursorPosition()
	local radius = self:GetSpecialValueFor("scepter_radius")

	-- 直接查找目标，不依赖数据驱动系统
	local targets = FindUnitsInRadius(
		caster:GetTeamNumber(),
		target_point,
		nil,
		radius,
		DOTA_UNIT_TARGET_TEAM_ENEMY,
		DOTA_UNIT_TARGET_HERO,
		DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_INVULNERABLE +
		DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS,
		FIND_ANY_ORDER,
		false
	)

	if #targets == 0 then
		return
	end

	-- 存储目标并发射弹道
	self.tTargets = targets
	-- self:FireAssassinateProjectiles()


	--EmitSoundOn("Hero_Sniper.AssassinateDamage", target)
	EmitSoundOn("Ability.Assassinate", caster)

	local projectile_speed = self:GetSpecialValueFor("projectile_speed") or 3000
	local bonus_physical_damage = self:GetSpecialValueFor("bonus_physical_damage")
	-- special_bonus_scepter 控制是否生效，无A杖时引擎返回0
	local stun_duration = self:GetSpecialValueFor("scepter_stun_duration")

	caster:AddNewModifier(caster, self, "modifier_assassinate_caster_crit", {})
	for _, target in pairs(self.tTargets) do
		caster:PerformAttack(target, true, true, true, false, true, false, true)
		-- 额外伤害与眩晕随弹道命中结算，避免瞬发先于子弹到达
		local travel_time = (target:GetAbsOrigin() - caster:GetAbsOrigin()):Length2D() / projectile_speed
		Timers:CreateTimer(travel_time, function()
			if target:IsNull() or not target:IsAlive() then return end
			ApplyDamage({
				victim = target,
				attacker = caster,
				damage = bonus_physical_damage,
				damage_type = DAMAGE_TYPE_PHYSICAL,
				ability = self,
			})
			if stun_duration > 0 then
				target:AddNewModifier(caster, self, "modifier_stunned", { duration = stun_duration })
			end
		end)
	end
	caster:RemoveModifierByName("modifier_assassinate_caster_crit")
end

function special_bonus_unique_sniper_assassinate_upgrade:FireAssassinateProjectiles()
	local caster = self:GetCaster()
	-- 获取施法者的攻击弹道粒子效果
	local attack_particle = caster:GetRangedProjectileName()

	-- 如果没有攻击弹道，使用默认的
	if not attack_particle or attack_particle == "" then
		attack_particle = "particles/units/heroes/hero_sniper/sniper_base_attack.vpcf"
	end
	for _, target in pairs(self.tTargets) do
		caster:EmitSound("Hero_Sniper.AssassinateProjectile")
		ProjectileManager:CreateTrackingProjectile({
			Target = target,
			Source = caster,
			Ability = self,
			EffectName = attack_particle,
			iMoveSpeed = self:GetSpecialValueFor("projectile_speed"),
			vSourceLoc = caster:GetAbsOrigin(),
			bDrawsOnMinimap = false,
			bDodgeable = true,
			bIsAttack = true,
			bVisibleToEnemies = true,
			bReplaceExisting = false,
			flExpireTime = GameRules:GetGameTime() + 10,
			bProvidesVision = false,
		})

		-- 添加目标标记
		target:AddNewModifier(caster, self, "modifier_sniper_assassinate_target", { Duration = 0.6 })
	end
end

-- function special_bonus_unique_sniper_assassinate_upgrade:OnProjectileHit(target, location)
-- 	if not target then return end

-- 	local caster = self:GetCaster()

-- 	-- 添加暴击修饰符并执行攻击
-- 	caster:AddNewModifier(caster, self, "modifier_assassinate_caster_crit", {})
-- 	caster:PerformAttack(target, true, true, true, true, false, false, true)
-- 	caster:RemoveModifierByName("modifier_assassinate_caster_crit")

-- 	EmitSoundOn("Hero_Sniper.AssassinateDamage", target)
-- 	-- 移除目标标记
-- 	target:RemoveModifierByName("modifier_sniper_assassinate_target")
-- end

modifier_sniper_assassinate_target = class({})

function modifier_sniper_assassinate_target:IsPurgable() return false end

function modifier_sniper_assassinate_target:DeclareFunctions() return { MODIFIER_EVENT_ON_DEATH } end

function modifier_sniper_assassinate_target:OnDeath(keys)
	local hParent = self:GetParent()
	if keys.target ~= hParent then return end
	local hAbility = self.GetAbility()
	if hAbility.tTargets then
		for i, v in ipairs(hAbility.tTargets) do
			if v == hParent() then
				table.remove(hAbility.tTargets, i)
			end
		end
	end
end

function modifier_sniper_assassinate_target:CheckState()
	return {
		[MODIFIER_STATE_INVISIBLE] = false,
		[MODIFIER_STATE_PROVIDES_VISION] = true
	}
end

function modifier_sniper_assassinate_target:OnCreated()
	self.iParticle = ParticleManager:CreateParticleForTeam(
		"particles/econ/items/sniper/sniper_charlie/sniper_crosshair_charlie.vpcf",
		PATTACH_OVERHEAD_FOLLOW,
		self:GetParent(),
		self:GetCaster():GetTeamNumber()
	)
end

function modifier_sniper_assassinate_target:OnDestroy()
	ParticleManager:DestroyParticle(self.iParticle, true)
	ParticleManager:ReleaseParticleIndex(self.iParticle)
end

modifier_assassinate_caster_crit = class({})

function modifier_assassinate_caster_crit:DeclareFunctions() return { MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE } end

function modifier_assassinate_caster_crit:GetModifierPreAttack_CriticalStrike()
	return self:GetAbility():GetSpecialValueFor("scepter_crit_bonus")
end
