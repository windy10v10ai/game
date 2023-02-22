LinkLuaModifier("modifier_sword_master_chop_swift_incomparable_swordsmanship_move", "Heroes/sword_master/sword_master_chop_swift_incomparable_swordsmanship.lua", LUA_MODIFIER_MOTION_HORIZONTAL)
sword_master_chop_swift_incomparable_swordsmanship = sword_master_chop_swift_incomparable_swordsmanship or class({})
modifier_sword_master_chop_swift_incomparable_swordsmanship_move = modifier_sword_master_chop_swift_incomparable_swordsmanship_move or class({})

function sword_master_chop_swift_incomparable_swordsmanship:Precache(context)
    PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_faceless_void.vsndevts", context )
end


function sword_master_chop_swift_incomparable_swordsmanship:OnAbilityPhaseStart()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:AddMagicImmune()
    end
end

function sword_master_chop_swift_incomparable_swordsmanship:OnAbilityPhaseInterrupted()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:RemoveMagicImmune()
    end
end

function sword_master_chop_swift_incomparable_swordsmanship:OnSpellStart()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:RemoveMagicImmune()
    end

    self.attack_times = self:GetSpecialValueFor("attack_times")
    self.damage_pre = self:GetSpecialValueFor("damage_pre") / 100
    self.damageTable = {
        victim = nil,
        attacker = caster,
        damage = 0,
        damage_type = DAMAGE_TYPE_PURE,
        damage_flags = DOTA_DAMAGE_FLAG_NONE,
        ability = self,
    }
    caster:AddNewModifier(caster, self, "modifier_sword_master_chop_swift_incomparable_swordsmanship_move", {})

    local particle_text = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_chop_swift_incomparable_swordsmanship_head.vpcf", PATTACH_OVERHEAD_FOLLOW, caster )
    ParticleManager:SetParticleControl(particle_text,0,caster:GetAbsOrigin())
    
    caster:EmitSound("Greevil.ColdSnap.Cast")
end

function sword_master_chop_swift_incomparable_swordsmanship:OnProjectileThink(location)
    if not IsServer() then return end
    local caster = self:GetCaster()
    local modi_move = caster:FindModifierByName("modifier_sword_master_chop_swift_incomparable_swordsmanship_move")
    if modi_move ~= nil then
        modi_move.location = location
    end
end

function sword_master_chop_swift_incomparable_swordsmanship:OnProjectileHit(target,location)
    if not IsServer() then return end
    if target ~= nil then
        local caster = self:GetCaster()
        local ability_chop = caster:FindAbilityByName("sword_master_chop")
        local i = 0
        local tick = self:GetSpecialValueFor("attack_interval")
        Timers:CreateTimer(tick,function ()
            if i == self.attack_times then
                return
            end
            self.damageTable.victim = target
            self.damageTable.damage = target:GetHealth() * self.damage_pre
            ApplyDamage(self.damageTable)
            if ability_chop ~= nil then
                ability_chop:ChopAttack(caster,target)
            else
                caster:PerformAttack(target, true, true, true, true, false, false, true)
            end
            i = i + 1

            local particle_impact = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_chop_kill_everyone_in_world_tgt.vpcf", PATTACH_POINT_FOLLOW, target)
            ParticleManager:SetParticleControlEnt(particle_impact, 0, target, PATTACH_POINT_FOLLOW , "attach_hitloc", target:GetAbsOrigin(),true)
            ParticleManager:DestroyParticle(particle_impact, false)
            ParticleManager:ReleaseParticleIndex(particle_impact)
            return tick
        end)
    end
end

function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:IsHidden() return true end
function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:IsPurgable() return false end
function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:IsPurgeException() return false end

function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:OnCreated(keys)
    if not IsServer() then return end
    local parent = self:GetParent()
    local ability = self:GetAbility()
    local endLocation = ability:GetCursorPosition()
    local startLocation = parent:GetAbsOrigin()
    local distance = (endLocation - startLocation):Length2D()
    local speed = ability:GetSpecialValueFor("speed")
    local width = ability:GetSpecialValueFor("width")

    parent:StartGestureWithPlaybackRate(ACT_DOTA_CAST_ABILITY_7,2)
    self.location = startLocation

    if self.projectile ~= nil then
        ProjectileManager:DestroyLinearProjectile(self.projectile)
    end

    self.projectile = ProjectileManager:CreateLinearProjectile({
        Ability				= ability,
        vSpawnOrigin		= startLocation,
        fDistance			= distance,
        fStartRadius		= width,
        fEndRadius			= width,
        Source				= parent,
        bHasFrontalCone		= false,
        bReplaceExisting	= false,
        iUnitTargetTeam		= DOTA_UNIT_TARGET_TEAM_ENEMY,
        iUnitTargetFlags	= DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
        iUnitTargetType		= DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        fExpireTime 		= GameRules:GetGameTime() + 5.0,
        bDeleteOnHit		= false,
        vVelocity			= (endLocation - startLocation):Normalized() * speed,
        bProvidesVision		= true,
        iVisionRadius		= width,
        iVisionTeamNumber	= parent:GetTeamNumber(),
    })

    if self.particle == nil then
        self.particle = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_chop_swift_incomparable_swordsmanship.vpcf", PATTACH_ABSORIGIN_FOLLOW , parent)
    end

    if self:ApplyHorizontalMotionController() == false then
        self:Destroy()
    end
end

function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:GetStatusEffectName()
    return "particles/heroes/sword_master/sword_master_chop_swift_incomparable_swordsmanship_status_effect.vpcf"
end

function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:OnRefresh(keys)
    self:OnCreated(keys)
end

function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:UpdateHorizontalMotion( me, dt )
	if not IsServer() then return end

    if not ProjectileManager:IsValidProjectile(self.projectile) then
        self:Destroy()
    end

	me:SetAbsOrigin(self.location)
end

function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:CheckState()
    return {[MODIFIER_STATE_STUNNED] = true}
end

function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:OnHorizontalMotionInterrupted()
	self:Destroy()
end

function modifier_sword_master_chop_swift_incomparable_swordsmanship_move:OnDestroy()
    if not IsServer() then return end

    local parent = self:GetParent()
    parent:FadeGesture(ACT_DOTA_CAST_ABILITY_7)
    Timers:CreateTimer(FrameTime(),function ()
        ParticleManager:DestroyParticle(self.particle, false)
        ParticleManager:ReleaseParticleIndex(self.particle)
        self.particle = nil
    end)
    parent:RemoveHorizontalMotionController( self )
end
