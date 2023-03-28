LinkLuaModifier("modifier_sword_master_sweep_count","Heroes/sword_master/sword_master_sweep.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_sweep_move", "Heroes/sword_master/sword_master_sweep.lua", LUA_MODIFIER_MOTION_HORIZONTAL)
LinkLuaModifier("modifier_sword_master_sweep_aura","Heroes/sword_master/sword_master_sweep.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_sweep_damage","Heroes/sword_master/sword_master_sweep.lua", LUA_MODIFIER_MOTION_NONE)


sword_master_sweep = sword_master_sweep or class({})
modifier_sword_master_sweep_count = modifier_sword_master_sweep_count or class({})
modifier_sword_master_sweep_move = modifier_sword_master_sweep_move or class({})
modifier_sword_master_sweep_aura = modifier_sword_master_sweep_aura or class({})
modifier_sword_master_sweep_damage = modifier_sword_master_sweep_damage or class({})

function sword_master_sweep:Precache(context)
	PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_dawnbreaker.vsndevts", context )
end

function sword_master_sweep:CastFilterResultLocation()
    if not IsServer() then return end
    local caster = self:GetCaster()
    local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
    if modi_count ~= nil and modi_count:GetStackCount() == 0 then
        return UF_FAIL_CUSTOM
    end

    return UF_SUCCESS
end

function sword_master_sweep:GetCustomCastErrorLocation()
    return "执剑泰斗点数不足"
end

function sword_master_sweep:OnSpellStart()
    local caster = self:GetCaster()
    local speed = self:GetSpecialValueFor("speed")
    local distance = self:GetSpecialValueFor("distance")
    local duration = distance / speed


    self:AddSweepCount()

    caster:AddNewModifier(caster, self, "modifier_sword_master_sweep_move", {duration = duration})

    caster:EmitSound("Hero_Dawnbreaker.Celestial_Hammer.Cast")
end

function sword_master_sweep:AddSweepCount()
    if IsServer() then
        local caster = self:GetCaster()
        if caster:HasAbility("sword_master_chop") then
            caster:RemoveAllModifiersOfName("modifier_sword_master_sweep_count")
            caster:RemoveAllModifiersOfName("modifier_sword_master_tap_count")
            caster:RemoveAllModifiersOfName("modifier_sword_master_thrust_count")
            caster:AddNewModifier(caster, self, "modifier_sword_master_sweep_count", {})
            local ability = caster:FindAbilityByName("sword_master_chop")
            ability:SetUltimateType(true)
        end

        local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
        if modi_count ~= nil then
            modi_count:CastCharge(1)
        end
    end
end

function modifier_sword_master_sweep_count:RemoveOnDeath() return false end
function modifier_sword_master_sweep_count:IsPurgable() return false end
function modifier_sword_master_sweep_count:IsPurgeException() return false end

function modifier_sword_master_sweep_move:IsHidden() return true end
function modifier_sword_master_sweep_move:IsPurgable() return false end
function modifier_sword_master_sweep_move:IsPurgeException() return false end

function modifier_sword_master_sweep_move:OnCreated(keys)
    if not IsServer() then return end
    local ability = self:GetAbility()
    self.speed = ability:GetSpecialValueFor("speed")
    local radius = ability:GetSpecialValueFor("radius")
    local parent = self:GetParent()
    self.direction = (ability:GetCursorPosition()  - parent:GetAbsOrigin()):Normalized()
    if self.direction:Length2D() == 0 then
        self.direction = parent:GetForwardVector()
    end

    parent:AddNewModifier(parent, ability, "modifier_sword_master_sweep_aura", {})
    parent:StartGestureWithPlaybackRate(ACT_DOTA_CAST_ABILITY_1,1.5)

    local particle = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_sweep.vpcf", PATTACH_ABSORIGIN_FOLLOW, parent)
    ParticleManager:SetParticleControl(particle, 5, Vector(radius,0,0))
    self:AddParticle(particle, true, false, -1, false, false)

    if self:ApplyHorizontalMotionController() == false then
        self:Destroy()
    end
end

function modifier_sword_master_sweep_move:OnRefresh(keys)
    self:OnCreated(keys)
end

function modifier_sword_master_sweep_move:UpdateHorizontalMotion( me, dt )
	if not IsServer() then return end

	me:SetAbsOrigin( me:GetAbsOrigin() + self.speed * self.direction * dt )
end

function modifier_sword_master_sweep_move:OnHorizontalMotionInterrupted()
	self:Destroy()
end

function modifier_sword_master_sweep_move:CheckState()
    return {[MODIFIER_STATE_STUNNED] = true}
end

function modifier_sword_master_sweep_move:OnDestroy()
    if not IsServer() then return end

    local parent = self:GetParent()
    parent:FadeGesture(ACT_DOTA_CAST_ABILITY_1)

    parent:RemoveModifierByName("modifier_sword_master_sweep_aura")

    parent:RemoveHorizontalMotionController( self )
end



function modifier_sword_master_sweep_aura:IsHidden() return true end
function modifier_sword_master_sweep_aura:IsPurgable() return false end
function modifier_sword_master_sweep_aura:IsPurgeException() return false end
function modifier_sword_master_sweep_aura:IsAura() return true end
function modifier_sword_master_sweep_aura:GetAuraRadius() return self.radius end
function modifier_sword_master_sweep_aura:GetAuraSearchFlags()
    local caster = self:GetCaster()
    local talent6 = caster:FindAbilityByName("special_bonus_unique_sword_master_6")
    if talent6 ~= nil and talent6:GetLevel() ~= 0 then
        return DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES
    else
        return DOTA_UNIT_TARGET_FLAG_NONE
    end
end
function modifier_sword_master_sweep_aura:GetAuraSearchTeam() return DOTA_UNIT_TARGET_TEAM_ENEMY end
function modifier_sword_master_sweep_aura:GetAuraSearchType() return DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC end
function modifier_sword_master_sweep_aura:GetModifierAura() return "modifier_sword_master_sweep_damage" end
function modifier_sword_master_sweep_aura:GetAuraDuration() return 0 end

function modifier_sword_master_sweep_aura:OnCreated(table)
    if not IsServer() then return end
    local ability = self:GetAbility()
    local caster = self:GetCaster()
    self.radius = ability:GetSpecialValueFor("radius")
    self.damage_bonus = ability:GetSpecialValueFor("damage_bonus")

    local ability_arbiter = caster:FindAbilityByName("sword_master_arbiter")
    if ability_arbiter ~= nil and ability_arbiter:GetLevel() >= 6 then
        self.damage_bonus = self.damage_bonus + caster:GetAgility()
    end

    self.damage_bonus = self.damage_bonus * (1 + caster:GetSpellAmplification(false))

    self:OnIntervalThink()
    self:StartIntervalThink(FrameTime())
end

function modifier_sword_master_sweep_aura:OnIntervalThink()
    if not IsServer() then return end
    GridNav:DestroyTreesAroundPoint(self:GetCaster():GetAbsOrigin(), self.radius, false)
end

function modifier_sword_master_sweep_aura:DeclareFunctions()
    return {MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE_POST_CRIT}
end

function modifier_sword_master_sweep_aura:GetModifierPreAttack_BonusDamagePostCrit(keys)
    return self.damage_bonus
end

function modifier_sword_master_sweep_damage:IsHidden() return true end
function modifier_sword_master_sweep_damage:OnCreated()
    if not IsServer() then return end
    local caster = self:GetCaster()
    local parent = self:GetParent()
    local ability_arbiter = caster:FindAbilityByName("sword_master_arbiter")
    if ability_arbiter ~= nil then
        ability_arbiter:ArbiterAttack(caster,parent)
    else
        caster:AddNewModifier(caster, self, "modifier_tidehunter_anchor_smash_caster", {})
        caster:PerformAttack(parent, false, false, true, true, false, false, true)
        caster:RemoveModifierByName("modifier_tidehunter_anchor_smash_caster")
    end
end

function table.contains(table, element)
    for _, value in pairs(table) do
      if value == element then
        return true
      end
    end
    return false
end
