--[[ items.lua ]]

function AIGameMode:SpecialItemAdd(owner)
	local tier = {}

	tier[1] =	{
		"item_ironwood_tree",			-- 铁树之木
		"item_ocean_heart",				-- 海洋之心
		"item_broom_handle",			-- 扫帚柄
		"item_trusty_shovel",			-- 可靠铁铲
		"item_faded_broach",			-- 暗淡胸针
		"item_arcane_ring",				-- 奥术指环
		"item_winter_embrace",
		"item_ogre_seal_totem",
		"item_oblivions_locket",
		"item_precious_egg",
		"item_mysterious_hat",
		"item_possessed_mask",
		"item_chipped_vest",
		"item_grove_bow",
		"item_ring_of_aquila",
		"item_pupils_gift",
		"item_imp_claw",
		"item_misericorde",
		"item_philosophers_stone",
		"item_nether_shawl",
		"item_dragon_scale",
		"item_essence_ring",
		"item_vambrace",
		"item_dimensional_doorway",
		"item_ambient_sorcery",
		"item_bear_cloak",
		"item_bogduggs_baldric",
		"item_bogduggs_cudgel",
		"item_bogduggs_lucky_femur",
		"item_lifestone",
		"item_pelt_of_the_old_wolf",
		"item_sign_of_the_arachnid",
		"item_quicksilver_amulet",
		"item_bullwhip",
		"item_paintball",
	}

	tier[2] =	{
		"item_quickening_charm",
		"item_mind_breaker",
		"item_spider_legs",
		"item_enchanted_quiver",
		"item_paladin_sword",
		"item_orb_of_destruction",
		"item_black_powder_bag",
		"item_titan_sliver",
		"item_horizon",					-- 视界
		"item_gravel_foot",
		"item_preserved_skull",
		"item_slippers_of_the_abyss",
		"item_treads_of_ermacor",
		"item_wand_of_the_brine",
		"item_watchers_gaze",
		"item_stony_coat",
		"item_elven_tunic",
		"item_cloak_of_flames",
		"item_psychic_headband",
		"item_ceremonial_robe",
	}

	tier[3] =	{
		"item_spy_gadget",
		"item_timeless_relic",
		"item_spell_prism",
		"item_flicker",
		"item_ninja_gear",
		"item_illusionsts_cape",
		"item_guardian_shell",
		"item_ice_dragon_maw",
		"item_paw_of_lucius",
		"item_stonework_pendant",
		"item_unhallowed_icon",
		"item_carapace_of_qaldin",
		"item_rhyziks_eye",
		"item_the_leveller",
		"item_penta_edged_sword",
		"item_stormcrafter",
		"item_trickster_cloak",
		"item_heavy_blade",
	}

	tier[4] =	{
		"item_force_boots",
		"item_desolator_2",
		"item_seer_stone",
		"item_mirror_shield",
		"item_fusion_rune",
		"item_ballista",
		"item_demonicon",
		"item_fallen_sky",
		"item_pirate_hat",
		"item_ex_machina",
		"item_apex",
		"item_the_caustic_finale",
		"item_glimmerdark_shield",
		"item_dredged_trident",
		"item_book_of_shadows",
		"item_giants_ring",
		"item_greater_mango",
	}

	tier[5] =	{
		-- "item_excalibur",
	}

	local hero = owner:GetClassname()
	local ownerTeam = owner:GetTeamNumber()
	local item_tier = 1

	local spawnedItem = {}
	for i = 1, 4 do
		-- test
		item_tier = i

		while true do
			local repeated_item = false
			local potential_item = tier[item_tier][RandomInt(1, #tier[item_tier])]

			if owner:HasItemInInventory(potential_item) then
				repeated_item = true
			end

			for _, previous_item in pairs(spawnedItem) do
				if previous_item == potential_item then
					repeated_item = true
				end
			end

			if not repeated_item then
				spawnedItem[i] = potential_item
				break
			end
		end
	end

	-- present item choices to the player
	self:StartItemPick(owner, spawnedItem)
end


function AIGameMode:StartItemPick(owner, items)
	if (not owner:IsRealHero()) and owner:GetOwnerEntity() then
		owner = owner:GetOwnerEntity()
	end
	local player_id = owner:GetPlayerID()
	if PlayerResource:IsValidPlayer(player_id) then
		CustomGameEventManager:Send_ServerToPlayer(PlayerResource:GetPlayer(player_id), "item_choice", items)
	end
end

function AIGameMode:FinishItemPick(keys)
	print("Choose item")
	PrintTable(keys)
	local owner = EntIndexToHScript(keys.owner_entindex)
	local hero = owner:GetClassname()

	-- Add the item to the inventory and broadcast
	owner:AddItemByName(keys.item)
	-- EmitSoundOnClient("powerup_04", owner)
	-- local item_drop =
	-- {
	-- 	hero_id = hero,
	-- 	dropped_item = keys.item
	-- }
	-- CustomGameEventManager:Send_ServerToAllClients( "item_drop", item_drop)
end
