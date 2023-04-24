function Scepter2OnCreated(keys)
	-- bane A杖大招会卡顿，移除A杖效果
	-- if keys.caster:GetUnitName() ~= "npc_dota_hero_bane" then
	-- end
	-- add modifier_item_ultimate_scepter after 0.1s
	Timers:CreateTimer(0.1, function()
		keys.caster:AddNewModifier(keys.caster, nil, "modifier_item_ultimate_scepter", {duration = -1})
	end)
end

--[[ ============================================================================================================
	Author: Rook
	Date: January 26, 2015
	Called when Aghanim's Regalia is sold or dropped.  Removes the stock Aghanim's Scepter modifier if no other
	Aghanim's Scepter exist in the player's inventory.
================================================================================================================= ]]
function Scepter2OnDestroy(keys)
	Timers:CreateTimer(0.1, function()
		local num_scepters_in_inventory = 0
		for i=0, 5, 1 do --Search for Aghanim's Regalia in the player's inventory.
			local current_item = keys.caster:GetItemInSlot(i)
			if current_item ~= nil then
				local item_name = current_item:GetName()

				if item_name == "item_ultimate_scepter_2" or item_name == "item_ultimate_scepter" then
					num_scepters_in_inventory = num_scepters_in_inventory + 1
				end
			end
		end
		--Remove the stock Aghanim's Scepter modifier if the player no longer has a Scepter in their inventory.
		if num_scepters_in_inventory == 0 and keys.caster:HasModifier("modifier_item_ultimate_scepter") and not keys.caster:HasModifier("modifier_item_ultimate_scepter_2_consumed") then
			keys.caster:RemoveModifierByName("modifier_item_ultimate_scepter")
		end
	end)
end

--[[	Author: Hewdraw
		Date: 17.05.2015	]]
function Scepter2OnSpell(keys)
	if keys.caster:IsRealHero() and keys.target:IsRealHero() and not keys.caster:HasModifier("modifier_arc_warden_tempest_double") and not keys.target:HasModifier("modifier_arc_warden_tempest_double") and not keys.target:HasModifier(keys.modifier) then
		if keys.target:HasModifier("modifier_item_ultimate_scepter") then
			keys.target:RemoveModifierByName("modifier_item_ultimate_scepter")
		end
		keys.target:AddNewModifier(keys.caster, nil, "modifier_item_ultimate_scepter", {duration = -1})
		-- if keys.target:GetUnitName() ~= "npc_dota_hero_bane" then
		-- end
		keys.target:AddNewModifier(keys.caster, keys.ability, keys.modifier, {})

		keys.target:EmitSound("Hero_Alchemist.Scepter.Cast")
		keys.caster:RemoveItem(keys.ability)
	end
end

LinkLuaModifier("modifier_item_ultimate_scepter_2_consumed", "items/item_ultimate_scepter_2.lua", LUA_MODIFIER_MOTION_NONE)

if modifier_item_ultimate_scepter_2_consumed == nil then modifier_item_ultimate_scepter_2_consumed = class({}) end

function modifier_item_ultimate_scepter_2_consumed:RemoveOnDeath() return false end
function modifier_item_ultimate_scepter_2_consumed:IsPurgable() return false end
function modifier_item_ultimate_scepter_2_consumed:IsPermanent() return true end

function modifier_item_ultimate_scepter_2_consumed:OnCreated()
	if self:GetAbility() then
		self.bonus_health = self:GetAbility():GetSpecialValueFor("bonus_health")
		self.bonus_mana = self:GetAbility():GetSpecialValueFor("bonus_mana")
		self.spell_amp = self:GetAbility():GetSpecialValueFor("spell_amp")
	end
end

function modifier_item_ultimate_scepter_2_consumed:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_HEALTH_BONUS,
		MODIFIER_PROPERTY_MANA_BONUS,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_item_ultimate_scepter_2_consumed:GetModifierHealthBonus()
	return self.bonus_health
end

function modifier_item_ultimate_scepter_2_consumed:GetModifierManaBonus()
	return self.bonus_mana
end

function modifier_item_ultimate_scepter_2_consumed:GetModifierSpellAmplify_Percentage()
	return self.spell_amp
end

function modifier_item_ultimate_scepter_2_consumed:AllowIllusionDuplicate()
	return false
end

function modifier_item_ultimate_scepter_2_consumed:GetTexture()
	return "item_ultimate_regalia"
end
