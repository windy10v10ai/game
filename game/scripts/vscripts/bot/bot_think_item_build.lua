--[[ ============================================================================================================
	Author: Windy
	Date: September 14, 2021
================================================================================================================= ]]


--------------------
-- 初始化 修正出装列表
--------------------

--------------------
-- Initial
--------------------
if BotThink == nil then
  print("Bot Think initialize!")
  _G.BotThink = class({}) -- put in the global scope
end

--------------------
-- common function
--------------------

-- find item
-- function BotThink:FindItemByNameNotIncludeBackpack(hHero, sName)
--   for i = 0, 5 do
--     if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
--   end
--   return nil
-- end

-- function BotThink:FindItemByName(hHero, sName)
--   for i = 0, 8 do
--     if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
--   end
--   return nil
-- end

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
-- function BotThink:UseItemOnTarget(hHero, sItemName, hTarget)
--   if not hHero:HasItemInInventory(sItemName) then
--     return false
--   end
--   local hItem = BotThink:FindItemByNameNotIncludeBackpack(hHero, sItemName)
--   if hItem then
--     if hItem:IsCooldownReady() then
--       hHero:CastAbilityOnTarget(hTarget, hItem, hHero:GetPlayerOwnerID())
--       return true
--     end
--   end
--   return false
-- end

-- function BotThink:UseItemOnPostion(hHero, sItemName, hTarget)
--   if not hHero:HasItemInInventory(sItemName) then
--     return false
--   end
--   local hItem = BotThink:FindItemByNameNotIncludeBackpack(hHero, sItemName)
--   if hItem then
--     if hItem:IsCooldownReady() then
--       hHero:CastAbilityOnPosition(hTarget:GetOrigin(), hItem, hHero:GetPlayerOwnerID())
--       return true
--     end
--   end
--   return false
-- end

-- function BotThink:UseItem(hHero, sItemName)
--   if not hHero:HasItemInInventory(sItemName) then
--     return false
--   end
--   local hItem = BotThink:FindItemByNameNotIncludeBackpack(hHero, sItemName)
--   if hItem then
--     if hItem:IsCooldownReady() then
--       hHero:CastAbilityNoTarget(hItem, hHero:GetPlayerOwnerID())
--       return true
--     end
--   end
--   return false
-- end

-- function BotThink:GetCooldownTotal(hHero)
--   local iCooldownTotal = 0
--   for i = 0, 5 do
--     local hAbility = hHero:GetAbilityByIndex(i)
--     if hAbility then
--       iCooldownTotal = iCooldownTotal + hAbility:GetCooldownTimeRemaining()
--     end
--   end
--   -- item 0 to 8
--   for i = 0, 8 do
--     local hItem = hHero:GetItemInSlot(i)
--     if hItem then
--       iCooldownTotal = iCooldownTotal + hItem:GetCooldownTimeRemaining()
--     end
--   end
--   return iCooldownTotal
-- end

--------------------
-- common function
--------------------
-- local function BuyItemIfGoldEnough(hHero, iPurchaseTable)
--   if not iPurchaseTable then
--     -- hero not has purchase table
--     return false
--   end
--   if (#iPurchaseTable == 0) then
--     -- no items to buy
--     return false
--   end
--   local iItemName = iPurchaseTable[1]
--   if not iItemName then
--     -- no items to buy
--     return false
--   end
--   local iCost = GetItemCost(iItemName)

--   if (hHero:GetGold() > iCost) then
--     if hHero:GetNumItemsInInventory() > 8 then
--       -- print("Warn! Think purchase "..hHero:GetName().." add "..iItemName.." stop with item count "..hHero:GetNumItemsInInventory())
--     else
--       local addedItem = hHero:AddItemByName(iItemName)
--       if addedItem then
--         PlayerResource:SpendGold(hHero:GetPlayerID(), iCost, DOTA_ModifyGold_PurchaseItem)
--         table.remove(iPurchaseTable, 1)
--         return true
--       else
--         print("Warn! Think purchase " ..
--           hHero:GetName() .. " add " .. iItemName .. " fail with item count " .. hHero:GetNumItemsInInventory())
--         return false
--       end
--     end
--   end
-- end

-- -- return true if sell
-- local function SellItemFromTable(hHero, iPurchaseTable)
--   for k, vName in ipairs(iPurchaseTable) do
--     local sellItem = BotThink:FindItemByNameIncludeStash(hHero, vName)
--     if sellItem then
--       local iCost = math.floor(GetItemCost(vName) / 2)
--       UTIL_RemoveImmediate(sellItem)
--       PlayerResource:ModifyGold(hHero:GetPlayerID(), iCost, true, DOTA_ModifyGold_SellItem)
--       return true
--     end
--   end
--   return false
-- end


--------------------
-- Item Think
--------------------

-- 物品购买
-- function BotThink:ThinkPurchase(hHero)
--   local iHeroName = hHero:GetName()

--   local iPurchaseTable = tBotItemData.purchaseItemList[iHeroName]
--   BuyItemIfGoldEnough(hHero, iPurchaseTable)
-- end

-- 物品出售
-- function BotThink:ThinkSell(hHero)
--   local iHeroName = hHero:GetName()
--   local iItemCount = hHero:GetNumItemsInInventory()
--   if iItemCount <= 7 then
--     return
--   end

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

-- local sellItemCommonList = tBotItemData.sellItemCommonList
-- if SellItemFromTable(hHero, sellItemCommonList) then
--   return
-- end

--   local iSellTable = tBotItemData.sellItemList[iHeroName]
--   if not iSellTable then
--     -- hero not has purchase table
--     return
--   end

--   if SellItemFromTable(hHero, iSellTable) then
--     return
--   end
-- end
