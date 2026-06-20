-- special_bonus_unique_nevermore_upgrade.lua
LinkLuaModifier("modifier_special_bonus_unique_nevermore_upgrade",
	"abilities/special_bonus_unique_nevermore_upgrade", LUA_MODIFIER_MOTION_NONE)

special_bonus_unique_nevermore_upgrade = class({})

function special_bonus_unique_nevermore_upgrade:GetIntrinsicModifierName()
	return "modifier_special_bonus_unique_nevermore_upgrade"
end

-- 监听 modifier
modifier_special_bonus_unique_nevermore_upgrade = class({})

function modifier_special_bonus_unique_nevermore_upgrade:IsHidden() return true end

function modifier_special_bonus_unique_nevermore_upgrade:IsPurgable() return false end

function modifier_special_bonus_unique_nevermore_upgrade:IsDebuff() return false end

function modifier_special_bonus_unique_nevermore_upgrade:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_ABILITY_START,
		MODIFIER_PROPERTY_CASTTIME_PERCENTAGE,
	}
end

-- 全局施法速度（影魔有抬手的技能仅暗影压制与魂之挽歌，等价只降这两个抬手）
function modifier_special_bonus_unique_nevermore_upgrade:GetModifierPercentageCasttime()
	return self:GetAbility():GetSpecialValueFor("cast_speed_pct") or 0
end

function modifier_special_bonus_unique_nevermore_upgrade:OnAbilityStart(keys)
	if not IsServer() then return end
	local parent = self:GetParent()
	if keys.unit ~= parent then
		return
	end
	local ability = keys.ability
	if ability:GetAbilityName() ~= "nevermore_requiem" then
		return
	end

	-- 魂之挽歌前摇期间获得魔法免疫（防控制打断）
	local duration = self:GetAbility():GetSpecialValueFor("invulnerability_duration") or 1.67
	-- 仅当本次真加了觉醒魔免（未被更长的真BKB跳过）才检测取消，避免误删BKB
	if not ApplyAwakenMagicImmunity(parent, self:GetAbility(), duration) then
		return
	end
	-- 玩家可在前摇结束前取消施法反复刷新魔免，故监测前摇：若被取消（未进CD）则收回这次魔免
	self.check_requiem = ability
	self.awaken_immune_duration = duration
	self:StartIntervalThink(0.1)
end

function modifier_special_bonus_unique_nevermore_upgrade:OnIntervalThink()
	if not IsServer() then return end
	local ability = self.check_requiem
	if not ability or ability:IsNull() then
		self:StartIntervalThink(-1)
		return
	end
	-- 仍在前摇，继续等待
	if ability:IsInAbilityPhase() then
		return
	end
	self:StartIntervalThink(-1)
	self.check_requiem = nil

	-- 进了CD = 正常施放完成，魔免保留
	if ability:GetCooldownTimeRemaining() > 0 then
		return
	end
	-- 未进CD = 被取消：仅当魔免剩余≈觉醒时长（无更长BKB接管）才移除，否则交给BKB自然到期
	local imm = self:GetParent():FindModifierByName("modifier_black_king_bar_immune")
	if imm and imm:GetRemainingTime() <= self.awaken_immune_duration + 0.1 then
		imm:Destroy()
	end
end
