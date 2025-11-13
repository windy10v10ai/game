require("libraries/popups")

item_universal_rune = class({})

-- 融合材料列表
local FUSION_ITEMS = {
	"item_fusion_hawkeye",
	"item_fusion_forbidden",
	"item_fusion_brutal",
	"item_fusion_life",
	"item_fusion_shadow",
	"item_fusion_agile",
	"item_fusion_beast",
	"item_fusion_magic",
}

-- 定义要检测的配方白名单
local RECIPE_WHITELIST = {
	"item_hawkeye_turret",
	"item_hawkeye_fighter",
	"item_forbidden_staff",
	"item_forbidden_blade",
	"item_switchable_crit_blade",
	"item_magic_crit_blade",
	"item_withered_spring",
	"item_dracula_mask",
	"item_shadow_judgment",
	"item_shadow_impact",
	"item_swift_glove",
	"item_ten_thousand_swords",
	"item_time_gem",
	"item_beast_shield",
	"item_beast_armor",
	"item_magic_abyss_staff",
	"item_magic_sword",
}

-- 缓存加载的配方数据
local RECIPES_CACHE = nil

function item_universal_rune:LoadRecipesFromKV()
	if RECIPES_CACHE then
		return RECIPES_CACHE
	end

	print("[UniversalRune] Loading recipes from KV file...")

	local items_kv = LoadKeyValues("scripts/npc/npc_items_custom.txt")
	if not items_kv then
		print("[UniversalRune] ERROR: Failed to load npc_items_custom.txt")
		return {}
	end

	print("[UniversalRune] Successfully loaded KV file")

	local whitelist_lookup = {}
	for _, item_name in ipairs(RECIPE_WHITELIST) do
		whitelist_lookup[item_name] = true
	end

	local recipes = {}
	local total_items = 0
	local recipe_items = 0

	for item_name, item_data in pairs(items_kv) do
		total_items = total_items + 1

		-- 修改这里: 同时检查字符串"1"和数字1
		local is_recipe = (item_data.ItemRecipe == "1" or item_data.ItemRecipe == 1)

		if is_recipe then
			recipe_items = recipe_items + 1
			print("[UniversalRune] Found recipe:", item_name, "->", item_data.ItemResult)

			if item_data.ItemResult and whitelist_lookup[item_data.ItemResult] then
				local requirements = item_data.ItemRequirements

				if requirements then
					local components = {}
					for req_key, req_string in pairs(requirements) do
						print("[UniversalRune]   Requirement", req_key, ":", req_string)
						for component in string.gmatch(req_string, "[^;]+") do
							table.insert(components, component)
							print("[UniversalRune]     Component:", component)
						end
					end

					local has_fusion = false
					for _, component in ipairs(components) do
						for _, fusion_item in ipairs(FUSION_ITEMS) do
							if component == fusion_item then
								has_fusion = true
								print("[UniversalRune]     Found fusion item:", fusion_item)
								break
							end
						end
						if has_fusion then break end
					end

					if has_fusion and #components > 0 then
						recipes[item_data.ItemResult] = components
						print("[UniversalRune] Added whitelisted recipe:", item_data.ItemResult, "with", #components,
							"components")
					else
						if not has_fusion then
							print("[UniversalRune] Skipped (no fusion item):", item_data.ItemResult)
						end
					end
				else
					print("[UniversalRune] No requirements for:", item_name)
				end
			end
		end
	end

	print("[UniversalRune] Scan complete:")
	print("[UniversalRune]   Total items:", total_items)
	print("[UniversalRune]   Recipe items:", recipe_items)
	print("[UniversalRune]   Loaded whitelisted recipes:", #recipes)

	RECIPES_CACHE = recipes
	return recipes
end

function item_universal_rune:OnSpellStart()
	if not IsServer() then return end

	local caster = self:GetCaster()
	local player_id = caster:GetPlayerOwnerID()

	print("[UniversalRune] Checking for craftable items...")

	-- 动态加载配方
	local RECIPES = self:LoadRecipesFromKV()

	-- 获取背包中的所有物品
	local inventory_items = self:GetInventoryItems(caster)

	-- 尝试合成
	local crafted = false
	for result_item, components in pairs(RECIPES) do
		if self:CanCraftWithUniversalRune(inventory_items, components) then
			print("[UniversalRune] Can craft:", result_item)

			-- 移除组件
			self:RemoveComponentsWithUniversalRune(caster, components)

			-- 添加合成物品
			caster:AddItemByName(result_item)

			-- 播放音效
			EmitSoundOn("Item.PickUpGemShop", caster)

			crafted = true
			break
		end
	end

	if not crafted then
		print("[UniversalRune] No craftable items found")
		local player = PlayerResource:GetPlayer(player_id)
		if player then
			CustomGameEventManager:Send_ServerToPlayer(player, "no_craftable_items", {})
		end
		return
	end
end

-- 其余函数保持不变...
function item_universal_rune:GetInventoryItems(hero)
	local items = {}
	for i = 0, 16 do
		local item = hero:GetItemInSlot(i)
		if item then
			local item_name = item:GetAbilityName()
			items[item_name] = (items[item_name] or 0) + 1
		end
	end
	return items
end

function item_universal_rune:CanCraftWithUniversalRune(inventory_items, components)
	local required = {}
	local fusion_item = nil

	for _, component in ipairs(components) do
		local is_fusion = false
		for _, fusion in ipairs(FUSION_ITEMS) do
			if component == fusion then
				fusion_item = component
				is_fusion = true
				break
			end
		end

		if not is_fusion then
			required[component] = (required[component] or 0) + 1
		end
	end

	for component, count in pairs(required) do
		if (inventory_items[component] or 0) < count then
			return false
		end
	end

	if (inventory_items["item_universal_rune"] or 0) < 1 then
		return false
	end

	return true
end

function item_universal_rune:RemoveComponentsWithUniversalRune(hero, components)
	local to_remove = {}
	local fusion_item = nil

	for _, component in ipairs(components) do
		local is_fusion = false
		for _, fusion in ipairs(FUSION_ITEMS) do
			if component == fusion then
				fusion_item = component
				is_fusion = true
				break
			end
		end

		if not is_fusion then
			to_remove[component] = (to_remove[component] or 0) + 1
		end
	end

	for i = 0, 16 do
		local item = hero:GetItemInSlot(i)
		if item then
			local item_name = item:GetAbilityName()
			if to_remove[item_name] and to_remove[item_name] > 0 then
				item:RemoveSelf()
				to_remove[item_name] = to_remove[item_name] - 1
				print("[UniversalRune] Removed component:", item_name)
			end
		end
	end

	for i = 0, 16 do
		local item = hero:GetItemInSlot(i)
		if item and item:GetAbilityName() == "item_universal_rune" then
			item:RemoveSelf()
			print("[UniversalRune] Removed universal rune (replaced fusion item:", fusion_item, ")")
			break
		end
	end
end
