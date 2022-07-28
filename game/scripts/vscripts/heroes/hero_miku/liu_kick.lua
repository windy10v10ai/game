LinkLuaModifier("modifier_liu_kick", "heroes/hero_miku/liu_kick", LUA_MODIFIER_MOTION_HORIZONTAL)

liu_kick = class({})

function liu_kick:IsStealable() return true end
function liu_kick:IsHiddenWhenStolen() return false end
--function liu_kick:IsHiddenAbilityCastable() return true end
function liu_kick:GetAOERadius()
    return self:GetSpecialValueFor("radius")
end
function liu_kick:OnSpellStart()
    local caster = self:GetCaster()
    local target = self:GetCursorTarget()
    local damage = self:GetSpecialValueFor("damage")
    if target:TriggerSpellAbsorb(self) then
        self.TriggerSpellAbsorb = true

        caster:Interrupt()

        return nil
    end

    caster:AddNewModifier(caster, self, "modifier_liu_kick", {damage = damage})
    -- EmitSoundOn("miku.3_"..RandomInt(1, 3), self:GetCaster())
end



---------------------------------------------------------------------------------------------------------------------
modifier_liu_kick = class({})
function modifier_liu_kick:IsHidden() return true end
function modifier_liu_kick:IsDebuff() return false end
function modifier_liu_kick:IsPurgable() return false end
function modifier_liu_kick:IsPurgeException() return false end
function modifier_liu_kick:RemoveOnDeath() return true end
function modifier_liu_kick:GetPriority() return MODIFIER_PRIORITY_HIGH end
function modifier_liu_kick:CheckState()
    local state = { [MODIFIER_STATE_NO_UNIT_COLLISION] = true,
                    [MODIFIER_STATE_COMMAND_RESTRICTED] = true, }

    if self.target and not self.target:IsNull() and self.target:HasFlyMovementCapability() then
        state[MODIFIER_STATE_FLYING] = true
    else
        state[MODIFIER_STATE_FLYING] = false
    end

    return state
end
function modifier_liu_kick:DeclareFunctions()
    local funcs = { MODIFIER_PROPERTY_OVERRIDE_ANIMATION, }
    return funcs
end
function modifier_liu_kick:GetOverrideAnimation()
    return ACT_DOTA_OVERRIDE_ABILITY_1
end
function modifier_liu_kick:OnCreated(hTable)
    self.caster = self:GetCaster()
    self.parent = self:GetParent()
    self.ability = self:GetAbility()
	self.stunDuration = self:GetAbility():GetSpecialValueFor( "stun_duration" )
	if self.caster:HasModifier("modifier_chibi_monster") then
        self:PlayEffects2()
	end

    if IsServer() then
        self.target = self.ability:GetCursorTarget()

        self.damage = hTable.damage
        self.speed = self.ability:GetSpecialValueFor("speed")

        self.range_knockback = self.ability:GetSpecialValueFor("range_knockback")

        self.latch_offset = 150


        if self:ApplyHorizontalMotionController() == false then
            self:Destroy()
        end
    end
end
function modifier_liu_kick:PlayEffects2( )
self.parent = self:GetParent()
	if not self.particle_time2 then
        self.particle_time2 = ParticleManager:CreateParticle("particles/calne_kick_trail.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent)
    end
end
function modifier_liu_kick:OnRefresh(hTable)
    self:OnCreated(hTable)
end
function modifier_liu_kick:OnDestroy()
    if IsServer() then
        self.parent:InterruptMotionControllers(true)

        if self.particle_time2 then
		ParticleManager:DestroyParticle(self.particle_time2, false)
        ParticleManager:ReleaseParticleIndex(self.particle_time2)
end
    end
end
function modifier_liu_kick:UpdateHorizontalMotion(me, dt)
    local UFilter = UnitFilter( self.target,
                                self.ability:GetAbilityTargetTeam(),
                                self.ability:GetAbilityTargetType(),
                                self.ability:GetAbilityTargetFlags(),
                                self.parent:GetTeamNumber() )

    if UFilter ~= UF_SUCCESS then
        self:Destroy()

        return nil
    end

    if (self.target:GetOrigin() - self.parent:GetOrigin()):Length2D() < self.latch_offset then
        self:PlayEffects()

        self:Destroy()
        return nil
    end

    self:Charge(me, dt)
end
function modifier_liu_kick:PlayEffects()
    local position = self.target:GetAbsOrigin()
    local damage = self.damage
    if self.particle_time2 then
		ParticleManager:DestroyParticle(self.particle_time2, false)
        ParticleManager:ReleaseParticleIndex(self.particle_time2)
    end

    if self.caster:HasModifier("modifier_miku_arcana") then
        local hit_fx =  ParticleManager:CreateParticle("particles/miku_3_calne_exp.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent)
                        ParticleManager:SetParticleControlEnt(  hit_fx,
                                                                0,
                                                                self.target,
                                                                PATTACH_ABSORIGIN_FOLLOW,
                                                                "attach_hitloc",
                                                                self.target:GetAbsOrigin(),
                                                                true)

                        ParticleManager:ReleaseParticleIndex(hit_fx)
    else
        local hit_fx =  ParticleManager:CreateParticle("particles/miku_3_exp.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent)
                        ParticleManager:SetParticleControlEnt(  hit_fx,
                                                                0,
                                                                self.target,
                                                                PATTACH_ABSORIGIN_FOLLOW,
                                                                "attach_hitloc",
                                                                self.target:GetAbsOrigin(),
                                                                true)

                        ParticleManager:ReleaseParticleIndex(hit_fx)
    end

    local knockback = { should_stun = 0,
                        knockback_duration = 0.5,
                        duration = 0.5,
                        knockback_distance = self.range_knockback,
                        knockback_height = 0,
                        center_x = self.parent:GetAbsOrigin().x,
                        center_y = self.parent:GetAbsOrigin().y,
                        center_z = self.parent:GetAbsOrigin().z }

    self.target:AddNewModifier(self.parent, self.ability, "modifier_knockback", knockback)


    local enemies = FindUnitsInRadius(  self.parent:GetTeamNumber(),
                                        position,
                                        nil,
                                        self.ability:GetAOERadius(),
                                        self.ability:GetAbilityTargetTeam(),
                                        self.ability:GetAbilityTargetType(),
                                        self.ability:GetAbilityTargetFlags(),
                                        FIND_ANY_ORDER,
                                        false)

    local blow_fx =     ParticleManager:CreateParticle("", PATTACH_CUSTOMORIGIN, self.parent)
                        ParticleManager:SetParticleControl(blow_fx, 0, position)
                        --[[ParticleManager:SetParticleControlEnt(  blow_fx,
                                                                0,
                                                                self.target,
                                                                PATTACH_POINT_FOLLOW,
                                                                "attach_hitloc",
                                                                Vector(0,0,0),
                                                                true)]]
                        ParticleManager:ReleaseParticleIndex(blow_fx)

    for _, enemy in pairs(enemies) do
        if enemy and not enemy:IsNull() and IsValidEntity(enemy) then
            local damage_table = {  victim = enemy,
                                    attacker = self.parent,
                                    damage = damage,
                                    damage_type = self.ability:GetAbilityDamageType(),
                                    ability = self.ability,
									}

            ApplyDamage(damage_table)
            -- normal attck
            self:GetCaster():PerformAttack (
            enemy,
            true,
            true,
            true,
            false,
            true,
            false,
            true)


            if self:GetCaster():HasModifier("modifier_chibi_monster") then
                -- stun the enemy
                local duration = self.stunDuration * (1 - enemy:GetStatusResistance())
                enemy:AddNewModifier(
                    self:GetCaster(), -- player source
                    self, -- ability source
                    "modifier_stunned", -- modifier name
                    { duration = duration } -- kv
                )
            end
        end
    end

    -- EmitSoundOnLocationWithCaster(position, "miku.2", self.parent)
end
function modifier_liu_kick:Charge(me, dt)
    if self.parent:IsStunned() then
        return nil
    end

    local pos = self.parent:GetOrigin()
    local targetpos = self.target:GetOrigin()

    local direction = targetpos - pos
    direction.z = 0
    local target = pos + direction:Normalized() * (self.speed * dt)

    self.parent:SetOrigin(target)
    self.parent:FaceTowards(targetpos)
end
function modifier_liu_kick:OnHorizontalMotionInterrupted()
    if IsServer() then
        self:Destroy()
    end
end
