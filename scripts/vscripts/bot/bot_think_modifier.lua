
require('bot/bot_think_item_use')
require('bot/bot_think_ability_use')

--------------------------------------------------------------------------------
-- Bot item use modifier
--------------------------------------------------------------------------------
modifier_bot_think_item_use = class({})

function modifier_bot_think_item_use:IsPurgable() return false end
function modifier_bot_think_item_use:IsHidden() return true end
function modifier_bot_think_item_use:RemoveOnDeath() return false end

function modifier_bot_think_item_use:OnCreated()
	if IsClient() then return end
	self:StartIntervalThink(0.2)
end

function modifier_bot_think_item_use:OnIntervalThink()
	if IsClient() then return end

	local hHero = self:GetParent()
	-- if hero is dead, do nothing
	if hHero:IsAlive() == false then return end

	-- item use
	if hHero:IsStunned() or hHero:IsHexed() then return end
	UseActiveItem(hHero)

	-- ability use
	if hHero:IsSilenced() then return end
	BotAbilityThink:ThinkUseAbility(hHero)
end

--------------------------------------------------------------------------------
-- Bot strategy modifier 机器人策略
--------------------------------------------------------------------------------
modifier_bot_think_strategy = class({})

function modifier_bot_think_strategy:IsPurgable() return false end
function modifier_bot_think_strategy:IsHidden() return true end
function modifier_bot_think_strategy:RemoveOnDeath() return false end

function modifier_bot_think_strategy:OnCreated()
	if IsClient() then return end
	self:StartIntervalThink(2)
end

function modifier_bot_think_strategy:OnIntervalThink()
	if IsClient() then return end

	local GameTime = GameRules:GetDOTATime(false, false)
	if (GameTime >= (40 * 60)) then						-- LATEGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(false)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
	elseif (GameTime >= (18 * 60)) then					-- LATEGAME
		if AIGameMode.barrackPushedGood > 5 or AIGameMode.barrackPushedBad > 5 then
			GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
		else
			GameRules:GetGameModeEntity():SetBotsMaxPushTier(5)
		end
	elseif (GameTime >= (16 * 60)) then						-- MIDGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(false)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(4)
	elseif (GameTime >= (14 * 60)) then						-- MIDGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(3)
	elseif (GameTime >= (10 * 60)) then						-- MIDGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(2)
	else													-- EARLYGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(false)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(1)
	end

	local hParent = self:GetParent()

	BotThink:ThinkSell(hParent)
	BotThink:ThinkPurchase(hParent)
	BotThink:ThinkPurchaseNeutral(hParent, GameTime)

	BotThink:ThinkConsumeItem(hParent)
	BotThink:AddMoney(hParent)
end
