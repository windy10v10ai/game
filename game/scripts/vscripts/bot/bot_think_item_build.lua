--[[ ============================================================================================================
	Author: Windy
	Date: September 14, 2021
================================================================================================================= ]]


--------------------
-- 初始化 修正出装列表
--------------------

local function replaceItem(v, oldItemName, newItemName)
  for i, vItem in ipairs(v) do
    if vItem == oldItemName then
      -- remove excalibur
      table.remove(v, i)
      table.insert(v, newItemName)
      print("replaceItem " .. oldItemName .. " to " .. newItemName)
    end
  end
end
-- 检测装备列表中是否包含配方中的任意配件，如果有则替换为高级装备
local function replaceItemByRecipe(v, recipeComponents, newItemName)
  -- recipeComponents 是一个包含所有配件名称的表
  -- 例如: {"item_sacred_six_vein", "item_sange_and_yasha_1", "item_yasha_and_kaya_1", "item_kaya_and_sange_1"}

  for i, vItem in ipairs(v) do
    -- 检查当前装备是否是配方中的任意一个配件
    for _, component in ipairs(recipeComponents) do
      if vItem == component then
        -- 找到配件，移除它并添加高级装备
        table.remove(v, i)
        table.insert(v, newItemName)
        print("replaceItemByRecipe: found " .. component .. ", replacing with " .. newItemName)
        return true  -- 只替换一次
      end
    end
  end
  return false
end
local function addTome(k, v)
  -- 高难度替换
  -- 获取难度倍率
  local multiplier = AIGameMode.fBotGoldXpMultiplier

  -- 计算替换概率（难度倍率 = 替换概率%）
  -- 限制最大概率为100%
  if multiplier >= 20 then
    local replace_chance = math.min(multiplier*1.5, 100)

    -- 随机替换装备（基于配方）
    -- 1. 万剑归宗：六脉神剑、无锋战戟 -> 万剑归宗
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_sacred_six_vein", "item_ten_thousand_swords")
    end
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_eternal_shroud", "item_ten_thousand_swords")
    end

    -- 2. 时间宝石：刷新核心 -> 时间宝石
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_refresh_core", "item_time_gem")
    end

    -- 3. 兽化盾：洞察盔甲 -> 兽化盾
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_insight_armor", "item_beast_shield")
    end

    -- 4. 兽化甲：刃甲2 -> 兽化甲
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_blade_mail_2", "item_beast_armor")
    end

    -- 5. 魔渊法杖：圣杖 -> 魔渊法杖
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_hallowed_scepter", "item_magic_abyss_staff")
    end

    -- 6. 魔渊剑：大冰眼 -> 魔渊剑
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_skadi_2", "item_magic_sword")
    end

    -- 7. 无限手套：黄金魔龙枪 -> 无限手套
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_dragon_lance_pro_max", "item_swift_glove")
    end

    -- 8. 暗影咒灭：达贡5 -> 暗影咒灭
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_dagon_5", "item_shadow_impact")
    end

    -- 9. 暗影裁决：深渊之刃v2 -> 暗影裁决
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_abyssal_blade_v2", "item_shadow_judgment")
    end
    -- 9. 暗影裁决：苍蓝幻想 -> 暗影裁决
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_blue_fantasy", "item_shadow_judgment")
    end
    -- 10. 德古拉面罩：撒旦2 -> 德古拉面罩
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_satanic_2", "item_dracula_mask")
    end

    -- 11. 枯木逢春：不朽之心 -> 枯木逢春
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_undying_heart", "item_withered_spring")
    end
      -- 11. 枯木逢春：咸鱼之王 -> 枯木逢春
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_aeon_pendant", "item_withered_spring")
    end

    -- 12. 魔龙狂舞：圣杖 -> 魔龙狂舞
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_hallowed_scepter", "item_magic_crit_blade")
    end

    -- 13. 归海一刀：黄金大核 -> 归海一刀
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_wasp_golden", "item_switchable_crit_blade")
    end

    -- 14. 禁忌战刃：深渊之刃v2 -> 禁忌战刃
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_abyssal_blade_v2", "item_forbidden_blade")
    end

    -- 14. 禁忌战刃：苍蓝幻想-> 禁忌战刃
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_blue_fantasy", "item_forbidden_blade")
    end
    -- 15. 禁忌法锤：死灵法杖 -> 禁忌法锤
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_necronomicon_staff", "item_forbidden_staff")
    end
      -- 15. 禁忌法锤：风暴之锤 -> 禁忌法锤
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_gungir_2", "item_forbidden_staff")
    end

    -- 16. 鹰眼战机：阿迪王-> 鹰眼战机
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_adi_king_plus", "item_hawkeye_fighter")
    end

    -- 17. 鹰眼炮台：黄金魔龙枪 -> 鹰眼炮台
    if RandomInt(1, 100) <= replace_chance then
      replaceItem(v, "item_hurricane_pike_2", "item_hawkeye_turret")
    end
  end
  if AIGameMode.fBotGoldXpMultiplier >= 10 then
    -- 天地同寿甲(秘术铠甲 群体刃甲)
    replaceItem(v, "item_blade_mail_2", "item_force_field_ultra")
  end
  if AIGameMode.fBotGoldXpMultiplier >= 9 then
    -- 诅咒圣剑
    replaceItem(v, "item_excalibur", "item_rapier_ultra_bot_1")
  end

  -- 洛书
  table.insert(v, "item_tome_of_luoshu")

  local amount = 0
if AIGameMode.fBotGoldXpMultiplier >= 60 then
  amount = 60
elseif AIGameMode.fBotGoldXpMultiplier >= 40 then
  amount = 40
elseif AIGameMode.fBotGoldXpMultiplier >= 30 then
  amount = 30
elseif AIGameMode.fBotGoldXpMultiplier >= 20 then
  amount = 25
elseif AIGameMode.fBotGoldXpMultiplier >= 10 then
  amount = 20
elseif AIGameMode.fBotGoldXpMultiplier >= 8 then
  amount = 15
elseif AIGameMode.fBotGoldXpMultiplier >= 5 then
  amount = 12
elseif AIGameMode.fBotGoldXpMultiplier >= 4 then
  amount = 9
elseif AIGameMode.fBotGoldXpMultiplier >= 3 then
  amount = 6
elseif AIGameMode.fBotGoldXpMultiplier >= 2 then
  amount = 3
end
  for i = 1, amount do
    table.insert(v, "item_tome_of_strength")
    table.insert(v, "item_tome_of_agility")
    -- 最大吃N本智力书，防止魔抗溢出
    if i < 8 then
      table.insert(v, "item_tome_of_intelligence")
    end
  end
end
--------------------
-- Initial
--------------------
if BotThink == nil then
  print("Bot Think initialize!")
  _G.BotThink = class({}) -- put in the global scope
end

function BotThink:SetTome()
  local allPurchaseTable = tBotItemData.purchaseItemList
  for k, v in pairs(allPurchaseTable) do
    addTome(k, v)
  end
end

--------------------
-- common function
--------------------

-- find item
function BotThink:FindItemByNameNotIncludeBackpack(hHero, sName)
  for i = 0, 5 do
    if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
  end
  return nil
end

-- function BotThink:FindItemByName(hHero, sName)
--   for i = 0, 8 do
--     if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
--   end
--   return nil
-- end

function BotThink:FindItemByNameIncludeStash(hHero, sName)
  for i = 0, 15 do
    if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
  end
  return nil
end

function BotThink:IsItemCanUse(hHero, sName)
  if hHero:HasItemInInventory(sName) then
    local item = BotThink:FindItemByNameNotIncludeBackpack(hHero, sName)
    if item and item:IsCooldownReady() then
      return true
    end
  end
  return false
end

-- find enemy
-- find many
function BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
  local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange, DOTA_UNIT_TARGET_TEAM_ENEMY,
    DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_ANY_ORDER, false)
  return tAllHeroes
end

-- find one
function BotThink:FindNearestEnemyHeroesInRangeAndVisible(hHero, iRange)
  local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange, DOTA_UNIT_TARGET_TEAM_ENEMY,
    DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_CLOSEST, false)
  if #tAllHeroes > 0 then
    return tAllHeroes[1]
  end
  return nil
end

-- find team
function BotThink:FindFriendHeroesInRangeAndVisible(hHero, iRange)
  local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange, DOTA_UNIT_TARGET_TEAM_FRIENDLY,
    DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE, FIND_ANY_ORDER, false)
  return tAllHeroes
end

-- use item
function BotThink:UseItemOnTarget(hHero, sItemName, hTarget)
  if not hHero:HasItemInInventory(sItemName) then
    return false
  end
  local hItem = BotThink:FindItemByNameNotIncludeBackpack(hHero, sItemName)
  if hItem then
    if hItem:IsCooldownReady() then
      hHero:CastAbilityOnTarget(hTarget, hItem, hHero:GetPlayerOwnerID())
      return true
    end
  end
  return false
end

function BotThink:UseItemOnPostion(hHero, sItemName, hTarget)
  if not hHero:HasItemInInventory(sItemName) then
    return false
  end
  local hItem = BotThink:FindItemByNameNotIncludeBackpack(hHero, sItemName)
  if hItem then
    if hItem:IsCooldownReady() then
      hHero:CastAbilityOnPosition(hTarget:GetOrigin(), hItem, hHero:GetPlayerOwnerID())
      return true
    end
  end
  return false
end

function BotThink:UseItem(hHero, sItemName)
  if not hHero:HasItemInInventory(sItemName) then
    return false
  end
  local hItem = BotThink:FindItemByNameNotIncludeBackpack(hHero, sItemName)
  if hItem then
    if hItem:IsCooldownReady() then
      hHero:CastAbilityNoTarget(hItem, hHero:GetPlayerOwnerID())
      return true
    end
  end
  return false
end

function BotThink:GetCooldownTotal(hHero)
  local iCooldownTotal = 0
  for i = 0, 5 do
    local hAbility = hHero:GetAbilityByIndex(i)
    if hAbility then
      iCooldownTotal = iCooldownTotal + hAbility:GetCooldownTimeRemaining()
    end
  end
  -- item 0 to 8
  for i = 0, 8 do
    local hItem = hHero:GetItemInSlot(i)
    if hItem then
      iCooldownTotal = iCooldownTotal + hItem:GetCooldownTimeRemaining()
    end
  end
  -- TODO fix Parameter type mismatch GetItemInSlot(DOTA_ITEM_NEUTRAL_SLOT)
  -- local itemNeutral = hHero:GetItemInSlot(DOTA_ITEM_NEUTRAL_SLOT)
  -- if itemNeutral then
  --   iCooldownTotal = iCooldownTotal + itemNeutral:GetCooldownTimeRemaining()
  -- end
  return iCooldownTotal
end

--------------------
-- 是否在防御塔附近
--------------------
function BotThink:IsBesideFriendTower(hHero, radius)
  local vHeroPos = hHero:GetAbsOrigin()
  local towers = Entities:FindAllByClassnameWithin("npc_dota_tower", vHeroPos, radius)
  for i, vTower in ipairs(towers) do
    if vTower:GetTeamNumber() == hHero:GetTeamNumber() then
      return true
    end
  end
  return false
end

function BotThink:IsBesideEnemyTower(hHero, radius)
  local vHeroPos = hHero:GetAbsOrigin()
  local towers = Entities:FindAllByClassnameWithin("npc_dota_tower", vHeroPos, radius)
  for i, vTower in ipairs(towers) do
    if vTower:GetTeamNumber() ~= hHero:GetTeamNumber() then
      return true
    end
  end
  return false
end

--------------------
-- common function
--------------------
local function BuyItemIfGoldEnough(hHero, iPurchaseTable)
  if not iPurchaseTable then
    -- hero not has purchase table
    return false
  end
  if (#iPurchaseTable == 0) then
    -- no items to buy
    return false
  end
  local iItemName = iPurchaseTable[1]
  if not iItemName then
    -- no items to buy
    return false
  end
  local iCost = GetItemCost(iItemName)

  if (hHero:GetGold() > iCost) then
    if hHero:GetNumItemsInInventory() > 8 then
      -- print("Warn! Think purchase "..hHero:GetName().." add "..iItemName.." stop with item count "..hHero:GetNumItemsInInventory())
    else
      local addedItem = hHero:AddItemByName(iItemName)
      if addedItem then
        PlayerResource:SpendGold(hHero:GetPlayerID(), iCost, DOTA_ModifyGold_PurchaseItem)
        table.remove(iPurchaseTable, 1)
        return true
      else
        print("Warn! Think purchase " ..
          hHero:GetName() .. " add " .. iItemName .. " fail with item count " .. hHero:GetNumItemsInInventory())
        return false
      end
    end
  end
end

-- return true if sell
local function SellItemFromTable(hHero, iPurchaseTable)
  for k, vName in ipairs(iPurchaseTable) do
    local sellItem = BotThink:FindItemByNameIncludeStash(hHero, vName)
    if sellItem then
      local iCost = math.floor(GetItemCost(vName) / 2)
      UTIL_RemoveImmediate(sellItem)
      PlayerResource:ModifyGold(hHero:GetPlayerID(), iCost, true, DOTA_ModifyGold_SellItem)
      return true
    end
  end
  return false
end

-- local function SellItem(hHero, vName)
--   local sellItem = BotThink:FindItemByNameIncludeStash(hHero, vName)
--   if sellItem then
--     local iCost = math.floor(GetItemCost(vName) / 2)
--     UTIL_RemoveImmediate(sellItem)
--     PlayerResource:ModifyGold(hHero:GetPlayerID(), iCost, true, DOTA_ModifyGold_SellItem)
--     return true
--   end
--   return false
-- end

--------------------
-- Item Think
--------------------

-- 物品购买
function BotThink:ThinkPurchase(hHero)
  local iHeroName = hHero:GetName()

  local iPurchaseTable = tBotItemData.purchaseItemList[iHeroName]
  BuyItemIfGoldEnough(hHero, iPurchaseTable)
end

-- 物品出售
function BotThink:ThinkSell(hHero)
  local iHeroName = hHero:GetName()
  local iItemCount = hHero:GetNumItemsInInventory()
  if iItemCount <= 7 then
    return
  end

  -- 如果有魔晶 并且有魔晶buff 则出售
  -- local shardName = "item_aghanims_shard"
  -- local sellItem = BotThink:FindItemByNameIncludeStash(hHero, shardName)
  -- if sellItem and hHero:HasModifier("modifier_item_aghanims_shard") then
  --   SellItem(hHero, shardName)
  -- end

  -- 如果物品名称包含recipt 则出售
  -- for i = 0, 8 do
  --   local hItem = hHero:GetItemInSlot(i)
  --   if hItem then
  --     local itemName = hItem:GetName()
  --     if string.find(itemName, "recipe") then
  --       SellItem(hHero, itemName)
  --     end
  --   end
  -- end

  local sellItemCommonList = tBotItemData.sellItemCommonList
  if SellItemFromTable(hHero, sellItemCommonList) then
    return
  end

  local iSellTable = tBotItemData.sellItemList[iHeroName]
  if not iSellTable then
    -- hero not has purchase table
    return
  end

  if SellItemFromTable(hHero, iSellTable) then
    return
  end
end

-- 物品消耗
function BotThink:ThinkConsumeItem(hHero)
  local itemConsumeList = tBotItemData.itemConsumeList
  for i, vItemUseName in ipairs(itemConsumeList) do
    BotThink:UseItemOnTarget(hHero, vItemUseName, hHero)
  end

  local itemConsumeNoTargetList = tBotItemData.itemConsumeNoTargetList
  for i, vItemUseName in ipairs(itemConsumeNoTargetList) do
    BotThink:UseItem(hHero, vItemUseName)
  end
end

-- 插眼
local wardItemTable = {
  "item_ward_observer",
  "item_ward_observer",
  "item_ward_observer",
  "item_ward_observer",
  "item_ward_sentry",
  "item_ward_sentry",
  "item_ward_sentry",
  "item_ward_sentry",
  "item_ward_sentry",
  "item_ward_sentry",
}
function BotThink:AddWardItem(hHero)
  local iItemCount = hHero:GetNumItemsInInventory()
  if iItemCount >= 8 then
    return
  end

  if BotThink:FindItemByNameIncludeStash(hHero, "item_ward_observer") then
    return
  end
  if BotThink:FindItemByNameIncludeStash(hHero, "item_ward_sentry") then
    return
  end
  if BotThink:FindItemByNameIncludeStash(hHero, "item_dust") then
    return
  end
  if BotThink:FindItemByNameIncludeStash(hHero, "item_gem") then
    return
  end

  local itemIndex = RandomInt(1, #wardItemTable)
  local sItemName = wardItemTable[itemIndex]
  local addedItem = hHero:AddItemByName(sItemName)
end

function BotThink:PutWardObserver(hHero)
  local wardPostionList = tBotItemData.wardObserverPostionList
  local sWardItemName = "item_ward_observer"
  local sUnitClassName = "npc_dota_ward_base"

  if BotThink:IsBesideFriendTower(hHero, 1600) then
    return
  end
  if BotThink:IsBesideEnemyTower(hHero, 900) then
    return
  end

  -- 随机在附近插假眼
  if RandomInt(1, 5) == 1 then
    wardPostionList = {}
    table.insert(wardPostionList, hHero:GetAbsOrigin())
  end

  if BotThink:IsItemCanUse(hHero, sWardItemName) then
    BotThink:PutWardItem(hHero, wardPostionList, sWardItemName, sUnitClassName)
  end
end

function BotThink:PutWardSentry(hHero)
  if BotThink:IsBesideFriendTower(hHero, 1000) then
    return
  end

  local wardPostionList = tBotItemData.wardSentryPostionList
  local sWardItemName = "item_ward_sentry"
  local sUnitClassName = "npc_dota_ward_base_truesight"

  -- 受伤时做真眼
  if hHero:GetHealthPercent() < 80 then
    wardPostionList = {}
    table.insert(wardPostionList, hHero:GetAbsOrigin())
  end

  if BotThink:IsItemCanUse(hHero, sWardItemName) then
    BotThink:PutWardItem(hHero, wardPostionList, sWardItemName, sUnitClassName)
  end
end

function BotThink:PutWardItem(hHero, wardPostionList, sWardItemName, sUnitClassName)
  -- if in range of wardPostionList, put ward
  local iCastRange = 500
  local iFindRange = 1200
  if sWardItemName == "item_ward_observer" then
    iFindRange = 1600
  end
  local wardItem = BotThink:FindItemByNameIncludeStash(hHero, sWardItemName)
  local vHeroPos = hHero:GetAbsOrigin()
  for _, vWardPos in ipairs(wardPostionList) do
    if wardItem then
      local wardPosVector = vWardPos + Vector(RandomInt(-50, 50), RandomInt(-50, 50), 0)
      local wardPosDistance = (wardPosVector - vHeroPos):Length()
      if wardPosDistance < iCastRange then
        -- find wards in wardPosVector
        local wards = Entities:FindAllByClassnameWithin(sUnitClassName, wardPosVector, iFindRange)
        -- for each wards, if not same team remove from list
        for i = #wards, 1, -1 do
          if wards[i]:GetTeamNumber() ~= hHero:GetTeamNumber() then
            table.remove(wards, i)
          end
        end
        -- if no wards, put ward
        if #wards == 0 then
          print("Think put ward " ..
            hHero:GetName() .. " try to put " .. sWardItemName .. " at [" .. vWardPos[1] .. "," .. vWardPos[2] .. "]")
          hHero:CastAbilityOnPosition(wardPosVector, wardItem, hHero:GetPlayerOwnerID())
        else
          -- print("Think put ward "..hHero:GetName().." !Stop to put ward at "..vWardPos[1]..","..vWardPos[2])
        end
        return
      end
    end
  end
end

-- 加钱
function BotThink:AddMoney(hHero)
  local iAddBase = AIGameMode.playerNumber + 5
  local GameTime = GameRules:GetDOTATime(false, false)
  local totalGold = PlayerResource:GetTotalEarnedGold(hHero:GetPlayerID())

  local goldPerSec = totalGold / GameTime

  local multiplier = AIGameMode.fBotGoldXpMultiplier
  if hHero:GetTeam() == DOTA_TEAM_GOODGUYS then
    multiplier = AIGameMode.fPlayerGoldXpMultiplier
  end

  local iAddMoney = math.floor(multiplier * iAddBase)

  if goldPerSec > iAddMoney then
    return false
  end

  if iAddMoney > 0 then
    hHero:ModifyGold(iAddMoney, true, DOTA_ModifyGold_GameTick)
    return true
  end
  return false
end
