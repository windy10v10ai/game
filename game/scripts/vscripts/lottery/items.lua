--[[ items.lua ]]

function AIGameMode:SpecialItemAdd(owner)
	local tierRate = {}
	tierRate[1] = 100
	tierRate[2] = 20
	tierRate[3] = 5

	local tier = {}

	tier[1] =	{
		"item_crown",					-- 王冠
		"item_belt_of_strength",		-- 力量+6
		"item_boots_of_elves",			-- 敏捷+6
		"item_robe",					-- 智力+6
		"item_magic_wand",				-- 魔棒
		"item_bracer",					-- 护腕
		"item_wraith_band",				-- 系带
		"item_null_talisman",			-- 挂件
		"item_quelling_blade_2_datadriven",		-- 毒瘤之刃

		"item_ironwood_tree",			-- 铁树之木
	}

	tier[2] =	{
		"item_ogre_axe",				-- 力量+10
		"item_blade_of_alacrity",		-- 敏捷+10
		"item_staff_of_wizardry",		-- 智力+10
		"item_orb_of_corrosion",		-- 腐蚀之球
		"item_urn_of_shadows",			-- 骨灰
		"item_lifesteal",				-- 吸血面具
		"item_medallion_of_courage",	-- 勇气勋章
		"item_falcon_blade",			-- 猎鹰战刃

		"item_ocean_heart",				-- 海洋之心
		"item_broom_handle",			-- 扫帚柄
		"item_trusty_shovel",			-- 可靠铁铲
		"item_faded_broach",			-- 暗淡胸针
		"item_keen_optic",				-- 基恩镜片
		"item_dimensional_doorway",		-- 空间之门
	}

	tier[3] =	{
		"item_hand_of_midas",			-- 点金手
		"item_holy_locket",				-- 圣洁吊坠

		"item_quicksilver_amulet",		-- 银闪护符
		"item_spider_legs",				-- 网虫腿
		"item_essence_ring",			-- 精华指环
		"item_nether_shawl",			-- 幽冥披风
		"item_pupils_gift",				-- 学徒之礼
		"item_horizon",					-- 视界

		-- "item_spy_gadget",
		-- "item_timeless_relic",
		-- "item_spell_prism",
		-- "item_flicker",
		-- "item_ninja_gear",
		-- "item_illusionsts_cape",
		-- "item_guardian_shell",
		-- "item_ice_dragon_maw",
		-- "item_paw_of_lucius",
		-- "item_stonework_pendant",
		-- "item_unhallowed_icon",
		-- "item_carapace_of_qaldin",
		-- "item_rhyziks_eye",
		-- "item_the_leveller",
		-- "item_penta_edged_sword",
		-- "item_stormcrafter",
		-- "item_trickster_cloak",
		-- "item_heavy_blade",
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
	for i = 1, 3 do
		local draw = RandomFloat(0.0, 100.0)
		for iTier=#tierRate, 1, -1 do
			if draw < tierRate[iTier] then
				item_tier = iTier
				break
			end
		end
		print("Draw rate "..draw.."Tier "..item_tier)


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
