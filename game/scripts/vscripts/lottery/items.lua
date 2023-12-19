--[[ items.lua ]]

function AIGameMode:SpecialItemAdd(owner)
	local tierRate = {}
	tierRate[1] = 100
	tierRate[2] = 35
	tierRate[3] = 10
	tierRate[4] = 1.5
	tierRate[5] = 0.2

	local tier = {}

	tier[1] =	{
		"item_bottle",					-- 魔瓶
		"item_cloak",					-- 抗魔斗篷
		"item_crown",					-- 王冠
		-- "item_belt_of_strength",		-- 力量+6
		-- "item_boots_of_elves",		-- 敏捷+6
		-- "item_robe",					-- 智力+6
		"item_magic_wand",				-- 魔棒
		"item_bracer",					-- 护腕
		"item_wraith_band",				-- 系带
		"item_null_talisman",			-- 挂件
		"item_chipped_vest",            -- 碎裂背心
		"item_ironwood_tree",			-- 铁树之木
		"item_iron_talon",              -- 打野爪
	}

	tier[2] =	{
		"item_imp_claw",                -- 魔童之爪
		"item_infused_raindrop",		-- 凝魂之露
		-- "item_ogre_axe",				-- 力量+10
		-- "item_blade_of_alacrity",	-- 敏捷+10
		-- "item_staff_of_wizardry",	-- 智力+10
		-- "item_orb_of_corrosion",		-- 腐蚀之球
		-- "item_urn_of_shadows",		-- 骨灰
		-- "item_lifesteal",			-- 吸血面具
		-- "item_medallion_of_courage",	-- 勇气勋章
		"item_falcon_blade",			-- 猎鹰战刃

		"item_ocean_heart",			    -- 海洋之心
		-- "item_faded_broach",			-- 暗淡胸针
		-- "item_dimensional_doorway",	-- 空间之门
		"item_vampire_fangs",			-- 吸血鬼獠牙
		"item_mysterious_hat",			-- 仙灵饰品
		"item_poor_mans_shield",		-- 穷鬼盾
		"item_vambrace",				-- 臂甲
		"item_grove_bow",				-- 林野长弓
		"item_orb_of_destruction",		-- 毁灭灵球
		"item_great_famango",			-- 大疗伤莲花
		"item_tome_of_knowledge",		-- 知识之书
	}

	tier[3] =	{
		"item_philosophers_stone",		-- 贤者石
		"item_quickening_charm",        -- 加速护符
		"item_hand_of_midas",			-- 点金手
		"item_holy_locket",				-- 圣洁吊坠
		"item_aghanims_shard",			-- 阿哈利姆魔晶
		-- "item_quicksilver_amulet",		-- 银闪护符
		"item_spider_legs",				-- 网虫腿
		"item_essence_ring",			-- 精华指环
		-- "item_nether_shawl",			-- 幽冥披风
		-- "item_pupils_gift",			-- 学徒之礼
		"item_horizon",					-- 视界
		"item_witless_shako",           -- 无知小帽
		"item_third_eye",               -- 第三只眼
		"item_repair_kit",			    -- 修理工具
		"item_princes_knife",			-- 亲王短刀
		"item_the_leveller",            -- 平世剑
		"item_minotaur_horn",           -- 恶牛角
		"item_titan_sliver",            -- 巨神残铁
	}

	tier[4] =	{
		-- "item_candy_candy",				-- 嘉心糖
		-- "item_hand_of_group",			-- 团队之手
		-- "item_tome_of_aghanim",			-- 阿哈利姆之书
		-- "item_illusionsts_cape",		-- 幻术师披风
		"item_panic_button",            -- 神灯
		"item_pirate_hat",				-- 海盗帽
		"item_fallen_sky",				-- 天崩
		-- "item_demonicon",				-- 大死灵书
		"item_mirror_shield",			-- 神镜盾
		"item_spell_prism",				-- 法术棱镜
		"item_ex_machina",				-- 机械之心
		"item_seer_stone",				-- 先哲石
		-- "item_vengeances_shadow",		-- 复仇之影
		"item_helm_of_the_undying",		-- 不死头盔
		"item_woodland_striders",		-- 丛林鞋
	}

	tier[5] =	{
		 "item_tome_of_agility_for_lottery",		    -- 敏捷之书
		 "item_tome_of_intelligence_for_lottery",		-- 智力之书
		 "item_tome_of_strength_for_lottery",			-- 力量之书
	}
	local hero = owner:GetClassname()
	local ownerTeam = owner:GetTeamNumber()
	local item_tier = 1

	local spawnedItem = {}
	for i = 1, 3 do
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
	if AIGameMode.tIfItemChosen[keys.PlayerID] then return end
	print("Choose item")
	PrintTable(keys)
	local owner = EntIndexToHScript(keys.owner_entindex)

	-- Add the item to the inventory and broadcast
	owner:AddItemByName(keys.item)
	AIGameMode.tIfItemChosen[keys.PlayerID] = true
end

function AIGameMode:ItemChoiceShuffle(keys)
	if PlayerController:IsMember(PlayerResource:GetSteamAccountID(keys.PlayerID)) then
		local owner = PlayerResource:GetSelectedHeroEntity(keys.PlayerID)
		AIGameMode:SpecialItemAdd(owner)
	end
end
