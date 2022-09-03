--[[ items.lua ]]

function AIGameMode:SpecialItemAdd(owner)
	local tierRate = {}
	tierRate[1] = 100
	tierRate[2] = 20
	tierRate[3] = 6
	tierRate[4] = 1
	-- tierRate[5] = 0.6

	local tier = {}

	tier[1] =	{
		"item_infused_raindrop",		-- 凝魂之露
		"item_bottle",					-- 魔瓶
		"item_cloak",					-- 抗魔斗篷
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
		"item_ancient_janggo",			-- 战鼓
		"item_meteor_hammer",			-- 陨星锤

		"item_quicksilver_amulet",		-- 银闪护符
		"item_spider_legs",				-- 网虫腿
		"item_essence_ring",			-- 精华指环
		"item_nether_shawl",			-- 幽冥披风
		"item_pupils_gift",				-- 学徒之礼
		"item_horizon",					-- 视界
	}

	tier[4] =	{
		"item_candy_candy",					-- 嘉心糖
		"item_hand_of_group",				-- 团队之手
		"item_tome_of_knowledge",			-- 知识之书
		"item_aghanims_shard",				-- 阿哈利姆魔晶

		"item_repair_kit",					-- 修理工具
		"item_tome_of_aghanim",				-- 阿哈利姆之书
		"item_illusionsts_cape",			-- 幻术师披风
		"item_princes_knife",				-- 亲王短刀
		"item_pirate_hat",					-- 海盗帽
	}

	tier[5] =	{
		-- "item_greater_mango",				-- 高级芒果
	}

	local hero = owner:GetClassname()
	local ownerTeam = owner:GetTeamNumber()
	local item_tier = 1

	local spawnedItem = {}
	for i = 1, 4 do
		local repeatedTime = 0
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
			repeatedTime = repeatedTime + 1
			if repeatedTime > 10 then
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
