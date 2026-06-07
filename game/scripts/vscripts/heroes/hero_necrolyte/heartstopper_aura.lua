function HeartstopperAura(keys)
	local caster = keys.caster
	local ability = keys.ability
	local target = keys.target
	local target_max_hp = target:GetMaxHealth() / 100
	local aura_damage = ability:GetLevelSpecialValueFor("aura_damage", (ability:GetLevel() - 1))
	local aura_damage_interval = ability:GetLevelSpecialValueFor("aura_damage_interval", (ability:GetLevel() - 1))

	-- aura_damage 语义为每秒最大生命百分比，乘间隔摊到每跳
	local base_damage = target_max_hp * aura_damage * aura_damage_interval

	-- Check for scepter upgrade and add health regen to damage
	if caster:HasScepter() then
		local heal_regen_to_damage = ability:GetSpecialValueFor("heal_regen_to_damage")
		local caster_health_regen = caster:GetHealthRegen()
		-- print("helthregen", caster_health_regen)
		local regen_damage = caster_health_regen * (heal_regen_to_damage / 100) * aura_damage_interval
		-- print("helthregen", base_damage, heal_regen_to_damage, aura_damage_interval, regen_damage)
		base_damage = base_damage + regen_damage
	end

	local damage_table = {}
	damage_table.attacker = caster
	damage_table.victim = target
	damage_table.damage_type = DAMAGE_TYPE_MAGICAL
	damage_table.ability = ability
	damage_table.damage = base_damage

	ApplyDamage(damage_table)

	-- 定期刷新光环修饰符以更新范围（修复：使用caster存储timer）
	if not caster.heartstopper_refresh_timer then
		caster.heartstopper_refresh_timer = true
		Timers:CreateTimer(2.0, function()
			-- 移除旧的光环修饰符
			caster:RemoveModifierByName("modifier_heartstopper_aura_datadriven")
			-- 重新应用光环修饰符
			ability:ApplyDataDrivenModifier(caster, caster, "modifier_heartstopper_aura_datadriven", {})
			-- print("refresh")
			return 2.0 -- 每秒刷新一次
		end)
	end
end
