g_creeps_name={
	"npc_dota_goodguys_siege",
	"npc_dota_goodguys_siege_upgraded",
	"npc_dota_badguys_siege",
	"npc_dota_badguys_siege_upgraded",
	"npc_dota_creep_goodguys_melee",
	"npc_dota_creep_goodguys_melee_upgraded",
	"npc_dota_creep_goodguys_ranged",
	"npc_dota_creep_goodguys_ranged_upgraded",
	"npc_dota_creep_badguys_melee",
	"npc_dota_creep_badguys_melee_upgraded",
	"npc_dota_creep_badguys_ranged",
	"npc_dota_creep_badguys_ranged_upgraded"
}
ability_thdots_yukari04 = {}

function Yukari_CanMovetoGap(unit)
	if unit==nil or unit:IsNull() then
		return false
	end
	for _,name in pairs(g_creeps_name) do
		if name==unit:GetUnitName() then return true end
	end
end
function Yukari04_OnSpellStart(keys)
	local ability=keys.ability
	local caster=keys.caster
	local target=keys.target_points[1]
	local vecPos=nil
	local lvl=ability:GetLevel()
	local wanbaochui_radius = ability:GetSpecialValueFor("wanbaochui_radius")
	local int_bonus = ability:GetSpecialValueFor("int_bonus")
	vecPos=target
	if vecPos then
		local tick=0
		local tick_interval=keys.BarrageFireInterval
		local channel_start_time=GameRules:GetGameTime()
		local barrage_radius=keys.BarrageRadius
		local barrage_speed=1000
		local rotate_radian=1.57
		local rotate_speed=-0.08
		local int_bonus = ability:GetSpecialValueFor("int_bonus")

		local e1 = ParticleManager:CreateParticle("particles/heroes/yukari/ability_yukari_04_magical.vpcf", PATTACH_CUSTOMORIGIN, caster)
		ParticleManager:SetParticleControl(e1, 0, vecPos)

		local e2 = ParticleManager:CreateParticle("particles/heroes/yukari/ability_yukari_04_magical.vpcf", PATTACH_CUSTOMORIGIN, caster)
		ParticleManager:SetParticleControl(e2, 0, vecPos)


		caster:EmitSound("Hero_Enigma.BlackHole.Cast.Chasm")
		caster:EmitSound("Hero_Enigma.Black_Hole")

		caster:SetContextThink(
			"yukari04_main_loop",
			function ()
				if GameRules:IsGamePaused() then return 0.03 end
				if caster:IsChanneling() then
					for i=1,keys.BarrageSpawnPoint do
						local radius=keys.MinRadius--+(keys.MaxRadius-keys.MinRadius)*(GameRules:GetGameTime()-channel_start_time)/ability:GetChannelTime()
						local radian=math.pi*2*(i/keys.BarrageSpawnPoint)+tick*rotate_speed
						local vecSpawn=caster:GetOrigin()+Vector(
							math.cos(radian)*radius,
							math.sin(radian)*radius,
							0)
						local vecEnd=caster:GetOrigin()+Vector(
							math.cos(radian+rotate_radian)*keys.MaxRadius,
							math.sin(radian+rotate_radian)*keys.MaxRadius,
							0)
						local distance=(vecEnd-vecSpawn):Length2D()
						local velocity=(vecEnd-vecSpawn):Normalized()*barrage_speed

						local projectileTable1 = {
						   	Ability=ability,
							EffectName=keys.EffectName,
							vSpawnOrigin=vecSpawn,
							fDistance=distance,
							fStartRadius=barrage_radius,
							fEndRadius=barrage_radius,
							Source=caster,
							bHasFrontalCone=false,
							bReplaceExisting=false,
							iUnittargetTeam=ability:GetAbilityTargetTeam(),
							iUnitTargetFlags=ability:GetAbilityTargetFlags(),
							iUnittargetType=ability:GetAbilityTargetType(),
							fExpireTime=GameRules:GetGameTime()+ability:GetChannelTime(),
							bDeleteOnHit=false,
							vVelocity=velocity,
							bProvidesVision=false,
						}
						ProjectileManager:CreateLinearProjectile(projectileTable1)

						local vecSpawn2=vecPos+Vector(
							math.cos(radian)*keys.MaxRadius,
							math.sin(radian)*keys.MaxRadius,
							0)
						local vecEnd2=vecPos+Vector(
							math.cos(radian+rotate_radian)*radius,
							math.sin(radian+rotate_radian)*radius,
							0)
						local velocity=(vecEnd2-vecSpawn2):Normalized()*barrage_speed

						local projectileTable2 = {
						   	Ability=ability,
							EffectName=keys.EffectName,
							vSpawnOrigin=vecSpawn2,
							fDistance=distance,
							fStartRadius=barrage_radius,
							fEndRadius=barrage_radius,
							Source=caster,
							bHasFrontalCone=false,
							bReplaceExisting=false,
							iUnittargetTeam=ability:GetAbilityTargetTeam(),
							iUnitTargetFlags=ability:GetAbilityTargetFlags(),
							iUnittargetType=ability:GetAbilityTargetType(),
							fExpireTime=GameRules:GetGameTime()+ability:GetChannelTime(),
							bDeleteOnHit=false,
							vVelocity=velocity,
							bProvidesVision=false,
						}
						ProjectileManager:CreateLinearProjectile(projectileTable2)

					end
					tick=tick+1
					return tick_interval
				else
					local Ability02=caster:FindAbilityByName("ability_thdots_yukari02")
					local teleport_radius=keys.MinRadius+(keys.MaxRadius-keys.MinRadius)*(GameRules:GetGameTime()-channel_start_time)/ability:GetChannelTime()
					local units=FindUnitsInRadius(
						caster:GetTeamNumber(),
						caster:GetOrigin(),
						nil,
						teleport_radius,
						DOTA_UNIT_TARGET_TEAM_BOTH,
						DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_HERO,
						DOTA_UNIT_TARGET_FLAG_NONE,
						FIND_ANY_ORDER,
						false)
					-- if #units > 0 then
					-- 	for i=1,#units do
					-- 		print_r(units)
					-- 		if units[i]:HasModifier("modifier_ability_thdots_kogasa04") then
					-- 			table.remove(units,i)
					-- 		end
					-- 	end
					-- end
					for _,u in pairs(units) do
						if Yukari_CanMovetoGap(u) and u:GetTeam()~=caster:GetTeam() and Ability02 then
							Ability02:ApplyDataDrivenModifier(caster,u,Yukari02_MODIFIER_HIDDEN_NAME,{Duration = -1})
							Ability02:ApplyDataDrivenModifier(caster,creep,anti_bd_modifier_name,{})
							--u:AddNewModifier(caster,ability,Yukari02_MODIFIER_HIDDEN_NAME,{})
						elseif u:IsControllableByAnyPlayer() and u:GetTeam()==caster:GetTeam() then
							local e3 = ParticleManager:CreateParticle("particles/heroes/yukari/ability_yukari_03_teleportflash.vpcf", PATTACH_CUSTOMORIGIN, caster)
							ParticleManager:SetParticleControl(e3, 0, caster:GetOrigin())

								FindClearSpaceForUnit(u,vecPos,true)

							local e4 = ParticleManager:CreateParticle("particles/heroes/yukari/ability_yukari_03_teleportflash2.vpcf", PATTACH_CUSTOMORIGIN, caster)
							ParticleManager:SetParticleControl(e4, 0, caster:GetOrigin())
						end
					end
					caster:StopSound("Hero_Enigma.BlackHole.Cast.Chasm")
					caster:StopSound("Hero_Enigma.Black_Hole")
					caster:EmitSound("Hero_Enigma.Black_Hole.Stop")
					ParticleManager:DestroyParticle(e1,true)
					ParticleManager:DestroyParticle(e2,true)

						local intdamage=caster:GetIntellect()*int_bonus
						local enemies=FindUnitsInRadius(
										caster:GetTeamNumber(),
										caster:GetOrigin(),
										nil,
										750,
										DOTA_UNIT_TARGET_TEAM_ENEMY,
										DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_CREEP,
										DOTA_UNIT_TARGET_FLAG_NONE,
										FIND_ANY_ORDER,
										false)
						for _,v in pairs(enemies) do
							damage_table={
								victim=v,
								attacker=caster,
								damage=intdamage,
								damage_type=DAMAGE_TYPE_MAGICAL,
							}
							UnitDamageTarget(damage_table)
							v:AddNewModifier( caster, self, "modifier_stunned", {Duration = ability:GetSpecialValueFor("stun_duration")} )
						end
						local pfx = ParticleManager:CreateParticle("particles/econ/items/death_prophet/death_prophet_ti9/death_prophet_silence_ti9.vpcf", PATTACH_CUSTOMORIGIN, nil)
						ParticleManager:SetParticleControl(pfx, 0, caster:GetAbsOrigin())
						ParticleManager:SetParticleControl(pfx, 1, Vector(wanbaochui_radius, 0, 1))
						ParticleManager:ReleaseParticleIndex(pfx)
					---end
					return nil
				end
			end,0)
	else
		caster:SetContextThink(
			"yukari04_end_channel",
			function ()
				if GameRules:IsGamePaused() then return 0.03 end
				caster:StopSound("Hero_Enigma.BlackHole.Cast.Chasm")
				caster:StopSound("Hero_Enigma.Black_Hole")
				ability:EndChannel(true)
				ability:RefundManaCost()
				ability:EndCooldown()
				return nil
			end,0)
	end
    local exradius=keys.BarrageRadius
	caster:SetContextThink(
			"yukari04_exdamage",
			function ()
				if GameRules:IsGamePaused() then return 0.03 end
				if caster:IsChanneling() and exradius < keys.MaxRadius then
					local targets = FindUnitsInRadius(
							caster:GetTeam(),		--caster team
							keys.target_points[1],		--find position
							nil,					--find entity
							exradius,		--find radius
							DOTA_UNIT_TARGET_TEAM_ENEMY,
							keys.ability:GetAbilityTargetType(),
							0,
							FIND_CLOSEST,
							false
						)
						exradius=exradius+25
						for _,v in pairs(targets) do
							local damage_table = {
								ability = keys.ability,
								victim = v,
								attacker = caster,
								damage = keys.Exdamage,
								damage_type = keys.ability:GetAbilityDamageType(),
								damage_flags = keys.ability:GetAbilityTargetFlags()
							}
							UnitDamageTarget(damage_table)
						end
				else
					return nil
				end
				return 0.1
			end,
	0)

end

function Yukari04_OnProjectileHitUnit(keys)
	local ability=keys.ability
	local caster=keys.caster
	local targets = keys.target_entities
	for _,v in pairs(targets) do
		local damage_table = {
			ability = keys.ability,
			victim = v,
			attacker = caster,
			damage = keys.BarrageDamage,
			damage_type = keys.ability:GetAbilityDamageType(),
			damage_flags = keys.ability:GetAbilityTargetFlags()
		}
		UnitDamageTarget(damage_table)
	end
end

ability_yukari_01 = {}

function ability_yukari_01:GetCastRange()
	return self:GetSpecialValueFor("cast_range")
end
