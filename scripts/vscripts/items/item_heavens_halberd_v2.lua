item_heavens_halberd_v2=class({})

LinkLuaModifier("modifier_item_heavens_halberd_v2", "items/item_heavens_halberd_v2.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_heavens_halberd_v2_debuff", "items/item_heavens_halberd_v2.lua", LUA_MODIFIER_MOTION_NONE)
function item_heavens_halberd_v2:GetIntrinsicModifierName()
    return "modifier_item_heavens_halberd_v2"
end

function item_heavens_halberd_v2:OnSpellStart()
    local caster=self:GetCaster()
    caster:EmitSound("DOTA_Item.MeteorHammer.Cast")
    local particle = ParticleManager:CreateParticle("particles/neutral_fx/roshan_slam.vpcf", PATTACH_POINT, caster)
	ParticleManager:SetParticleControl(particle, 0, caster:GetAbsOrigin())
	ParticleManager:SetParticleControl(particle, 1, caster:GetAbsOrigin())
	ParticleManager:SetParticleControl(particle, 2, caster:GetAbsOrigin())
	ParticleManager:SetParticleControl(particle, 3, caster:GetAbsOrigin())    
	ParticleManager:ReleaseParticleIndex(particle)
    caster:StartGesture(ACT_DOTA_TELEPORT_END)

    local dur1 = self:GetSpecialValueFor("disarm_con")
    local dur2 = math.min(caster:GetStrength()/1000, 1)
    local dur = dur1+dur2

    local enemies = FindUnitsInRadius(caster:GetTeamNumber(), caster:GetAbsOrigin(), nil, 450, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
	for _, enemy in pairs(enemies) do 
        local Knockback ={
            should_stun = 0.01, --打断
            knockback_duration = 0.5, --击退时间 减去不能动的时间就是太空步的时间
            duration = 0.5, --不能动的时间
            knockback_distance = 300, --击退距离
            knockback_height = 100,	--击退高度
            center_x =  caster:GetAbsOrigin().x,	--施法者为中心
            center_y =  caster:GetAbsOrigin().y,
            center_z =  caster:GetAbsOrigin().z,
         }
        enemy:AddNewModifier(enemy, self, "modifier_knockback", Knockback) 
		enemy:AddNewModifier(enemy, self, "modifier_item_heavens_halberd_v2_debuff", {duration=dur}) 
	end
end

modifier_item_heavens_halberd_v2= class({})

function modifier_item_heavens_halberd_v2:GetTexture()
    return "item_heavens_halberd_v2"
end

function modifier_item_heavens_halberd_v2:IsHidden()
    return true
end

function modifier_item_heavens_halberd_v2:IsPurgable()
    return false
end

function modifier_item_heavens_halberd_v2:IsPurgeException()
    return false
end


function modifier_item_heavens_halberd_v2:AllowIllusionDuplicate()
    return false
end


function modifier_item_heavens_halberd_v2:DeclareFunctions()
    return
    {
        MODIFIER_PROPERTY_EVASION_CONSTANT,
        MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
        MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_HEAL_AMPLIFY_PERCENTAGE_TARGET,
        MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
        MODIFIER_EVENT_ON_ATTACK_LANDED,
   }
end


function modifier_item_heavens_halberd_v2:OnCreated()
    self.ability = self:GetAbility()
    self.disarmed = true
    self.cd = 5

    if  self.ability then
    self.bonus_evasion=self.ability:GetSpecialValueFor("bonus_evasion")
    self.bonus_strength=self.ability:GetSpecialValueFor("bonus_strength")
    self.hp_regen_amp=self.ability:GetSpecialValueFor("hp_regen_amp")
    self.attch=self.ability:GetSpecialValueFor("attch")
    self.disarm=self.ability:GetSpecialValueFor("disarm")
    self.status_resistance=self.ability:GetSpecialValueFor("status_resistance")
    end
end

function modifier_item_heavens_halberd_v2:OnIntervalThink()
    self.disarmed=true
    self:StartIntervalThink(-1)   
end

function modifier_item_heavens_halberd_v2:GetModifierEvasion_Constant()
    return  self.bonus_evasion
 end

function modifier_item_heavens_halberd_v2:GetModifierBonusStats_Strength()
    return  self.bonus_strength
end

function modifier_item_heavens_halberd_v2:GetModifierHPRegenAmplify_Percentage()
    return self.hp_regen_amp
end

function modifier_item_heavens_halberd_v2:GetModifierHealAmplify_PercentageTarget()
    return self.hp_regen_amp
end

function modifier_item_heavens_halberd_v2:GetModifierStatusResistanceStacking()
	return self.status_resistance
end

function modifier_item_heavens_halberd_v2:OnAttackLanded(tg)
    if not IsServer() then
        return
    end
    if self.disarmed==false then
        return
    end
    if tg.attacker==self:GetParent() and not tg.attacker:IsIllusion() and not tg.target:IsBuilding() and not tg.target:IsMagicImmune() then
        if RollPseudoRandomPercentage(self.attch,0,self:GetAbility()) then
            if  self.disarmed==true then
                self.disarmed=false
                self:StartIntervalThink(self.cd)
                tg.target:AddNewModifier(self:GetParent(), self:GetAbility(), "modifier_disarmed", {duration=self.disarm})
            end
        end
    end
end

modifier_item_heavens_halberd_v2_debuff=class({})

function modifier_item_heavens_halberd_v2_debuff:GetTexture()
    return "item_heavens_halberd"
end

function modifier_item_heavens_halberd_v2_debuff:IsDebuff()
    return true
end

function modifier_item_heavens_halberd_v2_debuff:IsHidden()
    return false
end

function modifier_item_heavens_halberd_v2_debuff:IsPurgable()
    return false
end

function modifier_item_heavens_halberd_v2_debuff:IsPurgeException()
    return false
end

function modifier_item_heavens_halberd_v2_debuff:GetEffectAttachType()
    return PATTACH_OVERHEAD_FOLLOW
end

function modifier_item_heavens_halberd_v2_debuff:GetEffectName()
    return "particles/generic_gameplay/generic_disarm.vpcf"
end

function modifier_item_heavens_halberd_v2_debuff:RemoveOnDeath()
    return true
end

function modifier_item_heavens_halberd_v2_debuff:CheckState()
    return
    {
        [MODIFIER_STATE_DISARMED] = true,
    }
end