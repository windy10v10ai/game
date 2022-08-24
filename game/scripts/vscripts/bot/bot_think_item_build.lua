--[[ ============================================================================================================
	Author: Windy
	Date: September 14, 2021
================================================================================================================= ]]


local function addTome(k, v)
  local amount = 5
  if AIGameMode.fBotGoldXpMultiplier > 10 then
    amount = 10
  elseif AIGameMode.fBotGoldXpMultiplier > 8 then
    amount = 8
  elseif AIGameMode.fBotGoldXpMultiplier > 6 then
    amount = 6
  end
  for i = 1, amount do
    table.insert(v,"item_tome_of_strength")
    table.insert(v,"item_tome_of_agility")
    table.insert(v,"item_tome_of_intelligence")
	end
  table.insert(v,"item_tome_of_luoshu")
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
  for k,v in pairs(allPurchaseTable) do
    addTome(k,v)
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

function BotThink:FindItemByName(hHero, sName)
	for i = 0, 8 do
		if hHero:GetItemInSlot(i) and hHero:GetItemInSlot(i):GetName() == sName then return hHero:GetItemInSlot(i) end
	end
	return nil
end

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
function BotThink:FindEnemyHeroesInRangeAndVisible(hHero, iRange)
    local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS, FIND_ANY_ORDER, false)
    return tAllHeroes
end
-- find team
function BotThink:FindFriendHeroesInRangeAndVisible(hHero, iRange)
    local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange, DOTA_UNIT_TARGET_TEAM_FRIENDLY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE, FIND_ANY_ORDER, false)
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


--------------------
-- common function
--------------------
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
      -- print("Warn! Think purchase "..hHero:GetName().." add "..iItemName.." stop with item count "..hHero:GetNumItemsInInventory())
    else
      local addedItem = hHero:AddItemByName(iItemName)
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
    local sellItem = BotThink:FindItemByNameIncludeStash(hHero, vName)
    if sellItem then
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
function BotThink:IsControllable(hHero)
	if hHero:IsNull() then return true end
	-- if hero is dead, do nothing
	if hHero:IsAlive() == false then return true end
  -- 眩晕
	if hHero:IsStunned() then return true end
  -- 变羊
	if hHero:IsHexed() then return true end
  -- 噩梦
  if hHero:IsNightmared() then return true end
  -- 虚空大
  if hHero:IsFrozen() then return true end
  -- 禁用物品
  if hHero:IsMuted() then return true end


  -- 战吼，决斗，冰龙大
  if hHero:HasModifier("modifier_axe_berserkers_call") or hHero:HasModifier("modifier_legion_commander_duel") or hHero:HasModifier("modifier_winter_wyvern_winters_curse") then return true end

  -- TP
	if hHero:HasModifier("modifier_teleporting") then return true end

  return false
end

-- 物品购买
function BotThink:ThinkPurchase(hHero)
  local iHeroName = hHero:GetName()

  local iPurchaseTable = tBotItemData.purchaseItemList[iHeroName]
  BuyItemIfGoldEnough(hHero, iPurchaseTable)
end

function BotThink:ThinkPurchaseNeutral(hHero, GameTime)
  local iHeroName = hHero:GetName()

  local multiIndex = "x1"
  if AIGameMode.fBotGoldXpMultiplier < 5 then
    multiIndex = "x1"
	elseif AIGameMode.fBotGoldXpMultiplier <= 5 then
    multiIndex = "x5"
	elseif AIGameMode.fBotGoldXpMultiplier <= 8 then
    multiIndex = "x8"
	elseif AIGameMode.fBotGoldXpMultiplier <= 10 then
    multiIndex = "x10"
	else
    multiIndex = "x20"
	end

  local addNeutralItemTime = tBotItemData.addNeutralItemMultiTimeMap[multiIndex] or tBotItemData.addNeutralItemMultiTimeMap["x1"]

  if (GameTime > addNeutralItemTime[1]) then
    local iPurchaseTable = tBotItemData.addNeutralItemList[iHeroName]
    BuyItemIfGoldEnough(hHero, iPurchaseTable)
    return true
  end
end

-- 物品出售
function BotThink:ThinkSell(hHero)
  local iHeroName = hHero:GetName()
  local iItemCount = hHero:GetNumItemsInInventory()
  if iItemCount <= 7 then
    return
  end

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
  for i,vItemUseName in ipairs(itemConsumeList) do
    BotThink:UseItemOnTarget(hHero, vItemUseName, hHero)
  end

  local itemConsumeNoTargetList = tBotItemData.itemConsumeNoTargetList
  for i,vItemUseName in ipairs(itemConsumeNoTargetList) do
    BotThink:UseItem(hHero, vItemUseName)
  end
end

-- 插眼
local wardItemTable = {
  "item_ward_observer",
  "item_ward_observer",
  "item_ward_sentry",
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
  if BotThink:IsItemCanUse(hHero, sWardItemName) then
    BotThink:PutWardItem(hHero, wardPostionList, sWardItemName, sUnitClassName)
  end
end

function BotThink:PutWardSentry(hHero)
  local wardPostionList = tBotItemData.wardSentryPostionList
  local sWardItemName = "item_ward_sentry"
  local sUnitClassName = "npc_dota_ward_base_truesight"
  if BotThink:IsItemCanUse(hHero, sWardItemName) then
    BotThink:PutWardItem(hHero, wardPostionList, sWardItemName, sUnitClassName)
  end
end

function BotThink:PutWardItem(hHero, wardPostionList, sWardItemName, sUnitClassName)
  -- if in range of wardPostionList, put ward
  local iCastRange = 500
  local iFindRange = 900
  if sWardItemName == "item_ward_observer" then
    iFindRange = 1200
  end
  local wardItem = BotThink:FindItemByNameIncludeStash(hHero, sWardItemName)
  local vHeroPos = hHero:GetAbsOrigin()
  for i,vWardPos in ipairs(wardPostionList) do
    if wardItem then
      -- local wardPosVector = vWardPos + Vector(RandomInt(-5, 5),RandomInt(-5, 5),0)
      local wardPosVector = vWardPos
      local wardPosDistance = (wardPosVector - vHeroPos):Length()
      if wardPosDistance < iCastRange then
        -- find wards in wardPosVector
        local wards = Entities:FindAllByClassnameWithin(sUnitClassName, wardPosVector, iFindRange)
        -- for each wards, if not same team remove from list
        for i=#wards,1,-1 do
          if wards[i]:GetTeamNumber() ~= hHero:GetTeamNumber() then
            table.remove(wards, i)
          end
        end
        -- if no wards, put ward
        if #wards == 0 then
          print("Think put ward "..hHero:GetName().." try to put "..sWardItemName.." at ["..vWardPos[1]..","..vWardPos[2].."]")
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
  local iAddBase = 5
  local GameTime = GameRules:GetDOTATime(false, false)
  local totalGold = PlayerResource:GetTotalEarnedGold(hHero:GetPlayerID())

  local goldPerSec = totalGold/GameTime

  local multiplier = AIGameMode.fBotGoldXpMultiplier
  if AIGameMode.bRadiantBotSameMulti and hHero:GetTeam() == DOTA_TEAM_GOODGUYS then
    multiplier = AIGameMode.fPlayerGoldXpMultiplier
  end

	local iAddMoney = math.floor(multiplier*iAddBase)

  if goldPerSec > iAddMoney then
    return false
  end

  if iAddMoney > 0 then
    hHero:ModifyGold(iAddMoney, true, DOTA_ModifyGold_GameTick)
    return true
  end
	return false
end
