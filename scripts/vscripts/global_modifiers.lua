local StackToPercentage = function (iStackCount)
	if iStackCount == 1 then
		return 0.5
	elseif iStackCount == 2 then
		return 0.75
	elseif iStackCount == 4 then
		return 1.25
	elseif iStackCount == 5 then
		return 1.5
	elseif iStackCount == 6 then
		return 1.75
	elseif iStackCount == 7 then
		return 2.0
	elseif iStackCount == 8 then
		return 3.0
	elseif iStackCount == 9 then
		return 4.0
	elseif iStackCount == 10 then
		return 5.0
	else
		return 1.0
	end
end


modifier_courier_speed = class({})

function modifier_courier_speed:IsPurgable() return false end
function modifier_courier_speed:IsHidden() return true end
function modifier_courier_speed:RemoveOnDeath() return false end

function modifier_courier_speed:CheckState() return {[MODIFIER_STATE_INVULNERABLE] = true} end

function modifier_courier_speed:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_MAX,
		MODIFIER_PROPERTY_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE
	}
end

function modifier_courier_speed:GetModifierMoveSpeed_Max()
	return 3000
end

function modifier_courier_speed:GetModifierMoveSpeed_Limit()
	return 3000
end

function modifier_courier_speed:GetModifierMoveSpeed_Absolute()
	return 3000
end


modifier_melee_resistance = class({})

function modifier_melee_resistance:IsPurgable() return false end
function modifier_melee_resistance:RemoveOnDeath() return false end
function modifier_melee_resistance:GetTexture() return "bulldozer" end

function modifier_melee_resistance:OnCreated()
	self.iStatusResist = 20
	self.iMagicalResist = 12
end

function modifier_melee_resistance:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS
	}
end

function modifier_melee_resistance:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_melee_resistance:GetModifierMagicalResistanceBonus()
	return self.iMagicalResist
end

modifier_bot_attack_tower_pick_rune = class({})

function modifier_bot_attack_tower_pick_rune:IsPurgable() return false end
function modifier_bot_attack_tower_pick_rune:IsHidden() return true end
function modifier_bot_attack_tower_pick_rune:RemoveOnDeath() return false end

function modifier_bot_attack_tower_pick_rune:OnCreated()
	if IsClient() then return end
	self:StartIntervalThink(2)
end

-- bot strategy
-- 机器人策略
function modifier_bot_attack_tower_pick_rune:OnIntervalThink()
	if IsClient() then return end

	local GameTime = GameRules:GetDOTATime(false, false)
	if (GameTime >= (50 * 60)) then						-- LATEGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(false)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
	elseif (GameTime >= (18 * 60)) then					-- LATEGAME
		if AIGameMode.barrackKilledCount and AIGameMode.barrackKilledCount > 2 then
			GameRules:GetGameModeEntity():SetBotsInLateGame(true)
			GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(false)
			if AIGameMode.barrackKilledCount > 5 then
				GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
			else
				GameRules:GetGameModeEntity():SetBotsMaxPushTier(5)
			end
		end
	elseif (GameTime >= (16 * 60)) then						-- MIDGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(false)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(4)
	elseif (GameTime >= (14 * 60)) then						-- MIDGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(3)
	elseif (GameTime >= (10 * 60)) then						-- MIDGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(2)
	else													-- EARLYGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(false)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(1)
	end

	local hParent = self:GetParent()

	BotThink:ThinkSell(hParent)
	BotThink:ThinkPurchase(hParent)
	BotThink:ThinkPurchaseNeutral(hParent, GameTime)

	BotThink:ThinkConsumeItem(hParent)
	BotThink:AddMoney(hParent)
end


modifier_tower_heal = class({})

function modifier_tower_heal:IsPurgable() return false end
function modifier_tower_heal:IsHidden() return true end
function modifier_tower_heal:IsDebuff() return false end

function modifier_tower_heal:DeclareFunctions() return {MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT} end

function modifier_tower_heal:GetModifierConstantHealthRegen()
	return self:GetStackCount()
end


modifier_tower_endure = class({})

function modifier_tower_endure:IsPurgable() return false end
function modifier_tower_endure:IsDebuff() return false end
function modifier_tower_endure:GetTexture() return "tower_endure" end

function modifier_tower_endure:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
		MODIFIER_PROPERTY_TOOLTIP
	}
end

function modifier_tower_endure:OnCreated()
	if IsClient() then return end
	local hParent = self:GetParent()
	local iHealth = hParent:GetMaxHealth()
	local newHealth
	if hParent:GetTeamNumber() == DOTA_TEAM_GOODGUYS then
		newHealth = math.floor(StackToPercentage(AIGameMode.iRadiantTowerEndure)*iHealth)
	elseif hParent:GetTeamNumber() == DOTA_TEAM_BADGUYS then
		newHealth = math.floor(StackToPercentage(AIGameMode.iDireTowerEndure)*iHealth)
	end
	Timers:CreateTimer(0.04, function ()
		hParent:SetMaxHealth( newHealth )
		hParent:SetBaseMaxHealth( newHealth )
		hParent:SetHealth( newHealth )
	end)
end

function modifier_tower_endure:GetModifierPhysicalArmorBonus()
	local sName = self:GetParent():GetName()
	local sArmor = self:GetParent():GetPhysicalArmorBaseValue()
	local fPercent = StackToPercentage(self:GetStackCount())

	return math.floor(sArmor*(fPercent-1))
end

function modifier_tower_endure:OnTooltip()
	return 100*StackToPercentage(self:GetStackCount())
end


modifier_tower_power = class({})

function modifier_tower_power:IsPurgable() return false end
function modifier_tower_power:IsDebuff() return false end
function modifier_tower_power:GetTexture() return "tower_power" end

function modifier_tower_power:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE,
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end


function modifier_tower_power:GetModifierAttackSpeedBonus_Constant()
	local fPower = StackToPercentage(self:GetStackCount())
	if fPower <= 1.0 then return 0 end
	return math.floor(500/9*(fPower-1))
end

function modifier_tower_power:GetModifierBaseDamageOutgoing_Percentage()
	return 100*StackToPercentage(self:GetStackCount())-100
end



modifier_axe_thinker = class({})

function modifier_axe_thinker:IsPurgable() return false end
function modifier_axe_thinker:IsHidden() return true end
function modifier_axe_thinker:RemoveOnDeath() return false end
function modifier_axe_thinker:OnCreated()
	if IsClient() then return end
	self:StartIntervalThink(0.1)
end

function modifier_axe_thinker:DeclareFunctions() return {MODIFIER_EVENT_ON_ABILITY_EXECUTED} end

local function ThinkForAxeAbilities(hAxe)
	local hAbility1 = hAxe:GetAbilityByIndex(0)
	local hAbility2 = hAxe:GetAbilityByIndex(1)
	local hAbility6 = hAxe:GetAbilityByIndex(5)
	if hAxe:IsSilenced() or hAxe:IsStunned() or hAbility1:IsInAbilityPhase() or hAbility2:IsInAbilityPhase() or hAbility6:IsInAbilityPhase() then return end
	local iRange2 = hAbility2:GetCastRange()
	local iThreshold = hAbility6:GetSpecialValueFor("kill_threshold")
	if hAbility6:IsFullyCastable() then
		local tAllHeroes = FindUnitsInRadius(hAxe:GetTeam(), hAxe:GetOrigin(), nil, hAbility6:GetCastRange()+150, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_ANY_ORDER, false)

		for i, v in ipairs(tAllHeroes) do
			if v:GetHealth() < iThreshold then
				hAxe:CastAbilityOnTarget(v, hAbility6, hAxe:GetPlayerOwnerID())
				hAxe.IsCasting = true
				return
			end
		end
	end
	if hAbility1:IsFullyCastable() then
		local tAllHeroes = FindUnitsInRadius(hAxe:GetTeam(), hAxe:GetOrigin(), nil, hAbility1:GetSpecialValueFor("radius"), DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_ANY_ORDER, false)
		local iCount = #tAllHeroes
		for i = 1, iCount do
			if tAllHeroes[iCount+1-i]:IsStunned() or tAllHeroes[iCount+1-i]:IsHexed() or tAllHeroes[iCount+1-i]:IsInvisible() then table.remove(tAllHeroes, iCount+1-i) end
		end

		if #tAllHeroes > 0 then
			hAxe:CastAbilityNoTarget(hAbility1, hAxe:GetPlayerOwnerID())
			return
		end
	end
	if hAbility2:IsFullyCastable() then
		local tAllHeroes = FindUnitsInRadius(hAxe:GetTeam(), hAxe:GetOrigin(), nil, hAbility2:GetCastRange(), DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_ANY_ORDER, false)
		for i, v in ipairs(tAllHeroes) do
			hAxe:CastAbilityOnTarget(v, hAbility2, hAxe:GetPlayerOwnerID())
			return
		end
	end
end

function modifier_axe_thinker:OnIntervalThink()
	if IsClient() then return end
	ThinkForAxeAbilities(self:GetParent())
end


modifier_sniper_assassinate_thinker = class({})

function modifier_sniper_assassinate_thinker:IsHidden() return true end
function modifier_sniper_assassinate_thinker:IsPurgable() return false end
function modifier_sniper_assassinate_thinker:RemoveOnDeath() return false end

function modifier_sniper_assassinate_thinker:OnCreated()
	self:StartIntervalThink(0.1)
end

function modifier_sniper_assassinate_thinker:OnIntervalThink()
	if IsClient() then return end
	local hParent = self:GetParent()
	local hAssassinate = hParent:FindAbilityByName("sniper_assassinate")
	local hAssassinateUpgrade = hParent:FindAbilityByName("sniper_assassinate_upgrade")
	local iLevel = hAssassinate:GetLevel()
	local iUpgradeLevel = hAssassinateUpgrade:GetLevel()

	if hParent:HasScepter() then
		if hAssassinateUpgrade:IsHidden() then
			hAssassinateUpgrade:SetHidden(false)
		end

		if iUpgradeLevel < iLevel then
			hAssassinateUpgrade:SetLevel(iLevel)
		elseif iUpgradeLevel > iLevel then
			hAssassinate:SetLevel(iUpgradeLevel)
		end
	end

	if not hParent:HasScepter() and not hAssassinateUpgrade:IsHidden() then
		hAssassinateUpgrade:SetHidden(true)
	end
end


modifier_sniper_assassinate_target = class({})

function modifier_sniper_assassinate_target:IsPurgable() return false end
function modifier_sniper_assassinate_target:DeclareFunctions() return {MODIFIER_EVENT_ON_DEATH} end

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

function modifier_sniper_assassinate_target:CheckState() return {[MODIFIER_STATE_INVISIBLE] = false, [MODIFIER_STATE_PROVIDES_VISION] = true} end

function modifier_sniper_assassinate_target:OnCreated()
	self.iParticle = ParticleManager:CreateParticleForTeam("particles/econ/items/sniper/sniper_charlie/sniper_crosshair_charlie.vpcf", PATTACH_OVERHEAD_FOLLOW, self:GetParent(), self:GetCaster():GetTeamNumber())
end

function modifier_sniper_assassinate_target:OnDestroy()
	ParticleManager:DestroyParticle(self.iParticle, true)
end


modifier_assassinate_caster_crit = class({})

function modifier_assassinate_caster_crit:DeclareFunctions() return {MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE} end

function modifier_assassinate_caster_crit:GetModifierPreAttack_CriticalStrike() return self:GetAbility():GetSpecialValueFor("scepter_crit_bonus") end


modifier_out_of_world = class({})

function modifier_out_of_world:IsDebuff() return false end

function modifier_out_of_world:CheckState()
	return {
		[MODIFIER_STATE_INVULNERABLE] = true,
		[MODIFIER_STATE_UNSELECTABLE] = true,
		[MODIFIER_STATE_NOT_ON_MINIMAP] = true,
		[MODIFIER_STATE_NO_UNIT_COLLISION] = true,
		[MODIFIER_STATE_NO_HEALTH_BAR] = true,
	}
end
