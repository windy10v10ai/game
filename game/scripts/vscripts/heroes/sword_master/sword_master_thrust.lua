LinkLuaModifier("modifier_sword_master_thrust_count","Heroes/sword_master/sword_master_thrust.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_thrust_move", "Heroes/sword_master/sword_master_thrust.lua", LUA_MODIFIER_MOTION_HORIZONTAL)
LinkLuaModifier("modifier_sword_master_thrust_movespeed_bonus", "Heroes/sword_master/sword_master_thrust.lua", LUA_MODIFIER_MOTION_HORIZONTAL)

sword_master_thrust = sword_master_thrust or class({})
modifier_sword_master_thrust_count = modifier_sword_master_thrust_count or class({})
modifier_sword_master_thrust_move = modifier_sword_master_thrust_move or class({})
modifier_sword_master_thrust_movespeed_bonus = modifier_sword_master_thrust_movespeed_bonus or class({})

function sword_master_thrust:Precache(context)
	PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_juggernaut.vsndevts", context )
end

function sword_master_thrust:Spawn()
    local caster = self:GetCaster()
    if caster.combos == nil then
        caster.combos = {}
    end
end

function sword_master_thrust:CastFilterResultLocation()
    if not IsServer() then return end
    local caster = self:GetCaster()
    local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
    if modi_count and modi_count:GetStackCount() == 0 then
        return UF_FAIL_CUSTOM
    end

    return UF_SUCCESS
end

function sword_master_thrust:GetCustomCastErrorLocation()
    return "执剑泰斗点数不足"
end

function sword_master_thrust:OnProjectileThink(location)
    if not IsServer() then return end
    local caster = self:GetCaster()
    local modi_move = caster:FindModifierByName("modifier_sword_master_thrust_move")
    if modi_move ~= nil then
        modi_move.location = location
    end
end

function sword_master_thrust:OnProjectileHit(target,location)
    if not IsServer() then return end
    if target ~= nil then
        local caster = self:GetCaster()
        local ability_arbiter = caster:FindAbilityByName("sword_master_arbiter")
        if ability_arbiter ~= nil then
            ability_arbiter:ArbiterAttack(caster,target)
        else
            caster:AddNewModifier(caster, self, "modifier_tidehunter_anchor_smash_caster", {})
            caster:PerformAttack(target, false, false, true, true, false, false, true)
            caster:RemoveModifierByName("modifier_tidehunter_anchor_smash_caster")
        end
    end
end

function sword_master_thrust:OnSpellStart()
    local caster = self:GetCaster()
    self:AddThrustCount()

    caster:AddNewModifier(caster, self, "modifier_sword_master_thrust_move", {})
end


function sword_master_thrust:AddThrustCount()
    local caster = self:GetCaster()
    if caster:HasAbility("sword_master_chop") then

        table.insert(caster.combos,caster:AddNewModifier(caster, self, "modifier_sword_master_thrust_count", {}))
        if #caster.combos > 3 then
            caster.combos[1]:Destroy()
            table.remove(caster.combos,1)
        end
    end

    if IsServer() then
        if caster:HasAbility("sword_master_chop") then

            if #caster.combos == 3 then
                local ability = caster:FindAbilityByName("sword_master_chop")
                ability:SetUltimateType(true)
            end
        end

        local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
        if modi_count ~= nil then
            modi_count:CastCharge(1)
        end
    end
end

function modifier_sword_master_thrust_count:RemoveOnDeath() return false end
function modifier_sword_master_thrust_count:IsPurgable() return false end
function modifier_sword_master_thrust_count:IsPurgeException() return false end
function modifier_sword_master_thrust_count:GetAttributes()
    return MODIFIER_ATTRIBUTE_MULTIPLE
end

function modifier_sword_master_thrust_move:IsHidden() return true end
function modifier_sword_master_thrust_move:IsPurgable() return false end
function modifier_sword_master_thrust_move:IsPurgeException() return false end

function modifier_sword_master_thrust_move:OnCreated(keys)
    if not IsServer() then return end
    local parent = self:GetParent()
    local ability = self:GetAbility()
    local endLocation = ability:GetCursorPosition()
    local startLocation = parent:GetAbsOrigin()
    local distance = (endLocation - startLocation):Length2D()
    local speed = ability:GetSpecialValueFor("speed")
    local width = ability:GetSpecialValueFor("width")
    self.damage_bonus = ability:GetSpecialValueFor("damage_bonus")

    local ability_arbiter = parent:FindAbilityByName("sword_master_arbiter")
    if ability_arbiter ~= nil and ability_arbiter:GetLevel() >= 6 then
        self.damage_bonus = self.damage_bonus + parent:GetAgility()
    end

    self.damage_bonus = self.damage_bonus * (1 + parent:GetSpellAmplification(false))

    self.location = startLocation

    if self.projectile ~= nil then
        ProjectileManager:DestroyLinearProjectile(self.projectile)
    end

    local targetFlag = DOTA_UNIT_TARGET_FLAG_NONE

    local talent6 = parent:FindAbilityByName("special_bonus_unique_sword_master_6")
    if talent6 ~= nil and talent6:GetLevel() ~= 0 then
        targetFlag = DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES
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
        iUnitTargetFlags	= targetFlag,
        iUnitTargetType		= DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        fExpireTime 		= GameRules:GetGameTime() + 5.0,
        bDeleteOnHit		= false,
        vVelocity			= (endLocation - startLocation):Normalized() * speed,
        bProvidesVision		= true,
        iVisionRadius		= width,
        iVisionTeamNumber	= parent:GetTeamNumber(),
    })

    if self.particle == nil then
        self.particle = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_thrust.vpcf", PATTACH_ABSORIGIN_FOLLOW , parent)
    end

    parent:EmitSound("Hero_Juggernaut.ArcanaHaste.Anim")

    if self:ApplyHorizontalMotionController() == false then
        self:Destroy()
    end
end

function modifier_sword_master_thrust_move:OnRefresh(keys)
    self:OnCreated(keys)
end

function modifier_sword_master_thrust_move:UpdateHorizontalMotion( me, dt )
	if not IsServer() then return end

    if not ProjectileManager:IsValidProjectile(self.projectile) then
        self:Destroy()
    end

	me:SetAbsOrigin(self.location)
end

function modifier_sword_master_thrust_move:CheckState()
    return {[MODIFIER_STATE_STUNNED] = true}
end

function modifier_sword_master_thrust_move:DeclareFunctions()
    return {MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE_POST_CRIT}
end

function modifier_sword_master_thrust_move:GetModifierPreAttack_BonusDamagePostCrit(keys)
    return self.damage_bonus
end

function modifier_sword_master_thrust_move:OnHorizontalMotionInterrupted()
	self:Destroy()
end

function modifier_sword_master_thrust_move:OnDestroy()
    if not IsServer() then return end

    local ability = self:GetAbility()
    local parent = self:GetParent()
    Timers:CreateTimer(FrameTime(),function ()
        parent:StopSound("Hero_Juggernaut.ArcanaHaste.Anim")
        ParticleManager:DestroyParticle(self.particle, false)
        ParticleManager:ReleaseParticleIndex(self.particle)
        self.particle = nil
    end)
    parent:RemoveHorizontalMotionController( self )


    local talent_duration = ability:GetSpecialValueFor("talent_duration")
    if talent_duration ~= 0 then
        parent:AddNewModifier(parent, ability, "modifier_sword_master_thrust_movespeed_bonus", {duration = talent_duration})
    end
end

function modifier_sword_master_thrust_movespeed_bonus:DeclareFunctions()
    return {MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE }
end

function modifier_sword_master_thrust_movespeed_bonus:GetModifierMoveSpeedBonus_Percentage()
    return self:GetAbility():GetSpecialValueFor("talent_movespeed")
end

function table.contains(table, element)
    for _, value in pairs(table) do
      if value == element then
        return true
      end
    end
    return false
end
