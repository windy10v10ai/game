--------------------------------------------------------------------------------
-- Bot item use modifier
--------------------------------------------------------------------------------
modifier_bot_think_item_use = class({})

function modifier_bot_think_item_use:IsPurgable() return false end
function modifier_bot_think_item_use:IsHidden() return true end
function modifier_bot_think_item_use:RemoveOnDeath() return false end

function modifier_bot_think_item_use:OnCreated()
	if IsClient() then return end
	if not self then return end
	-- start thinking after random time
	local lagTime = RandomFloat(0.1, 0.4)
	Timers:CreateTimer(lagTime, function()
		if not self then return end
		self:StartIntervalThink(0.3)
	end)
end

function modifier_bot_think_item_use:OnIntervalThink()
	if IsClient() then return end
	if not self then return end

	local hHero = self:GetParent()
	if BotThink:IsControllable(hHero) then return end

	-- if ability is , do nothing
	local hAbility1 = hHero:GetAbilityByIndex(0)
	local hAbility2 = hHero:GetAbilityByIndex(1)
	local hAbility3 = hHero:GetAbilityByIndex(2)
	local hAbility4 = hHero:GetAbilityByIndex(3)
	local hAbility5 = hHero:GetAbilityByIndex(4)
	local hAbility6 = hHero:GetAbilityByIndex(5)
	if hAbility1 and hAbility1:IsInAbilityPhase() then return end
	if hAbility2 and hAbility2:IsInAbilityPhase() then return end
	if hAbility3 and hAbility3:IsInAbilityPhase() then return end
	if hAbility4 and hAbility4:IsInAbilityPhase() then return end
	if hAbility5 and hAbility5:IsInAbilityPhase() then return end
	if hAbility6 and hAbility6:IsInAbilityPhase() then return end

	-- item use
	if BotItemThink:UseActiveItem(hHero) then return end

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
	if not self then return end
	self:StartIntervalThink(2)
end

function modifier_bot_think_strategy:OnIntervalThink()
	if IsClient() then return end
	if not self then return end

	local GameTime = GameRules:GetDOTATime(false, false)
	local hHero = self:GetParent()
	if hHero:IsNull() then return end

	BotThink:AddMoney(hHero)

	if BotThink:IsControllable(hHero) then return end

	BotThink:ThinkSell(hHero)
	BotThink:ThinkPurchase(hHero)
	BotThink:ThinkPurchaseNeutral(hHero, GameTime)
	BotThink:ThinkConsumeItem(hHero)

	BotThink:PutWardObserver(hHero)
	BotThink:PutWardSentry(hHero)
end

--------------------------------------------------------------------------------
-- Bot ward modifier 机器人做眼
--------------------------------------------------------------------------------
modifier_bot_think_ward = class({})

function modifier_bot_think_ward:IsPurgable() return false end
function modifier_bot_think_ward:IsHidden() return true end
function modifier_bot_think_ward:RemoveOnDeath() return false end

function modifier_bot_think_ward:OnCreated()
	if IsClient() then return end
	if not self then return end
	local interval = 90
	if AIGameMode.DebugMode then interval = 30 end
	self:StartIntervalThink(interval)
end

function modifier_bot_think_ward:OnIntervalThink()
	if IsClient() then return end
	if not self then return end

	local hHero = self:GetParent()
	if hHero:IsNull() then return end
	if BotThink:IsControllable(hHero) then return end

	BotThink:AddWardItem(hHero)
end
