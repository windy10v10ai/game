dark_seer_normal_punch2 = class({})

function dark_seer_normal_punch2:GetIntrinsicModifierName()
	return "modifier_dark_seer_normal_punch2"
end

--预载特效
function dark_seer_normal_punch2:Precache(context)
	PrecacheResource("particle", "particles/units/heroes/hero_dark_seer/dark_seer_attack_normal_punch.vpcf", context)
end

--------------------------------------------------------------------------------------------------
modifier_dark_seer_normal_punch2 = class({})
LinkLuaModifier("modifier_dark_seer_normal_punch2", "abilities/dark_seer_normal_punch2", LUA_MODIFIER_MOTION_NONE)
-- 无法驱散
function modifier_dark_seer_normal_punch2:IsPurgable() return false end

--隐藏
function modifier_dark_seer_normal_punch2:IsHidden() return true end

--状态声明
function modifier_dark_seer_normal_punch2:DeclareFunctions()
	local funcs =
	{
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
	return funcs
end

--当攻击
function modifier_dark_seer_normal_punch2:OnAttackLanded(keys)
	if IsServer() and keys.attacker == self:GetParent() and self:GetAbility():IsCooldownReady() then
		local ability = self:GetAbility()
		ability:StartCooldown(ability:GetCooldown(-1) * self:GetParent():GetCooldownReduction())

		if keys.target:IsRealHero() then
			-- 创建幻象
			local illusion = CreateIllusions(
				self:GetCaster(), -- 拥有者
				keys.target, -- 复制者
				{
					outgoing_damage = 0,
					incoming_damage = 0,
					duration = ability:GetSpecialValueFor("illusion_duration"),
				},
				1, -- 数量
				100, -- nPadding
				false, -- bScramblePosition
				true -- bFindClearSpace
			)
		end

		EmitSoundOn("Hero_Dark_Seer.NormalPunch.Lv2", keys.target)
		--造成伤害
		local damage = self:GetAbility():GetSpecialValueFor("max_damage") +
			self:GetCaster():GetAverageTrueAttackDamage(nil) * self:GetAbility():GetSpecialValueFor("ad")
		local damageInfo = {
			victim = keys.target,
			attacker = self:GetCaster(),
			damage = damage,
			damage_type = DAMAGE_TYPE_MAGICAL,
			damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION + DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL,
			ability = self:GetAbility()
		}
		ApplyDamage(damageInfo)

		keys.target:AddNewModifier(self:GetCaster(), self:GetAbility(), "modifier_stunned", { duration = 1.25 })

		--特效
		local Particle = ParticleManager:CreateParticle(
			"particles/units/heroes/hero_dark_seer/dark_seer_attack_normal_punch.vpcf", 0, self:GetCaster())
		ParticleManager:SetParticleControl(Particle, 2, keys.target:GetOrigin())
	end
end
