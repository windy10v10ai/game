function OnSpellStart(keys)
	local caster = keys.caster
	local target = keys.target
	if not target or target:IsNull() or not target:IsAlive() then
		return
	end
	-- 播放音效
	target:EmitSound("Hero_DrowRanger.Multishot")
	local interval = keys.interval or 0
	if interval == 0 then
		interval = 0.1
	end
	local shots = keys.shots or 2
	if shots == 0 then
		shots = 2
	end
	local shot_count = 0
	Timers:CreateTimer(interval, function()
		if caster:IsAlive() then
			caster:PerformAttack(target, true, true, true, false, true, false, true)
			shot_count = shot_count + 1
			if shot_count >= shots then
				return nil
			end
		else
			return nil
		end
		return interval
	end)
	return nil
end
