LinkLuaModifier("modifier_yukari_morph", "heroes/hero_yukari/yukari_morph", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_yukari_morph_real", "heroes/hero_yukari/yukari_morph", LUA_MODIFIER_MOTION_NONE)

yukari_morph = class({})

function yukari_morph:IsStealable() return true end
function yukari_morph:IsHiddenWhenStolen() return false end

function yukari_morph:OnSpellStart()
    local caster = self:GetCaster()
    local fixed_duration = self:GetSpecialValueFor("fixed_duration")
    if self:GetCaster():HasScepter() then
        caster:AddNewModifier(caster, self, "modifier_yukari_morph_real", {duration = fixed_duration})
    else
        caster:AddNewModifier(caster, self, "modifier_yukari_morph", {duration = fixed_duration})
    end
end

function yukari_morph:OnProjectileHit(hTarget, vLocation)
	if not hTarget then
		return nil
	end



	local damage_table = {	victim = hTarget,
							attacker = self:GetCaster(),
							damage = self.damage,
							damage_type = self:GetAbilityDamageType(),
							ability = self }

	ApplyDamage(damage_table)
end
---------------------------------------------------------------------------------------------------------------------
modifier_yukari_morph = class({})
function modifier_yukari_morph:IsHidden() return false end
function modifier_yukari_morph:IsDebuff() return false end
function modifier_yukari_morph:IsPurgable() return false end
function modifier_yukari_morph:IsPurgeException() return false end
function modifier_yukari_morph:RemoveOnDeath() return true end
function modifier_yukari_morph:AllowIllusionDuplicate() return false end

function modifier_yukari_morph:DeclareFunctions()
    local func = {
    				MODIFIER_PROPERTY_MODEL_SCALE,
					 MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	                MODIFIER_PROPERTY_EVASION_CONSTANT,
                    MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
                    MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
                    MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS, }
    return func
end




function modifier_yukari_morph:GetModifierSpellAmplify_Percentage()
    return 50
end

function modifier_yukari_morph:GetModifierMoveSpeedBonus_Constant()
    return 50
end



function modifier_yukari_morph:OnCreated(table)
    self.caster = self:GetCaster()
    self.parent = self:GetParent()
    self.ability = self:GetAbility()

    self.ability_level = self.ability:GetLevel()

    self.bonus_movespeed = self.ability:GetSpecialValueFor("bonus_movespeed")
    self.projectile_avoid_chance = self.ability:GetSpecialValueFor("projectile_avoid_chance")
    self.turn_rate = self.ability:GetSpecialValueFor("turn_rate")
    self.awake_mana = self.ability:GetSpecialValueFor("awake_mana")

    self.skills_table = {
                           ["yukari_morph"] = "yukari_morph",

                       }


    if IsServer() then
        for k, v in pairs(self.skills_table) do
            if k and v then
                self.parent:SwapAbilities(k, v, false, true)
                --k:SetHidden(true)
                --v:SetHidden(false)

                local ability = self.parent:FindAbilityByName(v)
                if ability and not ability:IsNull() and ability:IsTrained() and ability:GetCooldown(-1) > 0 then
                   -- ability:EndCooldown()
                    --ability:RefreshCharges()
                end
            end
        end
            --self.parent:SwapAbilities(v, pAbilityName2, bEnable1, bEnable2)
        if not self.particle_time then
            self.particle_time =    ParticleManager:CreateParticle("particles/yukari_morph.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent)

        end


        EmitSoundOn("star.theme2_42", self.parent)
        EmitSoundOn("yukari.morph", self.parent)

        self.parent:Purge(false, true, false, true, true)
    end
end
function modifier_yukari_morph:OnRefresh(table)
    self:OnCreated(table)
end
function modifier_yukari_morph:OnDestroy()
    if IsServer() then
		ParticleManager:DestroyParticle(self.particle_time, false)
        ParticleManager:ReleaseParticleIndex(self.particle_time)

        StopSoundOn("yukari.morph", self.parent)
        StopSoundOn("star.theme2_42", self.parent)
    end
end

modifier_yukari_morph_real = class({})
function modifier_yukari_morph_real:IsHidden() return false end
function modifier_yukari_morph_real:IsDebuff() return false end
function modifier_yukari_morph_real:IsPurgable() return false end
function modifier_yukari_morph_real:IsPurgeException() return false end
function modifier_yukari_morph_real:RemoveOnDeath() return true end
function modifier_yukari_morph_real:AllowIllusionDuplicate() return false end

function modifier_yukari_morph_real:DeclareFunctions()
    local func = {
        MODIFIER_PROPERTY_MODEL_SCALE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_EVASION_CONSTANT,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
    }
    return func
end

function modifier_yukari_morph_real:GetModifierSpellAmplify_Percentage()
    return self.spellAmp
end

function modifier_yukari_morph_real:GetModifierMoveSpeedBonus_Constant()
    return self.bonus_movespeed
end



function modifier_yukari_morph_real:OnCreated(table)
    self.caster = self:GetCaster()
    self.parent = self:GetParent()
    self.ability = self:GetAbility()

    self.ability_level = self.ability:GetLevel()

    self.spellAmp = self.ability:GetSpecialValueFor("amp")
    self.bonus_movespeed = self.ability:GetSpecialValueFor("bonus_movespeed")
    self.projectile_avoid_chance = self.ability:GetSpecialValueFor("projectile_avoid_chance")
    self.turn_rate = self.ability:GetSpecialValueFor("turn_rate")
    self.awake_mana = self.ability:GetSpecialValueFor("awake_mana")

    self.skills_table = {
        ["yukari_morph"] = "yukari_morph",
    }

        if IsServer() then
            if not self.particle_time then
                self.particle_time =    ParticleManager:CreateParticle("particles/yukari_true_moon.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent)
            end

        EmitSoundOn("star.theme2_43", self.parent)
        EmitSoundOn("yukari.morph", self.parent)
        self.parent:Purge(false, true, false, true, true)
    end
end

function modifier_yukari_morph_real:OnRefresh(table)
    self:OnCreated(table)
end

function modifier_yukari_morph_real:OnDestroy()
    if IsServer() then
		ParticleManager:DestroyParticle(self.particle_time, false)
        ParticleManager:ReleaseParticleIndex(self.particle_time)

        StopSoundOn("yukari.morph", self.parent)
        StopSoundOn("star.theme2_43", self.parent)
    end
end

