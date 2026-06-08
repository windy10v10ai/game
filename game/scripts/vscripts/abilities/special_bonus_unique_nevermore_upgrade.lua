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
	}
end

function modifier_special_bonus_unique_nevermore_upgrade:OnAbilityStart(keys)
	if not IsServer() then return end
	local parent = self:GetParent()
	if keys.unit ~= parent then
		return
	end
	local ability = keys.ability
	local abilityName = ability:GetAbilityName()

	if abilityName == "nevermore_requiem" then
		-- 魂之挽歌前摇期间获得魔法免疫（防控制打断），靠 duration 自然到期
		-- 已有更长魔免（如真 BKB）时跳过，避免短时觉醒魔免缩短/替代它
		local duration = self:GetAbility():GetSpecialValueFor("invulnerability_duration") or 1.67
		local existing = parent:FindModifierByName("modifier_black_king_bar_immune")
		if not existing or existing:GetRemainingTime() < duration then
			parent:AddNewModifier(parent, self:GetAbility(), "modifier_black_king_bar_immune", { duration = duration })
			parent:EmitSound("DOTA_Item.BlackKingBar.Activate")
		end
	end
end
