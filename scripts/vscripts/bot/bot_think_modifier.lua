
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

	-- if ability is , do nothing
	local hAbility1 = hHero:GetAbilityByIndex(0)
	local hAbility2 = hHero:GetAbilityByIndex(1)
	local hAbility3 = hHero:GetAbilityByIndex(2)
	local hAbility4 = hHero:GetAbilityByIndex(3)
	local hAbility5 = hHero:GetAbilityByIndex(4)
	local hAbility6 = hHero:GetAbilityByIndex(5)
	if hAbility1:IsInAbilityPhase() or hAbility2:IsInAbilityPhase() or hAbility3:IsInAbilityPhase() or hAbility6:IsInAbilityPhase() then return end
	if hAbility4 and hAbility4:IsInAbilityPhase() then return end
	if hAbility5 and hAbility5:IsInAbilityPhase() then return end

	-- item use
	if hHero:IsStunned() or hHero:IsHexed() then return end
	if UseActiveItem(hHero) then return end

	-- ability use
	if hHero:IsSilenced() then return end
	if BotAbilityThink:ThinkUseAbility(hHero) then return end
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
		-- GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(false)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
	elseif (GameTime >= (18 * 60)) then					-- LATEGAME
		if AIGameMode.barrackPushedGood > 5 or AIGameMode.barrackPushedBad > 5 then
			GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
		else
			GameRules:GetGameModeEntity():SetBotsMaxPushTier(5)
		end
	elseif (GameTime >= (16 * 60)) then						-- MIDGAME
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(4)
	elseif (GameTime >= (AIGameMode.botPushMin * 60)) then						-- MIDGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(3)
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
