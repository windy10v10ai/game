LinkLuaModifier("modifier_chibi_monster", "heroes/hero_miku/chibi_monster", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_anime_boombox", "items/item_anime_boombox", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_star_tier1", "modifiers/modifier_star_tier1", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_star_tier2", "modifiers/modifier_star_tier2", LUA_MODIFIER_MOTION_NONE)
chibi_monster = class({})

function chibi_monster:IsStealable() return true end
function chibi_monster:IsHiddenWhenStolen() return false end

function chibi_monster:OnUpgrade()
    local ability = self:GetCaster():FindAbilityByName("chibi_hit")
    if ability and ability:GetLevel() < self:GetLevel() then
        ability:SetLevel(self:GetLevel())
    end
end


function chibi_monster:OnSpellStart()
    local caster = self:GetCaster()
    local fixed_duration = self:GetSpecialValueFor("fixed_duration")

    caster:AddNewModifier(caster, self, "modifier_chibi_monster", {duration = fixed_duration})
	caster:AddNewModifier(caster, self, "modifier_star_tier2", {duration = fixed_duration})

    self:EndCooldown()

    if caster:HasModifier("modifier_miku_arcana") then
	self:PlayEffects()
	end
end
function chibi_monster:PlayEffects()

	local particle_cast = "particles/calne_miku_activation_flash.vpcf"

	-- Create Particle
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN, self:GetCaster() )
	ParticleManager:ReleaseParticleIndex( effect_cast )

end
---------------------------------------------------------------------------------------------------------------------
modifier_chibi_monster = class({})
function modifier_chibi_monster:IsHidden() return false end
function modifier_chibi_monster:IsDebuff() return false end
function modifier_chibi_monster:IsPurgable() return false end
function modifier_chibi_monster:IsPurgeException() return false end
function modifier_chibi_monster:RemoveOnDeath() return true end
function modifier_chibi_monster:AllowIllusionDuplicate() return true end
function modifier_chibi_monster:DeclareFunctions()
    local func = {  MODIFIER_PROPERTY_MODEL_CHANGE,
    				MODIFIER_PROPERTY_MODEL_SCALE,
	                MODIFIER_PROPERTY_HEALTH_BONUS,
                    MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
                    MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
                    MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
                    MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
MODIFIER_PROPERTY_STATS_AGILITY_BONUS,					}
    return func
end
function modifier_chibi_monster:GetModifierModelChange()
if self.caster:HasModifier("modifier_miku_arcana") then
return "models/hatsune_miku/arcana/arcana_form/arcana_monster.vmdl"
else
    return "models/hatsune_miku/chibi2.vmdl"
	end
end
function modifier_chibi_monster:GetModifierModelScale()
    if self.caster:HasModifier("modifier_miku_arcana") then
        return 1
    else
	    return 120
	end
end
function modifier_chibi_monster:GetModifierHealthBonus()
    return self.hp
end
function modifier_chibi_monster:GetModifierPreAttack_BonusDamage()
    return self.damage
end
function modifier_chibi_monster:GetModifierBonusStats_Agility()
    return self.agility
end


function modifier_chibi_monster:OnCreated(table)
    self.caster = self:GetCaster()
    self.parent = self:GetParent()
    self.ability = self:GetAbility()

    self.ability_level = self.ability:GetLevel()

    self.damage = self.ability:GetSpecialValueFor("damage")
    self.hp = self.ability:GetSpecialValueFor("hp")
    self.agility = self.ability:GetSpecialValueFor("agility")

    self.skills_table = {
                            ["chibi_monster"] = "chibi_hit",

                        }


    if IsServer() then
        for k, v in pairs(self.skills_table) do
            if k and v then
                self.parent:SwapAbilities(k, v, false, true)
                --k:SetHidden(true)
                --v:SetHidden(false)

                local ability = self.parent:FindAbilityByName(v)
                if ability and not ability:IsNull() and ability:IsTrained() and ability:GetCooldown(-1) > 0 then
                    ability:EndCooldown()
                    ability:RefreshCharges()
                end
            end
        end
          if self.caster:HasModifier("modifier_miku_arcana") then
		     if not self.particle_time then
            self.particle_time =    ParticleManager:CreateParticle("particles/chibi_monster_calne.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent)

        end
		  else
       if not self.particle_time then
            self.particle_time =    ParticleManager:CreateParticle("particles/chibi_monster.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent)

        end
		end






        self.parent:Purge(false, true, false, true, true)
    end
end
function modifier_chibi_monster:OnRefresh(table)
    self:OnCreated(table)
end
function modifier_chibi_monster:OnDestroy()
    if IsServer() then
        if self.parent and not self.parent:IsNull() then
            for k, v in pairs(self.skills_table) do
                if k and v then
                    self.parent:SwapAbilities(k, v, true, false)
                    --k:SetHidden(false)
                    --v:SetHidden(true)
                end
            end

           ParticleManager:DestroyParticle(self.particle_time, false)
        ParticleManager:ReleaseParticleIndex(self.particle_time)




            if self.parent:IsRealHero() then
                self.ability:StartCooldown(self.ability:GetCooldown(-1) * self.parent:GetCooldownReduction())
                local ability = self.parent:FindAbilityByName("zenitsu_awake")
                if ability and not ability:IsNull() and ability:IsTrained() then
                    --SetZenitsuAwakeLongCd(self.parent, self.ability)
                    --ability:CastAbility()
                end
            end
        end
    end
end
---------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------
zenitsu_awake = class({})

function zenitsu_awake:IsStealable() return true end
function zenitsu_awake:IsHiddenWhenStolen() return false end
function zenitsu_awake:OnUpgrade()
    local ability = self:GetCaster():FindAbilityByName("chibi_monster")
    if ability and ability:GetLevel() < self:GetLevel() then
        ability:SetLevel(self:GetLevel())
    end
end
function zenitsu_awake:OnSpellStart()
    local caster = self:GetCaster()

    if caster:FindModifierByNameAndCaster("modifier_chibi_monster", caster) then
        caster:RemoveModifierByNameAndCaster("modifier_chibi_monster", caster)

        --return nil
    end

    caster:Purge(true, true, false, true, true)



    local ability = caster:FindAbilityByName("chibi_monster")
    if ability and ability:IsTrained() and ability:GetCooldown(-1) > 0 then
        ability:EndCooldown()

        print(self.zenitsu_awake_skills_used, "sss")
        if not self.zenitsu_awake_skills_used then
            ability:StartCooldown(self:GetSpecialValueFor("no_skills_cd") * caster:GetCooldownReduction())
        else
            ability:StartCooldown(ability:GetCooldown(-1) * caster:GetCooldownReduction())
        end
    end

    self.zenitsu_awake_skills_used = nil

    StopSoundOn("Zenitsu.Hear.Upgrade.Cast.1", caster)
    EmitSoundOn("Zenitsu.Awake.Cast.1", caster)
end
function IsZenitsuSleeping(parent, ability)
    if parent and not parent:IsNull() and ability and not ability:IsNull() then
        local ultimate = parent:FindModifierByNameAndCaster("modifier_chibi_monster", parent)
        if ultimate and not ultimate:IsNull() then
            return ultimate:GetAbility()
        end
    end

    return nil
end

function SetZenitsuAwakeLongCd(parent, ability)
    if not IsServer() or parent:IsNull() or ability:IsNull() then
        return nil
    end

    local zenitsu_awake = parent:FindAbilityByName("zenitsu_awake")
    if not zenitsu_awake:IsNull() and zenitsu_awake:IsTrained() then
        zenitsu_awake.zenitsu_awake_skills_used = true
    end
end
