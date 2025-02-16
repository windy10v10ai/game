spectre_dispersion2 = class({})

function spectre_dispersion2:GetIntrinsicModifierName()
	return "modifier_spectre_dispersion2"
end

function spectre_dispersion2:Precache(context)
	PrecacheResource("particle",
		"particles/econ/items/faceless_void/faceless_void_bracers_of_aeons/fv_bracers_of_aeons_backtrack.vpcf", context)
end

--------------------------------------------------------------------------------------------------
modifier_spectre_dispersion2 = class({})
LinkLuaModifier("modifier_spectre_dispersion2", "abilities/spectre_dispersion2", LUA_MODIFIER_MOTION_NONE)
-- 隐藏
function modifier_spectre_dispersion2:IsHidden() return true end

-- 无法驱散
function modifier_spectre_dispersion2:IsPurgable() return false end

--函数声明
function modifier_spectre_dispersion2:DeclareFunctions()
	local funcs =
	{
		MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
	}
	return funcs
end

--减伤
function modifier_spectre_dispersion2:GetModifierIncomingDamage_Percentage(keys)
	--最小触发伤害20
	if IsServer() and keys.target == self:GetParent() and keys.original_damage >= 20 then
		if RandomInt(1, 100) <= self:GetAbility():GetSpecialValueFor("reflexion_chance") then
			--特效
			EmitSoundOn("Hero_Mars.Shield.BlockSmall", self:GetParent())
			ParticleManager:CreateParticle(
			"particles/econ/items/faceless_void/faceless_void_bracers_of_aeons/fv_bracers_of_aeons_backtrack.vpcf", 0,
				self:GetParent())

			--幻象不反弹
			if self:GetParent():IsRealHero() then
				--反弹伤害,伤害标签：反弹伤害，不吃技能增强
				local damage = keys.original_damage * self:GetAbility():GetSpecialValueFor("damage_pct") * 0.01
				local damageInfo = { victim = keys.attacker, attacker = self:GetParent(), damage = damage, damage_type =
				keys.damage_type, ability = self:GetAbility(), damage_flags = 16 + 1024 }
				ApplyDamage(damageInfo)
			end
			return -100
		end
	end
end
