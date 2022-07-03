LinkLuaModifier("modifier_abyss_sword_rush_night_sword_qi", "heroes/hero_abyss_sword/abyss_sword_rush_night_sword_qi", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_abyss_sword_rush_night_sword_qi_spell", "heroes/hero_abyss_sword/abyss_sword_rush_night_sword_qi", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_abyss_sword_rush_night_sword_qi_enemy", "heroes/hero_abyss_sword/abyss_sword_rush_night_sword_qi", LUA_MODIFIER_MOTION_NONE)
abyss_sword_rush_night_sword_qi = abyss_sword_rush_night_sword_qi or class({})
modifier_abyss_sword_rush_night_sword_qi = modifier_abyss_sword_rush_night_sword_qi or class({})
modifier_abyss_sword_rush_night_sword_qi_spell = modifier_abyss_sword_rush_night_sword_qi_spell or class({})
modifier_abyss_sword_rush_night_sword_qi_enemy = modifier_abyss_sword_rush_night_sword_qi_spell or class({})

function abyss_sword_rush_night_sword_qi:GetCastRange()
    return self:GetSpecialValueFor("length")
end

function abyss_sword_rush_night_sword_qi:OnProjectileHit(target,location)
    local caster = self:GetCaster()
    if caster:HasModifier("modifier_abyss_sword_rush_night_sword_qi_spell") then
        caster:AddNewModifier(caster, self, "modifier_abyss_sword_rush_night_sword_qi", {})
        caster:PerformAttack(target, true, true, true, true, false, false, true)
        caster:RemoveModifierByName("modifier_abyss_sword_rush_night_sword_qi")
    else
        if not target then return end
        if target:HasModifier("modifier_abyss_sword_rush_night_sword_qi_enemy") then return end
        local dmg = caster:GetAverageTrueAttackDamage(target)
        local damage = self:GetSpecialValueFor("damage")
        dmg = dmg + damage
        local dmgtable = {
            attacker = caster,
            victim = target,
            damage = dmg,
            damage_type = DAMAGE_TYPE_PHYSICAL,
            damage_flags = 0,
            ability = self
        }
        ApplyDamage(dmgtable)
        target:AddNewModifier(caster, self, "modifier_abyss_sword_rush_night_sword_qi_enemy", {duration = 0.5})
    end
end


function abyss_sword_rush_night_sword_qi:OnSpellStart()
    local target = self:GetCursorPosition()
    local origin = self:GetCaster():GetAbsOrigin()
    self:CreateProjectiles(origin,target,0,1)
    EmitAnnouncerSoundForPlayer("npc_dota_hero_visage.vo.SwordQi.Cast", self:GetCaster():GetPlayerOwnerID())
    self:GetCaster():AddNewModifier(caster, self, "modifier_abyss_sword_rush_night_sword_qi_spell", {duration = 0.5})
end

function abyss_sword_rush_night_sword_qi:CreateProjectiles(origin,target,angle,count)
    local caster = self:GetCaster()
    local width = self:GetSpecialValueFor("width")
    local length = self:GetSpecialValueFor("length")
    local speed = self:GetSpecialValueFor("speed")
    local vector = (target - origin):Normalized()
    local startangle = angle / 2
    local step = angle/count
    if count == 1 then
        step = startangle
    end
    for i = 1, count, 1 do
        ProjectileManager:CreateLinearProjectile({
            Ability				= self,
            EffectName			= "particles/custom/abyss_sword/abyss_sword_rush_night_sword_qi_wave.vpcf",
            vSpawnOrigin		= origin,
            fDistance			= length,
            fStartRadius		= width,
            fEndRadius			= width,
            Source				= caster,
            bHasFrontalCone		= false,
            bReplaceExisting	= false,
            iUnitTargetTeam		= DOTA_UNIT_TARGET_TEAM_ENEMY,
            iUnitTargetFlags	= DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
            iUnitTargetType		= DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
            fExpireTime 		= GameRules:GetGameTime() + 5.0,
            bDeleteOnHit		= false,
            vVelocity			= RotatePosition(Vector(0,0,0), QAngle(0,startangle - i*step, 0), vector) * speed,
            bProvidesVision		= true,
            iVisionRadius		= width,
            iVisionTeamNumber	= caster:GetTeamNumber(),
        })
    end

    caster:EmitSound("Hero_Abyss_Sword.SwordQi.Cast")
end

function modifier_abyss_sword_rush_night_sword_qi:RemoveOnDeath() return false end
function modifier_abyss_sword_rush_night_sword_qi:IsHidden() return true end
function modifier_abyss_sword_rush_night_sword_qi:IsPurgable() return false end
function modifier_abyss_sword_rush_night_sword_qi:DeclareFunctions()
    return {MODIFIER_PROPERTY_BASEATTACK_BONUSDAMAGE}
end

function modifier_abyss_sword_rush_night_sword_qi:GetModifierBaseAttack_BonusDamage(params)
    local damage = self:GetAbility():GetSpecialValueFor("damage")
    return damage
end

function modifier_abyss_sword_rush_night_sword_qi_spell:RemoveOnDeath() return true end
function modifier_abyss_sword_rush_night_sword_qi_spell:IsHidden() return true end
function modifier_abyss_sword_rush_night_sword_qi_spell:IsPurgable() return false end

function modifier_abyss_sword_rush_night_sword_qi_enemy:RemoveOnDeath() return true end
function modifier_abyss_sword_rush_night_sword_qi_enemy:IsHidden() return true end
function modifier_abyss_sword_rush_night_sword_qi_enemy:IsPurgable() return false end
