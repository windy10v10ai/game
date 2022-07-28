LinkLuaModifier("modifier_item_abyssal_blade_v2", "items/item_abyssal_blade_v2.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_abyssal_blade_v2_debuff", "items/item_abyssal_blade_v2.lua", LUA_MODIFIER_MOTION_NONE)
item_abyssal_blade_v2= class({})

function item_abyssal_blade_v2:GetIntrinsicModifierName()
        return "modifier_item_abyssal_blade_v2"
end

function item_abyssal_blade_v2:OnSpellStart()
        self.caster=self.caster or self:GetCaster()
        self.stun_m=self.stun_m or self:GetSpecialValueFor("stun_m")
        local ability = self
        local target=self:GetCursorTarget()
        local tpos=target:GetAbsOrigin()
        local particle_abyssal = "particles/econ/items/juggernaut/jugg_arcana/juggernaut_arcana_v2_omni_slash_tgt.vpcf"
        if  target:TriggerSpellAbsorb(self) then
                return
        end
        EmitSoundOn("DOTA_Item.AbyssalBlade.Activate",target)
        --add target debuff
	local duration = self.stun_m * (1 - target:GetStatusResistance())
        target:AddNewModifier(self.caster, self, "modifier_item_abyssal_blade_v2_debuff", {duration=duration})
        --commit att to target
        self.caster:MoveToPositionAggressive(tpos)

        -- blink
        local blink_start_particle = ParticleManager:CreateParticle("particles/econ/events/ti9/blink_dagger_ti9_start_lvl2.vpcf", PATTACH_ABSORIGIN, self:GetCaster())
	ParticleManager:ReleaseParticleIndex(blink_start_particle)

	FindClearSpaceForUnit(self:GetCaster(), target:GetAbsOrigin() - self:GetCaster():GetForwardVector() * 56, false)

	local blink_end_particle = ParticleManager:CreateParticle("particles/econ/events/ti9/blink_dagger_ti9_lvl2_end.vpcf", PATTACH_ABSORIGIN, self:GetCaster())
	ParticleManager:ReleaseParticleIndex(blink_end_particle)

	-- Add particle effect
	local particle_abyssal_fx = ParticleManager:CreateParticle(particle_abyssal, PATTACH_ABSORIGIN_FOLLOW, target)
	ParticleManager:SetParticleControl(particle_abyssal_fx, 0, target:GetAbsOrigin())
	ParticleManager:ReleaseParticleIndex(particle_abyssal_fx)

        -- Apply damage
        local damt1 =self:GetCaster():GetStrength()
	local damageTable = {
		victim = target,
		attacker = self:GetCaster(),
		damage = damt1 * self:GetSpecialValueFor("dam"),
		damage_type = DAMAGE_TYPE_PURE,
		ability = self
	}

        ApplyDamage(damageTable)
end

modifier_item_abyssal_blade_v2 = class({})

function modifier_item_abyssal_blade_v2:GetTexture()return "item_abyssal_blade"
end
function modifier_item_abyssal_blade_v2:IsHidden()return true
end
function modifier_item_abyssal_blade_v2:IsPurgable()return false
end
function modifier_item_abyssal_blade_v2:IsPurgeException()return false
end
function modifier_item_abyssal_blade_v2:AllowIllusionDuplicate()return false
end

function modifier_item_abyssal_blade_v2:DeclareFunctions()
        return
        {
            MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
            MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
            MODIFIER_PROPERTY_HEALTH_BONUS,
            MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
            MODIFIER_PROPERTY_PHYSICAL_CONSTANT_BLOCK,
            MODIFIER_EVENT_ON_ATTACK_LANDED,
        }
end

function modifier_item_abyssal_blade_v2:OnCreated()
        self.ability = self:GetAbility()
        self.parent = self:GetParent()
        self.stunned = true
        self.cd = 1.5

        if not self.ability then
           return
        end
        self.bonus_damage=self.ability:GetSpecialValueFor("bonus_damage")
        self.bonus_strength=self.ability:GetSpecialValueFor("bonus_strength")
        self.stun=self.ability:GetSpecialValueFor("stun")
        self.ch_m=self.ability:GetSpecialValueFor("ch_m")
        self.ch_r=self.ability:GetSpecialValueFor("ch_r")
        self.block_chance=self.ability:GetSpecialValueFor("block_chance")
        self.block_damage_melee=self.ability:GetSpecialValueFor("block_damage_melee")
        self.block_damage_ranged=self.ability:GetSpecialValueFor("block_damage_ranged")
        self.damatt=self.ability:GetSpecialValueFor("damatt")
        self.bonus_health=self.ability:GetSpecialValueFor("bonus_health")
        self.bonus_health_regen=self.ability:GetSpecialValueFor("bonus_health_regen")
        self.damageTable2 = {
                attacker = self.parent,
                damage = self.damatt,
                ability = self.ability,
                damage_type =DAMAGE_TYPE_PHYSICAL
        }

end

function modifier_item_abyssal_blade_v2:OnIntervalThink()
        self.stunned=true
        self:StartIntervalThink(-1)
end

function modifier_item_abyssal_blade_v2:OnAttackLanded(tg)
        if not IsServer() then
            return
        end
        if tg.attacker == self.parent and not tg.target:IsBuilding() and not self.parent:IsIllusion() then
            local ch=self.parent:IsRangedAttacker() and self.ch_r or self.ch_m
            if  RollPseudoRandomPercentage(ch,0,self.ability) then
                if self.stunned==true then
                    self.stunned=false
                    self:StartIntervalThink(self.cd)
                    local duration = self.stun * (1 - tg.target:GetStatusResistance())
                    tg.target:AddNewModifier(self.parent, self.ability, "modifier_item_abyssal_blade_v2_debuff", {duration=duration})
                end
                self.damageTable2.victim = tg.target
                ApplyDamage(self.damageTable2)
            end
        end
    end

function modifier_item_abyssal_blade_v2:GetModifierPreAttack_BonusDamage()
	return self.bonus_damage
end
function modifier_item_abyssal_blade_v2:GetModifierBonusStats_Strength()
	return self.bonus_strength
end
function modifier_item_abyssal_blade_v2:GetModifierHealthBonus()
	return self.bonus_health
end
function modifier_item_abyssal_blade_v2:GetModifierConstantHealthRegen()
	return self.bonus_health_regen
end

function modifier_item_abyssal_blade_v2:GetModifierPhysical_ConstantBlock()
	if self:GetAbility() and RollPseudoRandomPercentage(self.block_chance,0,self) then
		if not self:GetParent():IsRangedAttacker() then
			return self.block_damage_melee
		else
			return self.block_damage_ranged
		end
	end
end


modifier_item_abyssal_blade_v2_debuff=class({})

function modifier_item_abyssal_blade_v2_debuff:GetTexture()return "item_abyssal_blade_v2"
end

function modifier_item_abyssal_blade_v2_debuff:IsStunDebuff() return true
end

function modifier_item_abyssal_blade_v2_debuff:IsHidden()return false
end

function modifier_item_abyssal_blade_v2_debuff:IsPurgable()return false
end

function modifier_item_abyssal_blade_v2_debuff:IsPurgeException()return true
end

function modifier_item_abyssal_blade_v2_debuff:GetEffectName()
	return "particles/generic_gameplay/generic_stunned.vpcf"
end

function modifier_item_abyssal_blade_v2_debuff:GetEffectAttachType()
	return PATTACH_OVERHEAD_FOLLOW
end

function modifier_item_abyssal_blade_v2_debuff:CheckState()
        return
        {
            [MODIFIER_STATE_STUNNED] = true,
        }
end
