imba_chaos_knight_phantasm = class({})

LinkLuaModifier("modifier_imba_phantasm_buff", "heroes/hero_chaos_knight/hero_chaos_knight.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_imba_phantasm_cooldown", "heroes/hero_chaos_knight/hero_chaos_knight.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_imba_phantasm_delay", "heroes/hero_chaos_knight/hero_chaos_knight.lua", LUA_MODIFIER_MOTION_NONE)

function imba_chaos_knight_phantasm:IsHiddenWhenStolen() 	return false end
function imba_chaos_knight_phantasm:IsRefreshable() 		return true end
function imba_chaos_knight_phantasm:IsStealable() 			return true end
function imba_chaos_knight_phantasm:GetBehavior() return self:GetCaster():HasScepter() and DOTA_ABILITY_BEHAVIOR_UNIT_TARGET or DOTA_ABILITY_BEHAVIOR_NO_TARGET end

function imba_chaos_knight_phantasm:OnSpellStart()
	local caster = self:GetCaster()
	local target = self:GetCursorTarget() or caster
	target:EmitSound("Hero_ChaosKnight.Phantasm")
	target:RemoveModifierByName("modifier_imba_phantasm_buff")
	target:RemoveModifierByName("modifier_imba_phantasm_cooldown")
	target:AddNewModifier(caster, self, "modifier_imba_phantasm_buff", {duration = self:GetSpecialValueFor("duration")})
end

modifier_imba_phantasm_buff = class({})

function modifier_imba_phantasm_buff:IsDebuff()			return false end
function modifier_imba_phantasm_buff:IsHidden() 		return false end
function modifier_imba_phantasm_buff:IsPurgable() 		return false end
function modifier_imba_phantasm_buff:IsPurgeException() return false end
function modifier_imba_phantasm_buff:AllowIllusionDuplicate() return false end
function modifier_imba_phantasm_buff:DeclareFunctions() return {MODIFIER_EVENT_ON_ATTACK_LANDED} end
function modifier_imba_phantasm_buff:GetEffectName() return "particles/hero/chaos_knight/chaos_knight_phantasm.vpcf" end
function modifier_imba_phantasm_buff:GetEffectAttachType() return PATTACH_ABSORIGIN_FOLLOW end

function modifier_imba_phantasm_buff:OnCreated()
		if self:GetAbility() == nil then return end
	self.ability=self:GetAbility()
	self.parent=self:GetParent()
    self.attack_count=self.ability:GetSpecialValueFor("attack_count")
    self.attack_cooldown=self.ability:GetSpecialValueFor("attack_cooldown")
	if IsServer() and self.parent:HasModifier("modifier_item_aghanims_shard") then
		self.attack_count=self.attack_count+1
		self.attack_cooldown=1
	end
end

function modifier_imba_phantasm_buff:OnAttackLanded(keys)
	if IsServer() and not self.parent.phantasm and keys.attacker == self.parent and keys.target:IsAlive() and not self.parent:HasModifier("modifier_imba_phantasm_cooldown") then
		for i=0,self.attack_count do
			self.parent:AddNewModifier(self:GetCaster(), self.ability, "modifier_imba_phantasm_delay", {duration = 0.3, target = keys.target:entindex()})
			local pfx = ParticleManager:CreateParticle("particles/hero/chaos_knight/chaos_knight_phantasm_attack.vpcf", PATTACH_CUSTOMORIGIN, nil)
			ParticleManager:SetParticleControlEnt(pfx, 0, keys.target, PATTACH_ABSORIGIN_FOLLOW, nil, keys.target:GetAbsOrigin(), true)
			ParticleManager:SetParticleControlEnt(pfx, 2, self.parent, PATTACH_ABSORIGIN_FOLLOW, nil, self.parent:GetAbsOrigin(), true)
			ParticleManager:ReleaseParticleIndex(pfx)
		end
		local cooldown = math.min((1 /self.parent:GetAttacksPerSecond()), self.attack_cooldown)
		self.parent:AddNewModifier(self:GetCaster(), self.ability, "modifier_imba_phantasm_cooldown", {duration =  self.attack_cooldown})
	end
end

modifier_imba_phantasm_cooldown = class({})

function modifier_imba_phantasm_cooldown:IsDebuff()			return false end
function modifier_imba_phantasm_cooldown:IsHidden() 		return true end
function modifier_imba_phantasm_cooldown:IsPurgable() 		return false end
function modifier_imba_phantasm_cooldown:IsPurgeException() return false end

modifier_imba_phantasm_delay = class({})

function modifier_imba_phantasm_delay:IsDebuff()			return false end
function modifier_imba_phantasm_delay:IsHidden() 			return true end
function modifier_imba_phantasm_delay:IsPurgable() 			return false end
function modifier_imba_phantasm_delay:IsPurgeException() 	return false end
function modifier_imba_phantasm_delay:RemoveOnDeath() 		return false end
function modifier_imba_phantasm_delay:GetAttributes() return MODIFIER_ATTRIBUTE_MULTIPLE end

function modifier_imba_phantasm_delay:OnCreated(keys)
		if self:GetAbility() == nil then return end
	if IsServer() then
		self:SetStackCount(keys.target)
	end
end

function modifier_imba_phantasm_delay:OnDestroy()
	if IsServer() then
		if EntIndexToHScript(self:GetStackCount()):IsAlive() then
			self:GetParent().phantasm = true
			self:GetParent():PerformAttack(EntIndexToHScript(self:GetStackCount()), false, true, true, true, false, false, false)
			self:GetParent().phantasm = nil
		end
	end
end
