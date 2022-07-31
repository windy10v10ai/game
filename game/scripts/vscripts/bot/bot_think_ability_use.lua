--------------------
-- Initial
--------------------
if BotAbilityThink == nil then
	print("Bot Ability Think initialize!")
	_G.BotAbilityThink = class({}) -- put in the global scope
end

--------------------
-- Ability Common
--------------------
function BotAbilityThink:CastAbilityOnEnemyTarget(hHero, hAbility)
	if hAbility:IsFullyCastable() then
		local iRange = hAbility:GetCastRange()
		local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
		if #tAllHeroes > 0 then
			hHero:CastAbilityOnTarget(tAllHeroes[1], hAbility, hHero:GetPlayerOwnerID())
			return true
		end
	end
	return false
end

function BotAbilityThink:CastAbilityOnEnemyPostion(hHero, hAbility)
	if hAbility:IsFullyCastable() then
		local iRange = hAbility:GetCastRange()
		local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
		if #tAllHeroes > 0 then
			hHero:CastAbilityOnPosition(tAllHeroes[1]:GetOrigin(), hAbility, hHero:GetPlayerOwnerID())
			return true
		end
	end
	return false
end

function BotAbilityThink:CastAbilityOnFriendTarget(hHero, hAbility)
	if hAbility:IsFullyCastable() then
		local iRange = hAbility:GetCastRange()
		local tAllHeroes = BotThink:FindFriendHeroesInRangeAndVisible(hHero, iRange)
		if #tAllHeroes > 0 then
			hHero:CastAbilityOnTarget(tAllHeroes[1], hAbility, hHero:GetPlayerOwnerID())
			return true
		end
	end
	return false
end

--------------------
-- Ability Think
--------------------
function BotAbilityThink:ThinkUseAbility(hHero)
	if not hHero then
		return
	end

	-- Get hero name
	local sHeroName = hHero:GetName()

	if sHeroName == "npc_dota_hero_axe" then
		self:ThinkUseAbility_Axe(hHero)
	elseif sHeroName == "npc_dota_hero_earthshaker" then
		self:ThinkUseAbility_EarthShaker(hHero)
	elseif sHeroName == "npc_dota_hero_phantom_assassin" then
		self:ThinkUseAbility_PhantomAssassin(hHero)
	elseif sHeroName == "npc_dota_hero_zuus" then
		self:ThinkUseAbility_Zuus(hHero)
	elseif sHeroName == "npc_dota_hero_viper" then
		self:ThinkUseAbility_Viper(hHero)
	elseif sHeroName == "npc_dota_hero_juggernaut" then
		self:ThinkUseAbility_Juggernaut(hHero)
	elseif sHeroName == "npc_dota_hero_sniper" then
		self:ThinkUseAbility_Sniper(hHero)
	elseif sHeroName == "npc_dota_hero_kunkka" then
		self:ThinkUseAbility_Kunkka(hHero)
	elseif sHeroName == "npc_dota_hero_ogre_magi" then
		self:ThinkUseAbility_OgreMagi(hHero)
	elseif sHeroName == "npc_dota_hero_shadow_shaman" then
		self:ThinkUseAbility_ShadowShaman(hHero)
	elseif sHeroName == "npc_dota_hero_abaddon" then
		self:ThinkUseAbility_Abaddon(hHero)
	elseif sHeroName == "npc_dota_hero_meepo" then
		self:ThinkUseAbility_Meepo(hHero)
	end
end

function BotAbilityThink:ThinkUseAbility_Axe(hHero)
	local hAbility1 = hHero:GetAbilityByIndex(0)
	local hAbility2 = hHero:GetAbilityByIndex(1)
	local hAbility6 = hHero:GetAbilityByIndex(5)

	local iThreshold = hAbility6:GetSpecialValueFor("kill_threshold")
	if hAbility6:IsFullyCastable() then
		local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, hAbility6:GetCastRange()+150, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_ANY_ORDER, false)

		for i, v in ipairs(tAllHeroes) do
			if v:GetHealth() < iThreshold then
				hHero:CastAbilityOnTarget(v, hAbility6, hHero:GetPlayerOwnerID())
				hHero.IsCasting = true
				return
			end
		end
	end
	if hAbility1:IsFullyCastable() then
		local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, hAbility1:GetSpecialValueFor("radius"), DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_ANY_ORDER, false)
		local iCount = #tAllHeroes
		for i = 1, iCount do
			if tAllHeroes[iCount+1-i]:IsStunned() or tAllHeroes[iCount+1-i]:IsHexed() or tAllHeroes[iCount+1-i]:IsInvisible() then table.remove(tAllHeroes, iCount+1-i) end
		end

		if #tAllHeroes > 0 then
			hHero:CastAbilityNoTarget(hAbility1, hHero:GetPlayerOwnerID())
			return
		end
	end
	if hAbility2:IsFullyCastable() then
		local iRange = hAbility2:GetCastRange()
		local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
		for i, v in ipairs(tAllHeroes) do
			hHero:CastAbilityOnTarget(v, hAbility2, hHero:GetPlayerOwnerID())
			return
		end
	end
end

function BotAbilityThink:ThinkUseAbility_EarthShaker(hHero)
	local hAbility2 = hHero:GetAbilityByIndex(1)

	if hAbility2:IsFullyCastable() then

        local iRange = 300
        local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
        if #tAllHeroes > 0 then
            if hHero:HasModifier("modifier_item_ultimate_scepter") then
                hHero:CastAbilityOnTarget(hHero, hAbility2, hHero:GetPlayerOwnerID())
            else
                hHero:CastAbilityNoTarget(hAbility2, hHero:GetPlayerOwnerID())
            end
            return true
        end
	end
end

function BotAbilityThink:ThinkUseAbility_PhantomAssassin(hHero)
	local hAbility3 = hHero:GetAbilityByIndex(2)
	local hAbility4 = hHero:GetAbilityByIndex(3)

	if hHero:HasModifier("modifier_item_ultimate_scepter") then
		if hAbility3:IsFullyCastable() and (not hHero:HasModifier("modifier_phantom_assassin_blur_active")) then
			hHero:CastAbilityNoTarget(hAbility3, hHero:GetPlayerOwnerID())
			return true
		end

		if hAbility4:IsFullyCastable() then
			local iRange = hAbility4:GetSpecialValueFor("radius")
			local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
			if #tAllHeroes > 0 then
				hHero:CastAbilityNoTarget(hAbility4, hHero:GetPlayerOwnerID())
				return true
			end
		end
	end
end

function BotAbilityThink:ThinkUseAbility_Zuus(hHero)
	local hAbility4 = hHero:GetAbilityByIndex(3)

	if hHero:HasModifier("modifier_item_ultimate_scepter") then
		if hAbility4:IsFullyCastable() then
			local iRange = 3000
			local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_FARTHEST, false)
			if #tAllHeroes > 0 then
				hHero:CastAbilityOnPosition(tAllHeroes[1]:GetOrigin(), hAbility4, hHero:GetPlayerOwnerID())
				return true
			end
		end
	end
end

function BotAbilityThink:ThinkUseAbility_Viper(hHero)
	local hAbility2 = hHero:GetAbilityByIndex(1)

	if hAbility2:IsFullyCastable() then
        local iRange = hAbility2:GetCastRange()
        local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
        if #tAllHeroes > 0 then
			hHero:CastAbilityOnPosition(tAllHeroes[1]:GetOrigin(), hAbility2, hHero:GetPlayerOwnerID())
            return true
        end
	end
end

function BotAbilityThink:ThinkUseAbility_Juggernaut(hHero)
	local hAbility4 = hHero:GetAbilityByIndex(3)

	if hHero:HasModifier("modifier_item_ultimate_scepter") then
		if hAbility4:IsFullyCastable() then
			local iRange = hAbility4:GetCastRange()
			local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_CLOSEST, false)
			if #tAllHeroes > 0 then
				hHero:CastAbilityOnTarget(tAllHeroes[1], hAbility4, hHero:GetPlayerOwnerID())
				return
			end
		end
	end
end

function BotAbilityThink:ThinkUseAbility_Sniper(hHero)
	local hAbility5 = hHero:GetAbilityByIndex(4)

	if hHero:HasModifier("modifier_item_ultimate_scepter") then
		if hAbility5:IsFullyCastable() then
			local iRange = hAbility5:GetCastRange()
			local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_FARTHEST, false)
			if #tAllHeroes > 0 then
				hHero:CastAbilityOnTarget(tAllHeroes[1], hAbility5, hHero:GetPlayerOwnerID())
				return
			end
		end
	end
end

function BotAbilityThink:ThinkUseAbility_Kunkka(hHero)
	local hAbility4 = hHero:GetAbilityByIndex(3)
	local hAbility5 = hHero:GetAbilityByIndex(4)

	-- kunkka_torrent_storm
	if hAbility4:IsFullyCastable() then
        local iRange = 900
        local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
		-- 范围内有两人以上时释放
        if #tAllHeroes > 1 then
			hHero:CastAbilityNoTarget(hAbility4, hHero:GetPlayerOwnerID())
            return true
        end
	end
	if hAbility5:IsFullyCastable() then
        local iRange = 900
        local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
        if #tAllHeroes > 0 then
			hHero:CastAbilityOnPosition(tAllHeroes[1]:GetOrigin(), hAbility5, hHero:GetPlayerOwnerID())
            return true
        end
	end
end

function BotAbilityThink:ThinkUseAbility_OgreMagi(hHero)
	local hAbility1 = hHero:GetAbilityByIndex(0)
	local hAbility2 = hHero:GetAbilityByIndex(1)
	local hAbility3 = hHero:GetAbilityByIndex(2)
	local hAbility4 = hHero:GetAbilityByIndex(3)
	local hAbility5 = hHero:GetAbilityByIndex(4)
	if self:CastAbilityOnEnemyTarget(hHero, hAbility1) then return true end
	if self:CastAbilityOnEnemyTarget(hHero, hAbility2) then return true end
	-- set hAbility3 auto cast
	if hAbility3:IsFullyCastable() then
		if hAbility3:GetAutoCastState() == false then
			hAbility3:ToggleAutoCast()
		end
	end
	if self:CastAbilityOnEnemyTarget(hHero, hAbility4) then return true end

	-- cast on teammate
	if hAbility5:IsFullyCastable() then
        local iRange = 900
        local tAllHeroes = BotThink:FindFriendHeroesInRangeAndVisible(hHero, iRange)
		local iCount = #tAllHeroes
		for i = 1, iCount do
			if tAllHeroes[iCount+1-i]:HasModifier("modifier_ogre_magi_smash_buff") then table.remove(tAllHeroes, iCount+1-i) end
		end
        if #tAllHeroes > 0 then
			hHero:CastAbilityOnPosition(tAllHeroes[1]:GetOrigin(), hAbility5, hHero:GetPlayerOwnerID())
            return true
        end
	end
end

function BotAbilityThink:ThinkUseAbility_ShadowShaman(hHero)
	local hAbility1 = hHero:GetAbilityByIndex(0)
	local hAbility2 = hHero:GetAbilityByIndex(1)
	local hAbility3 = hHero:GetAbilityByIndex(2)
	local hAbility6 = hHero:GetAbilityByIndex(5)
	if self:CastAbilityOnEnemyTarget(hHero, hAbility2) then return true end
	if self:CastAbilityOnEnemyTarget(hHero, hAbility1) then return true end
	if self:CastAbilityOnEnemyPostion(hHero, hAbility6) then return true end
	if self:CastAbilityOnEnemyTarget(hHero, hAbility3) then return true end
end

function BotAbilityThink:ThinkUseAbility_Abaddon(hHero)
	local hAbility1 = hHero:GetAbilityByIndex(0)
	local hAbility2 = hHero:GetAbilityByIndex(1)
	if self:CastAbilityOnEnemyTarget(hHero, hAbility1) then return true end

	if hAbility2:IsFullyCastable() then
		local iRange = hAbility2:GetCastRange()
		local tAllHeroes = BotThink:FindFriendHeroesInRangeAndVisible(hHero, iRange)
		-- for each teammate, check if he has 90% hp or less, if so, cast on him
		for i = 1, #tAllHeroes do
			if tAllHeroes[i]:GetHealthPercent() <= 90 then
				hHero:CastAbilityOnTarget(tAllHeroes[i], hAbility2, hHero:GetPlayerOwnerID())
				return true
			end
		end
	end
end

function BotAbilityThink:ThinkUseAbility_Meepo(hHero)
	if hHero:HasModifier("modifier_miku_dance") then return end
	if hHero:HasModifier("modifier_get_down") then return end

	local hAbility1 = hHero:GetAbilityByIndex(0)
	local hAbility3 = hHero:GetAbilityByIndex(2)
	local hAbility4 = hHero:GetAbilityByIndex(3)
	local hAbility5 = hHero:GetAbilityByIndex(4)
	local hAbility6 = hHero:GetAbilityByIndex(5)

	if hAbility1:IsFullyCastable() then
		local iRange = 900
		local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
		if #tAllHeroes > 0 then
			hHero:CastAbilityOnPosition(tAllHeroes[1]:GetOrigin(), hAbility1, hHero:GetPlayerOwnerID())
			return true
		end
	end
	if hAbility3:IsFullyCastable() then
		local iRange = 900
		local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
		if #tAllHeroes > 0 then
			hHero:CastAbilityOnTarget(tAllHeroes[1], hAbility3, hHero:GetPlayerOwnerID())
			return true
		end
	end

	if hHero:HasModifier("modifier_chibi_monster") then
		if hAbility6 and hAbility6:IsFullyCastable() then
			local iRange = 400
			local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
			if #tAllHeroes > 0 then
				hHero:CastAbilityOnTarget(tAllHeroes[1], hAbility6, hHero:GetPlayerOwnerID())
				return true
			end
		end
	else
		if hAbility6 and hAbility6:IsFullyCastable() then
			local iRange = 800
			local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
			if #tAllHeroes > 0 then
				hHero:CastAbilityNoTarget(hAbility6, hHero:GetPlayerOwnerID())
				return true
			end
		end
	end

	if hAbility4:IsFullyCastable() or hAbility5:IsFullyCastable() then
		local iRange = 600
		local tAllHeroes = BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
		-- 范围内有两人以上时跳舞
		 if #tAllHeroes > 1 then
			if hAbility4:IsFullyCastable() then
				hHero:CastAbilityNoTarget(hAbility4, hHero:GetPlayerOwnerID())
				return true
			end
			if hAbility5:IsFullyCastable() then
				hHero:CastAbilityNoTarget(hAbility5, hHero:GetPlayerOwnerID())
				return true
			end
		end
	end
end
