
require('bot/bot_think_item_use')

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
	UseActiveItem(self:GetParent())
end
