pudge_meat_hook_lua = class({})

modifier_meat_hook_lua = class({})
modifier_meat_hook_followthrough_lua = class({})

LinkLuaModifier("modifier_meat_hook_followthrough_lua", "abilities/pudge_meat_hook_lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_meat_hook_lua", "abilities/pudge_meat_hook_lua", LUA_MODIFIER_MOTION_HORIZONTAL)

function modifier_meat_hook_lua:IsDebuff() return true end
function modifier_meat_hook_lua:IsStunDebuff() return true end
function modifier_meat_hook_lua:RemoveOnDeath() return false end

function modifier_meat_hook_lua:OnCreated(kv)
    if IsServer() then
        self.vStartPos = self:GetParent():GetOrigin()
        self.flTotalDistance = 0
        self.flDistanceToDamagePct = self:GetAbility():GetSpecialValueFor("distance_to_damage") or 0
        self:StartIntervalThink(0.1)
        if self:ApplyHorizontalMotionController() == false then
            self:Destroy()
        end
    end
end

function modifier_meat_hook_lua:OnIntervalThink()
    if IsServer() then
        if self:GetAbility().hVictim ~= nil and self.flDistanceToDamagePct > 0 then
            if self:GetCaster() ~= nil and self:GetParent() ~= nil then
                if self:GetCaster():GetTeamNumber() == self:GetParent():GetTeamNumber() then
                    return
                end
            end
            local vCurrentPos = self:GetParent():GetOrigin()
            local flDistance = (vCurrentPos - self.vStartPos):Length2D()
            local flNewDistance = flDistance - self.flTotalDistance
            if flNewDistance > 0 then
                local flDamagePct = (flNewDistance / 100) * self.flDistanceToDamagePct
                if flDamagePct > 0 then
                    local actualDamage = ApplyDamage({
                        victim = self:GetParent(),
                        attacker = self:GetCaster(),
                        damage = flDamagePct,
                        damage_type = DAMAGE_TYPE_PURE,
                        ability = self:GetAbility()
                    })
                    SendOverheadEventMessage(nil, OVERHEAD_ALERT_DAMAGE, self:GetParent(), math.floor(actualDamage), nil)
                end
                self.flTotalDistance = flDistance
            end
        end
    end
end

function modifier_meat_hook_lua:DeclareFunctions()
    return { MODIFIER_PROPERTY_OVERRIDE_ANIMATION }
end

function modifier_meat_hook_lua:GetOverrideAnimation()
    return ACT_DOTA_FLAIL
end

function modifier_meat_hook_lua:CheckState()
    if IsServer() then
        if self:GetCaster() ~= nil and self:GetParent() ~= nil then
            if self:GetCaster():GetTeamNumber() ~= self:GetParent():GetTeamNumber() and not self:GetParent():IsMagicImmune() then
                return { [MODIFIER_STATE_STUNNED] = true }
            end
        end
    end
    return {}
end

function modifier_meat_hook_lua:UpdateHorizontalMotion(me, dt)
    if IsServer() then
        if self:GetAbility().hVictim ~= nil then
            self:GetAbility().hVictim:SetOrigin(self:GetAbility().vProjectileLocation)
            local vToCaster = self:GetAbility().vStartPosition - self:GetCaster():GetOrigin()
            if self:GetAbility().bChainAttached == false and vToCaster:Length2D() > 128.0 then
                self:GetAbility().bChainAttached = true
                ParticleManager:SetParticleControlEnt(self:GetAbility().nChainParticleFXIndex, 0, self:GetCaster(),
                    PATTACH_CUSTOMORIGIN, "attach_hitloc", self:GetCaster():GetOrigin(), true)
                ParticleManager:SetParticleControlEnt(self:GetAbility().nChainParticleFXIndex, 0,
                    self:GetAbility().vStartPosition + self:GetAbility().vHookOffset)
            end
        end
    end
end

function modifier_meat_hook_lua:OnHorizontalMotionInterrupted()
    if IsServer() then
        if self:GetAbility().hVictim ~= nil then
            ParticleManager:SetParticleControlEnt(self:GetAbility().nChainParticleFXIndex, 1, self:GetCaster(),
                PATTACH_POINT_FOLLOW, "attach_weapon_chain_rt",
                self:GetCaster():GetAbsOrigin() + self:GetAbility().vHookOffset, true)
            self:Destroy()
        end
    end
end

function modifier_meat_hook_followthrough_lua:IsHidden() return true end
function modifier_meat_hook_followthrough_lua:IsPurgable() return false end

function modifier_meat_hook_followthrough_lua:CheckState()
    return { [MODIFIER_STATE_COMMAND_RESTRICTED] = true }
end

function pudge_meat_hook_lua:OnAbilityPhaseStart()
    self:GetCaster():StartGesture(ACT_DOTA_OVERRIDE_ABILITY_1)
    return true
end

function pudge_meat_hook_lua:OnAbilityPhaseInterrupted()
    self:GetCaster():RemoveGesture(ACT_DOTA_OVERRIDE_ABILITY_1)
end

function pudge_meat_hook_lua:GetCastRange()
    local base_distance = self:GetSpecialValueFor("hook_base_distance")
    local distance_per_strength = self:GetSpecialValueFor("hook_distance_per_strength")
    local strength = self:GetCaster():GetStrength()
    return base_distance + math.min(distance_per_strength * strength, 12000)
end

function pudge_meat_hook_lua:OnSpellStart()
    self.bIgnoreAllies = self:GetAutoCastState()
    self.bChainAttached = false
    if self.hVictim ~= nil then
        self.hVictim:InterruptMotionControllers(true)
    end

    self.hook_damage = self:GetSpecialValueFor("hook_damage")
    self.hook_speed = self:GetSpecialValueFor("hook_speed")
    self.hook_width = self:GetSpecialValueFor("hook_width")
    self.hook_distance = self:GetCastRange()  -- 复用 GetCastRange，避免重复计算
    self.hook_followthrough_constant = self:GetSpecialValueFor("hook_followthrough_constant")
    self.vision_radius = self:GetSpecialValueFor("vision_radius")
    self.vision_duration = self:GetSpecialValueFor("vision_duration")

    if self:GetCaster() and self:GetCaster():IsHero() then
        local hHook = self:GetCaster():GetTogglableWearable(DOTA_LOADOUT_TYPE_WEAPON)
        if hHook ~= nil then hHook:AddEffects(EF_NODRAW) end
    end

    self.vStartPosition = self:GetCaster():GetOrigin()
    self.vProjectileLocation = self.vStartPosition

    local vDir = self:GetCursorPosition() - self.vStartPosition
    vDir.z = 0.0
    local vDirNorm = vDir:Normalized()  -- 单位方向向量，后续复用
    self.vTargetPosition = self.vStartPosition + vDirNorm * self.hook_distance

    local flFollowthroughDuration = self.hook_distance / self.hook_speed * self.hook_followthrough_constant
    self:GetCaster():AddNewModifier(self:GetCaster(), self, "modifier_meat_hook_followthrough_lua",
        { duration = flFollowthroughDuration })

    self.vHookOffset = Vector(0, 0, 96)
    local vHookTarget = self.vTargetPosition + self.vHookOffset
    local vKillswitch = Vector((self.hook_distance / self.hook_speed) * 2, 0, 0)

    self.nChainParticleFXIndex = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_pudge/pudge_meathook.vpcf", PATTACH_CUSTOMORIGIN, nil)
    ParticleManager:SetParticleAlwaysSimulate(self.nChainParticleFXIndex)
    ParticleManager:SetParticleControlEnt(self.nChainParticleFXIndex, 0, self:GetCaster(), PATTACH_POINT_FOLLOW,
        "attach_weapon_chain_rt", self:GetCaster():GetOrigin() + self.vHookOffset, true)
    ParticleManager:SetParticleControl(self.nChainParticleFXIndex, 1, vHookTarget)
    ParticleManager:SetParticleControl(self.nChainParticleFXIndex, 2,
        Vector(self.hook_speed, self.hook_distance, self.hook_width))
    ParticleManager:SetParticleControl(self.nChainParticleFXIndex, 3, vKillswitch)
    ParticleManager:SetParticleControl(self.nChainParticleFXIndex, 4, Vector(1, 0, 0))
    ParticleManager:SetParticleControl(self.nChainParticleFXIndex, 5, Vector(0, 0, 0))
    ParticleManager:SetParticleControlEnt(self.nChainParticleFXIndex, 7, self:GetCaster(), PATTACH_CUSTOMORIGIN, nil,
        self:GetCaster():GetOrigin(), true)

    EmitSoundOn("Hero_Pudge.AttackHookExtend", self:GetCaster())

    local targetTeam = self.bIgnoreAllies and DOTA_UNIT_TARGET_TEAM_ENEMY or DOTA_UNIT_TARGET_TEAM_BOTH

    ProjectileManager:CreateLinearProjectile({
        Ability = self,
        vSpawnOrigin = self:GetCaster():GetOrigin(),
        vVelocity = vDirNorm * self.hook_speed,  -- 直接用单位方向向量，无需再 Normalized
        fDistance = self.hook_distance,
        fStartRadius = self.hook_width,
        fEndRadius = self.hook_width,
        Source = self:GetCaster(),
        iUnitTargetTeam = targetTeam,
        iUnitTargetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        iUnitTargetFlags = DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_NOT_ANCIENTS +
            DOTA_UNIT_TARGET_FLAG_INVULNERABLE,
    })

    self.bRetracting = false
    self.hVictim = nil
end

function pudge_meat_hook_lua:OnProjectileHit(hTarget, vLocation)
    if hTarget == self:GetCaster() then return false end
    if hTarget ~= nil and hTarget:GetUnitName() == "witch_doctor_death_ward_datadriven" then return false end
    if self.bIgnoreAllies and hTarget ~= nil and hTarget:GetTeamNumber() == self:GetCaster():GetTeamNumber() then
        return false
    end

    if self.bRetracting == false then
        if hTarget ~= nil and not (hTarget:IsCreep() or hTarget:IsConsideredHero()) then return false end
        if hTarget ~= nil and hTarget:GetName() == "npc_dota_creep_siege" then return false end

        local bTargetPulled = false
        if hTarget ~= nil then
            EmitSoundOn("Hero_Pudge.AttackHookImpact", hTarget)
            hTarget:AddNewModifier(self:GetCaster(), self, "modifier_meat_hook_lua", nil)

            if hTarget:GetTeamNumber() ~= self:GetCaster():GetTeamNumber() then
                ApplyDamage({
                    victim = hTarget,
                    attacker = self:GetCaster(),
                    damage = self.hook_damage,
                    damage_type = DAMAGE_TYPE_PURE,
                    ability = self
                })
                if not hTarget:IsMagicImmune() then hTarget:Interrupt() end
                local nFXIndex = ParticleManager:CreateParticle(
                    "particles/units/heroes/hero_pudge/pudge_meathook_impact.vpcf", PATTACH_CUSTOMORIGIN, hTarget)
                ParticleManager:SetParticleControlEnt(nFXIndex, 0, hTarget, PATTACH_POINT_FOLLOW, "attach_hitloc",
                    self:GetCaster():GetOrigin(), true)
                ParticleManager:ReleaseParticleIndex(nFXIndex)
            end

            AddFOWViewer(self:GetCaster():GetTeamNumber(), hTarget:GetOrigin(), self.vision_radius, self.vision_duration, false)
            self.hVictim = hTarget
            bTargetPulled = true
        end

        local vHookPos = self.vTargetPosition
        local flPad = self:GetCaster():GetPaddedCollisionRadius()
        if hTarget ~= nil then
            vHookPos = hTarget:GetOrigin()
            flPad = flPad + hTarget:GetPaddedCollisionRadius()
        end

        local vVelocity = self.vStartPosition - vHookPos
        vVelocity.z = 0.0
        local flDistance = vVelocity:Length2D() - flPad

        ProjectileManager:CreateLinearProjectile({
            Ability = self,
            vSpawnOrigin = vHookPos,
            vVelocity = vVelocity:Normalized() * self.hook_speed,
            fDistance = flDistance,
            Source = self:GetCaster(),
        })
        self.vProjectileLocation = vHookPos

        if hTarget ~= nil and not hTarget:IsInvisible() and bTargetPulled then
            ParticleManager:SetParticleControlEnt(self.nChainParticleFXIndex, 1, hTarget, PATTACH_POINT_FOLLOW,
                "attach_hitloc", hTarget:GetOrigin() + self.vHookOffset, true)
            ParticleManager:SetParticleControl(self.nChainParticleFXIndex, 4, Vector(0, 0, 0))
            ParticleManager:SetParticleControl(self.nChainParticleFXIndex, 5, Vector(1, 0, 0))
        else
            ParticleManager:SetParticleControlEnt(self.nChainParticleFXIndex, 1, self:GetCaster(), PATTACH_POINT_FOLLOW,
                "attach_weapon_chain_rt", self:GetCaster():GetOrigin() + self.vHookOffset, true)
        end

        -- hTarget 可能为 nil（钩空时），fallback 到 caster 避免崩溃
        EmitSoundOn("Hero_Pudge.AttackHookRetract", hTarget or self:GetCaster())
        if self:GetCaster():IsAlive() then
            self:GetCaster():RemoveGesture(ACT_DOTA_OVERRIDE_ABILITY_1)
            self:GetCaster():StartGesture(ACT_DOTA_CHANNEL_ABILITY_1)
        end
        self.bRetracting = true
    else
        if self:GetCaster() and self:GetCaster():IsHero() then
            local hHook = self:GetCaster():GetTogglableWearable(DOTA_LOADOUT_TYPE_WEAPON)
            if hHook ~= nil then hHook:RemoveEffects(EF_NODRAW) end
        end

        if self.hVictim ~= nil then
            self.hVictim:InterruptMotionControllers(true)
            self.hVictim:RemoveModifierByName("modifier_meat_hook_lua")
            local vVictimPosCheck = self.hVictim:GetOrigin() - vLocation
            local flPad = self:GetCaster():GetPaddedCollisionRadius() + self.hVictim:GetPaddedCollisionRadius()
            if vVictimPosCheck:Length2D() > flPad then
                FindClearSpaceForUnit(self.hVictim, self.vStartPosition, false)
            end
        end

        self.hVictim = nil
        ParticleManager:DestroyParticle(self.nChainParticleFXIndex, true)
        EmitSoundOn("Hero_Pudge.AttachHookRetractStop", self:GetCaster())
    end

    return true
end

function pudge_meat_hook_lua:OnProjectileThink(vLocation)
    self.vProjectileLocation = vLocation
end

function pudge_meat_hook_lua:OnOwnerDied()
    self:GetCaster():RemoveGesture(ACT_DOTA_OVERRIDE_ABILITY_1)
    self:GetCaster():RemoveGesture(ACT_DOTA_CHANNEL_ABILITY_1)
end
