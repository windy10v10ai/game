-- Extension of CDOTA_BaseNPC class.

-- Deprecated
-- some of the code is based on yahnich's version of Boss Hunters illusion system




function CDOTA_BaseNPC:EmitCasterSound(sCasterName, tSoundNames, fChancePct, flags, fCooldown, sCooldownindex)
	flags = flags or 0
	if self:GetName() ~= sCasterName then
		return true
	end
	
	if fCooldown then
		if self[sCooldownindex] then
			return true
		else
			self[sCooldownindex] = true
			Timers:CreateTimer(fCooldown, function()
				self[sCooldownindex] = nil
			end)
		end
	end

	if fChancePct then
		if fChancePct <= math.random(1,100) then
			return false -- Only return false if chance was missed
		end
	end
	if (bit.band(flags, DOTA_CAST_SOUND_FLAG_WHILE_DEAD) > 0) or self:IsAlive() then
		local sound = tSoundNames[math.random(1,#tSoundNames)]
		if bit.band(flags, DOTA_CAST_SOUND_FLAG_BOTH_TEAMS) > 0 then
			self:EmitSound(sound)
		--elseif bit.band(flags, DOTA_CAST_SOUND_FLAG_GLOBAL) > 0 then
			-- Iterate through players, added later
		else
			StartSoundEventReliable(sound, self)
		end
	end
	return true
end






-- Talent handling
function CDOTA_BaseNPC:HasTalent(talentName)
	if self and not self:IsNull() and self:HasAbility(talentName) then
		if self:FindAbilityByName(talentName):GetLevel() > 0 then return true end
	end
	return false
end

function CDOTA_BaseNPC:FindTalentValue(talentName, key)
	if self:HasAbility(talentName) then
		local value_name = key or "value"
		return self:FindAbilityByName(talentName):GetSpecialValueFor(value_name)
	end
	return 0
end

function CDOTABaseAbility:GetTalentSpecialValueFor(value)
	local base = self:GetSpecialValueFor(value)
	local talentName
	local kv = self:GetAbilityKeyValues()
	for k,v in pairs(kv) do -- trawl through keyvalues
		if k == "AbilitySpecial" then
			for l,m in pairs(v) do
				if m[value] then
					talentName = m["LinkedSpecialBonus"]
				end
			end
		end
	end
	if talentName then 
		local talent = self:GetCaster():FindAbilityByName(talentName)
		if talent and talent:GetLevel() > 0 then base = base + talent:GetSpecialValueFor("value") end
	end
	return base
end




