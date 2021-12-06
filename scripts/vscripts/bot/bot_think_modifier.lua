--[[ ============================================================================================================
	Author: Windy
	Date: September 14, 2021
================================================================================================================= ]]
require('bot/bot_item_data')


local function addTome(k, v)
  for i = 0, 7 do
    table.insert(v,"item_tome_of_agility")
    table.insert(v,"item_tome_of_strength")
    table.insert(v,"item_tome_of_intelligence")
	end
end
--------------------
-- Initial
--------------------
if BotThink == nil then
  print("Bot Think initialize!")
	_G.BotThink = class({}) -- put in the global scope

  local allPurchaseTable = tBotItemData.purchaseItemList
  for k,v in pairs(allPurchaseTable) do
    addTome(k,v)
  end
end

--------------------
-- local function
--------------------
local function FindItemByNameNotIncludeBackpack(hHero, sName)
	for i = 0, 5 do
		if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
	end
	return nil
end

local function FindItemByName(hHero, sName)
	for i = 0, 8 do
		if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
	end
	return nil
end

local function FindItemByNameIncludeStash(hHero, sName)
	for i = 0, 15 do
		if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
	end
	return nil
end

local function BuyItemIfGoldEnough(hHero, iPurchaseTable)
  if not iPurchaseTable then
    -- hero not has purchase table
    return false
  end
  if ( #iPurchaseTable == 0 ) then
      -- no items to buy
      return false
  end
  local iItemName = iPurchaseTable[1]
  if not iItemName then
    -- no items to buy
    return false
  end
  local iCost = GetItemCost(iItemName)
  
  if(hHero:GetGold() > iCost) then
    if hHero:GetNumItemsInInventory() > 8 then
      -- TODO print
      print("Warn! Think purchase "..hHero:GetName().." add "..iItemName.." stop with item count "..hHero:GetNumItemsInInventory())
    else
      print("Think purchase "..hHero:GetName().." try to buy "..iItemName.." cost "..iCost)
      local addedItem = nil
      if AIGameMode.DebugMode then
        -- SetPurchaseTime -100 in order to judge is item add by bot think script
        local item = CreateItem(iItemName, hHero, hHero)
        item:SetPurchaseTime(-100)
        addedItem = hHero:AddItem(item)
      else
        addedItem = hHero:AddItemByName(iItemName)
      end
      if addedItem then
        PlayerResource:SpendGold(hHero:GetPlayerID(), iCost, DOTA_ModifyGold_PurchaseItem)
        table.remove(iPurchaseTable,1)
        return true
      else
        print("Warn! Think purchase "..hHero:GetName().." add "..iItemName.." fail with item count "..hHero:GetNumItemsInInventory())
        return false
      end
    end
  end
end

-- return true if sell
local function SellItemFromTable(hHero, iPurchaseTable)
  for k,vName in ipairs(iPurchaseTable) do
    local iCost = math.floor(GetItemCost(vName)/2)
    local sellItem = FindItemByNameIncludeStash(hHero, vName)
    if sellItem then
      print("Think sell "..hHero:GetName().." try to sell "..vName.." with gold "..iCost)
      hHero:RemoveItem(sellItem)
      PlayerResource:ModifyGold(hHero:GetPlayerID(), iCost, true, DOTA_ModifyGold_SellItem)
      return true
    end
  end
  return false
end

--------------------
-- Item Think
--------------------
function BotThink:ThinkPurchase(hHero)
  local iHeroName = hHero:GetName()
  
  local iPurchaseTable = tBotItemData.purchaseItemList[iHeroName]
  BuyItemIfGoldEnough(hHero, iPurchaseTable)
end

function BotThink:ThinkPurchaseNeutral(hHero, GameTime)
  local iHeroName = hHero:GetName()

  local multiIndex = "x"..AIGameMode.fBotGoldXpMultiplier
  local addNeutralItemTime = tBotItemData.addNeutralItemMultiTimeMap[multiIndex] or tBotItemData.addNeutralItemMultiTimeMap["x1"]

  if (GameTime > addNeutralItemTime[1]) then
    local iPurchaseTable = tBotItemData.addNeutralItemList[iHeroName]
    BuyItemIfGoldEnough(hHero, iPurchaseTable)
    return true
  end
end

function BotThink:ThinkSell(hero)
  local iHeroName = hero:GetName()
  local iPlayerId = hero:GetPlayerID()
  local iItemCount = hero:GetNumItemsInInventory()
  if iItemCount <= 7 then
    return
  end

  local itemConsumableList = tBotItemData.itemConsumableList
  if SellItemFromTable(hero, itemConsumableList) then
    return
  end

  local iSellTable = tBotItemData.sellItemList[iHeroName]
  if not iSellTable then
    -- hero not has purchase table
    return
  end

  if SellItemFromTable(hero, iSellTable) then
    return
  end
end


function BotThink:ThinkConsumeItem(hHero)
  local hHeroName = hHero:GetName()
  local hPlayerId = hHero:GetPlayerID()
  if iItemCount <= 7 then
    return
  end

  local itemConsumeList = tBotItemData.itemConsumeList
  for i,vItemUseName in ipairs(itemConsumeList) do
    local hItem = FindItemByNameNotIncludeBackpack(hHero, vItemUseName)
    if hItem then
      if hItem:GetCooldownTimeRemaining() > 0 then
        print("Warn! Think use item in cooldown"..hHeroName.." item "..vItemUseName)
      else
        print("Think use "..hHeroName.." try to use item "..vItemUseName)
        hHero:CastAbilityOnTarget(hHero, hItem, hHero:GetPlayerOwnerID())
        return true
      end
		end
  end

  local itemConsumeNoTargetList = tBotItemData.itemConsumeNoTargetList
  for i,vItemUseName in ipairs(itemConsumeNoTargetList) do
    local hItem = FindItemByNameNotIncludeBackpack(hHero, vItemUseName)
    if hItem then
      if hItem:GetCooldownTimeRemaining() > 0 then
        print("Warn! Think use item in cooldown"..hHeroName.." item "..vItemUseName)
      else
        print("Think use "..hHeroName.." try to use item "..vItemUseName)
        hHero:CastAbilityNoTarget(hItem, hHero:GetPlayerOwnerID())
        return true
      end
		end
  end
end

function BotThink:AddMoney(hHero)
  local iAddMoney = 3
  local GameTime = GameRules:GetDOTATime(false, false)
  local totalGold = PlayerResource:GetTotalEarnedGold(hHero:GetPlayerID())
  local goldPerSec = totalGold/GameTime
  local multiplier = AIGameMode.fBotGoldXpMultiplier

  if goldPerSec > (10 + multiplier*3) then
    return false
  end

	iAddMoney = math.floor(iAddMoney*multiplier)

  if iAddMoney > 0 then
    PlayerResource:ModifyGold(hHero:GetPlayerID(), iAddMoney, true, DOTA_ModifyGold_GameTick)
    return true
  end
	return false
end