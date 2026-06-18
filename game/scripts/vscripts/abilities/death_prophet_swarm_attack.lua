--[[ 死亡先知新大招「我！即是虫群！」：普攻按伪随机概率触发已学的地穴虫群 ]]
death_prophet_swarm_attack = class({})

LinkLuaModifier("modifier_death_prophet_swarm_attack", "abilities/death_prophet_swarm_attack",
	LUA_MODIFIER_MOTION_NONE)

function death_prophet_swarm_attack:GetIntrinsicModifierName()
	return "modifier_death_prophet_swarm_attack"
end

modifier_death_prophet_swarm_attack = class({})

function modifier_death_prophet_swarm_attack:IsHidden() return true end
function modifier_death_prophet_swarm_attack:IsPermanent() return true end
function modifier_death_prophet_swarm_attack:RemoveOnDeath() return false end
function modifier_death_prophet_swarm_attack:IsPurgable() return false end

function modifier_death_prophet_swarm_attack:DeclareFunctions()
	return { MODIFIER_EVENT_ON_ATTACK_LANDED }
end

function modifier_death_prophet_swarm_attack:OnAttackLanded(params)
	if not IsServer() then return end

	local parent = self:GetParent()
	if params.attacker ~= parent then return end
	if parent:IsIllusion() then return end
	if params.target:IsBuilding() then return end

	local ability = self:GetAbility()
	if ability:GetLevel() <= 0 then return end

	local chance = ability:GetSpecialValueFor("basic_trigger_chance")
	if not RollPseudoRandomPercentage(chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_1, parent) then return end

	local swarm = parent:FindAbilityByName("death_prophet_carrion_swarm")
	if not swarm or swarm:GetLevel() <= 0 then return end

	-- 暂时结束冷却以触发施放，施放后一帧还原原冷却
	local remaining_cooldown = swarm:GetCooldownTimeRemaining()
	swarm:EndCooldown()
	parent:SetCursorPosition(params.target:GetAbsOrigin())
	parent:CastAbilityImmediately(swarm, parent:GetPlayerOwnerID())

	swarm:SetContextThink("restore_swarm_cooldown", function()
		if swarm and not swarm:IsNull() and remaining_cooldown > 0 then
			swarm:EndCooldown()
			swarm:StartCooldown(remaining_cooldown)
		end
		return nil
	end, FrameTime())
end
