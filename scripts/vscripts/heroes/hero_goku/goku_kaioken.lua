LinkLuaModifier("modifier_goku_kaioken", "heroes/hero_goku/goku_kaioken", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_goku_kaioken_trigger", "heroes/hero_goku/goku_kaioken", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_goku_kaioken_active", "heroes/hero_goku/goku_kaioken", LUA_MODIFIER_MOTION_NONE)

goku_kaioken = goku_kaioken or class({})
modifier_goku_kaioken = modifier_goku_kaioken or class({})
modifier_goku_kaioken_trigger = modifier_goku_kaioken_trigger or class({})
modifier_goku_kaioken_active = modifier_goku_kaioken_active or class({})

function goku_kaioken:GetBehavior()
    if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
		return DOTA_ABILITY_BEHAVIOR_POINT
	else
		return self.BaseClass.GetBehavior(self)
	end
end

function goku_kaioken:GetAbilityTextureName()
	if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
		return "custom/goku/goku_kaioken_ss"
	else
		return "custom/goku/goku_kaioken"
	end
end

function goku_kaioken:GetIntrinsicModifierName()
    return "modifier_goku_kaioken"
end

function goku_kaioken:GetCastRange()
    if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
        return self:GetSpecialValueFor("super_saiyan_range")
    end
end

function goku_kaioken:GetCooldown()
    if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
        return self:GetSpecialValueFor("super_saiyan_cooldown")
    end
end

function goku_kaioken:OnSpellStart()
    local location = self:GetCursorPosition()
    local caster = self:GetCaster()
    local caster_origin = caster:GetAbsOrigin()
    local radius = self:GetSpecialValueFor("super_saiyan_radius")
    local tick = self:GetSpecialValueFor("super_saiyan_tick")
    caster:EmitSound("goku.2")
    if self.particle_model then
        ParticleManager:DestroyParticle(self.particle_model,false)
        ParticleManager:ReleaseParticleIndex(self.particle_model)
    end

    self.particle_model = ParticleManager:CreateParticle("particles/custom/goku/goku_kaioken_active_model.vpcf", PATTACH_WORLDORIGIN, caster)
    ParticleManager:SetParticleControl(self.particle_model, 0,  caster:GetAbsOrigin())
	ParticleManager:SetParticleControlForward(self.particle_model, 1,  caster:GetForwardVector())

    local particle_ring = ParticleManager:CreateParticle("particles/custom/goku/goku_kaioken_active_cast_ring.vpcf", PATTACH_WORLDORIGIN, caster)
    ParticleManager:SetParticleFoWProperties(particle_ring, 0, -1, radius)
    ParticleManager:SetParticleControl(particle_ring,0,location)
    ParticleManager:SetParticleControl(particle_ring,1,Vector(radius,0,0))
    ParticleManager:ReleaseParticleIndex(particle_ring)

    if self.enemies and #self.enemies ~= 0 then
        for key, enemy in pairs(self.enemies) do
            local t_particle = self.particle_tags[enemy:GetEntityIndex()]
            ParticleManager:DestroyParticle(t_particle,false)
            ParticleManager:ReleaseParticleIndex(t_particle)
        end
    end

    self.enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        location,
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_DAMAGE_FLAG_NONE,
        FIND_CLOSEST,
        false
    )

    self.particle_tags = {}
    for _, enemy in ipairs(self.enemies) do
        local particle_tag = ParticleManager:CreateParticle("particles/custom/goku/goku_kaioken_active_targetted_marker.vpcf", PATTACH_OVERHEAD_FOLLOW, enemy)
        self.particle_tags[enemy:GetEntityIndex()] = particle_tag
    end

    caster:AddNewModifier(caster,self,"modifier_goku_kaioken_active",{})
    caster:SetContextThink("AttackEveryOne", function ()
        if #self.enemies == 0 then
            if self.target then
                local particle_line = ParticleManager:CreateParticle("particles/custom/goku/children/goku_kaioken_active_trail.vpcf", PATTACH_WORLDORIGIN,self.target)
                ParticleManager:SetParticleControl(particle_line,0,self.target:GetAbsOrigin())
                ParticleManager:SetParticleControl(particle_line,1,caster_origin)
            end

            if self.particle_model then
                ParticleManager:DestroyParticle(self.particle_model,false)
                ParticleManager:ReleaseParticleIndex(self.particle_model)
                self.particle_model = nil
            end


            self.target = nil
            caster:SetAbsOrigin(caster_origin)
            caster:RemoveModifierByName("modifier_goku_kaioken_active")
            return nil
        end

        if self.target == nil then
            self.target = caster
        end

        local target = table.remove(self.enemies,1)
        local t_particle = self.particle_tags[target:GetEntityIndex()]


        local particle_line = ParticleManager:CreateParticle("particles/custom/goku/goku_kaioken_active_trail.vpcf", PATTACH_WORLDORIGIN,self.target)
        ParticleManager:SetParticleControl(particle_line,0,self.target:GetAbsOrigin())
        ParticleManager:SetParticleControl(particle_line,1,target:GetAbsOrigin())

        caster:SetAbsOrigin(target:GetAbsOrigin() + target:GetForwardVector() * 128)

        caster:PerformAttack(target, true, true, true, true, false, false, true)

        ParticleManager:ReleaseParticleIndex(particle_line)

        local particle_hit = ParticleManager:CreateParticle("particles/econ/items/drow/drow_ti6_gold/drow_ti6_silence_gold_arrow_hit.vpcf", PATTACH_WORLDORIGIN, target)
        ParticleManager:SetParticleControlEnt(particle_hit, 1, target, PATTACH_POINT_FOLLOW, "attach_hitloc", target:GetAbsOrigin(), true)
        ParticleManager:ReleaseParticleIndex(particle_hit)

        ParticleManager:DestroyParticle(t_particle,false)
        ParticleManager:ReleaseParticleIndex(t_particle)
        self.target = target
        return tick
    end,0)
end

function modifier_goku_kaioken:DeclareFunctions()
    local funcs = {
        MODIFIER_EVENT_ON_ATTACK_LANDED,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT
    }
    return funcs
end

function modifier_goku_kaioken:GetModifierAttackSpeedBonus_Constant()
    if not self:GetParent():PassivesDisabled() then
        return self:GetAbility():GetSpecialValueFor("bonus_attackspeed")
    end
end

function modifier_goku_kaioken:OnAttackLanded(keys)
    local attacker = keys.attacker
    local parent = self:GetParent()
    if not parent:IsIllusion() and not parent:PassivesDisabled() and attacker == parent then
        local target = keys.target
        if not target:IsBuilding() and target:GetClassname() ~= "dota_item_drop" and target:IsAlive() then
            local ability = self:GetAbility()
            local chance = ability:GetSpecialValueFor("chance")
            if RollPseudoRandomPercentage(chance,DOTA_PSEUDO_RANDOM_CUSTOM_GAME_1, parent) then
                local stun_time = ability:GetSpecialValueFor("stun_duration")
                target:AddNewModifier(parent,ability,"modifier_stunned",{duration = stun_time * (1-target:GetStatusResistance()),target = target})
                parent:AddNewModifier(parent,ability,"modifier_goku_kaioken_trigger",{duration = 0.3,target_index = target:GetEntityIndex()})
            end
        end
    end
end


function modifier_goku_kaioken_trigger:IsHidden() 		return true end
function modifier_goku_kaioken_trigger:IsPurgeException() return false end
function modifier_goku_kaioken_trigger:RemoveOnDeath() return false end
function modifier_goku_kaioken_trigger:GetAttributes()	return MODIFIER_ATTRIBUTE_MULTIPLE end

function modifier_goku_kaioken_trigger:OnCreated(keys)
    if not IsServer() then return end
    local parent = self:GetParent()
    self.target = EntIndexToHScript(keys.target_index)
    local particle
    if parent:HasModifier("modifier_goku_super_saiyan") then
        particle = ParticleManager:CreateParticle("particles/custom/goku/goku_kaioken_trigger_super_saiyan.vpcf",PATTACH_ABSORIGIN_FOLLOW, self.target)
        ParticleManager:SetParticleControl(particle,60,Vector(255,255,0))
    else
        particle = ParticleManager:CreateParticle("particles/custom/goku/goku_kaioken_trigger.vpcf",PATTACH_ABSORIGIN_FOLLOW, self.target)
        ParticleManager:SetParticleControl(particle,60,Vector(0,255,255))
    end
    ParticleManager:SetParticleControlEnt(particle, 1, self.target, PATTACH_POINT_FOLLOW, "attach_hitloc", self.target:GetAbsOrigin(), true)
    ParticleManager:SetParticleControlEnt(particle, 2, parent, PATTACH_POINT_FOLLOW, "attach_hitloc", parent:GetAbsOrigin(), true)
    ParticleManager:SetParticleControlEnt(particle, 4, self.target, PATTACH_ABSORIGIN_FOLLOW, "", self.target:GetAbsOrigin(), true)
    ParticleManager:ReleaseParticleIndex(particle)
end

function modifier_goku_kaioken_trigger:OnDestroy()
    if not IsServer() then return end
    local parent = self:GetParent()
    parent:PerformAttack(self.target, true, true, true, true, false, false, true)
end

function modifier_goku_kaioken_active:IsHidden() return true end
function modifier_goku_kaioken_active:IsPurgeException() return false end
function modifier_goku_kaioken_active:OnCreated()
    if not IsServer() then return end
    self:GetParent():AddNoDraw()
end

function modifier_goku_kaioken_active:OnDestroy()
    if not IsServer() then return end
    self:GetParent():RemoveNoDraw()
end


function modifier_goku_kaioken_active:CheckState()
    return {[MODIFIER_STATE_INVULNERABLE] = true}
end
