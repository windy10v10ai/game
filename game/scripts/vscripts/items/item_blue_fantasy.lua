item_blue_fantasy=class({})
LinkLuaModifier("modifier_item_blue_fantasy", "items/item_blue_fantasy.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_blue_fantasy_debuff", "items/item_blue_fantasy.lua", LUA_MODIFIER_MOTION_NONE)

function item_blue_fantasy:GetIntrinsicModifierName()
    return "modifier_item_blue_fantasy"
end


function item_blue_fantasy:OnSpellStart()
    local target=self:GetCursorTarget()
    local caster=self:GetCaster()
    caster:EmitSound("DOTA_Item.Nullifier.Cast")
    ProjectileManager:CreateTrackingProjectile({
		Target = target,
		Source = caster,
		Ability = self,
		EffectName = "particles/items4_fx/nullifier_proj.vpcf",
		iMoveSpeed = self:GetSpecialValueFor("projectile_speed"),
		vSourceLoc= caster:GetAbsOrigin(),                -- Optional (HOW)
		bDrawsOnMinimap = false,                          -- Optional
		bDodgeable = false,                                -- Optional
		bIsAttack = false,                                -- Optional
		bVisibleToEnemies = true,                         -- Optional
		bReplaceExisting = false,                         -- Optional
		flExpireTime = GameRules:GetGameTime() + 20,      -- Optional but recommended
		bProvidesVision = true,                           -- Optional
		iVisionRadius = 400,                              -- Optional
		iVisionTeamNumber = caster:GetTeamNumber()        -- Optional
	})
end

function item_blue_fantasy:OnProjectileHit(target, location)
    local caster = self:GetCaster()
	if target==nil then
		return
    end

    if target:TriggerSpellAbsorb(self) or target:IsMagicImmune() then
        return
    end
        target:EmitSound("DOTA_Item.Nullifier.Target")
        target:Purge(true, false, false, false, false)              --驱散正面buff
        local duration = self:GetSpecialValueFor("mute_duration") * (1 - target:GetStatusResistance())
        target:AddNewModifier(caster,self,"modifier_item_blue_fantasy_debuff",{duration=duration})
    return true
end

modifier_item_blue_fantasy=class({})

function modifier_item_blue_fantasy:IsHidden()
    return true
end

function modifier_item_blue_fantasy:IsPurgable()
    return false
end

function modifier_item_blue_fantasy:IsPurgeException()
    return false
end

function modifier_item_blue_fantasy:DeclareFunctions()
    return
    {
        MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
        MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
        MODIFIER_EVENT_ON_ATTACK_LANDED
    }
end

function modifier_item_blue_fantasy:OnCreated()
    self.parent=self:GetParent()
    if self:GetAbility() == nil then
		return
    end
    self.ability=self:GetAbility()
    self.int=self.ability:GetSpecialValueFor( "int" )
    self.agi=self.ability:GetSpecialValueFor( "agi" )
    self.bonus_damage=self.ability:GetSpecialValueFor("bonus_damage")
    self.bonus_armor=self.ability:GetSpecialValueFor("bonus_armor")
    self.bonus_regen=self.ability:GetSpecialValueFor("bonus_regen")
    self.mana_base=self.ability:GetSpecialValueFor("mana_base")
    self.dam=0
end

function modifier_item_blue_fantasy:OnAttackLanded(tg)
    if not IsServer() then
        return
    end
    if (tg.attacker:IsBuilding() or tg.attacker:IsIllusion()) then
        return
    end
    if tg.attacker == self.parent then
       local mana = tg.target:GetMana()
       if mana then
            self.dam=self.mana_base
            tg.target:ReduceMana(self.dam)
            local damageTablep = {
                    victim = tg.target,
                    attacker = self.parent,
                    damage = self.dam,
                    damage_type =DAMAGE_TYPE_PHYSICAL,
                    ability = self.ability,
                    }
            ApplyDamage(damageTablep)
        end
    end
end

function modifier_item_blue_fantasy:GetModifierBonusStats_Intellect()
    return self.int
end

function modifier_item_blue_fantasy:GetModifierBonusStats_Agility()
    return self.agi
end

function modifier_item_blue_fantasy:GetModifierPreAttack_BonusDamage()
    return self.bonus_damage
end

function modifier_item_blue_fantasy:GetModifierPhysicalArmorBonus()
    return self.bonus_armor
end

function modifier_item_blue_fantasy:GetModifierConstantHealthRegen()
    return self.bonus_regen
end

modifier_item_blue_fantasy_debuff=class({})

function modifier_item_blue_fantasy_debuff:GetTexture()
    return "item_blue_fantasy"
end

function modifier_item_blue_fantasy_debuff:IsDebuff()
    return true
end

function modifier_item_blue_fantasy_debuff:IsHidden()
    return false
end

function modifier_item_blue_fantasy_debuff:IsPurgable()
    return false
end

function modifier_item_blue_fantasy_debuff:IsPurgeException()
    return false
end

function modifier_item_blue_fantasy_debuff:GetEffectAttachType()
    return PATTACH_OVERHEAD_FOLLOW
end

function modifier_item_blue_fantasy_debuff:GetEffectName()
    return "particles/items4_fx/nullifier_mute.vpcf"
end

function modifier_item_blue_fantasy_debuff:GetStatusEffectName()
    return "particles/status_fx/status_effect_nullifier.vpcf"
end


function modifier_item_blue_fantasy_debuff:GetPriority()
    return 20
end

function modifier_item_blue_fantasy_debuff:CheckState()
    return
    {
        [MODIFIER_STATE_MUTED] = true,                          --闭锁
        [MODIFIER_STATE_PASSIVES_DISABLED] = true,              --被动失效
        -- [MODIFIER_STATE_EVADE_DISABLED] = true,                 --闪避失效
    }
end

function modifier_item_blue_fantasy_debuff:DeclareFunctions()
    return
    {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,           --移速百分比
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT            --攻速点数
   }
end


function modifier_item_blue_fantasy_debuff:OnCreated()
    self.slow_pct=self:GetAbility():GetSpecialValueFor("slow_pct")
    self.attsp=self:GetAbility():GetSpecialValueFor("attsp")
    self.max_hp_dmg_pct=self:GetAbility():GetSpecialValueFor("max_hp_dmg_pct")*0.01
    if not IsServer() then
        return
    end
    self.damageTable = {
        attacker = self:GetCaster(),
        victim = self:GetParent(),
        damage_type =DAMAGE_TYPE_MAGICAL,
        ability = self:GetAbility(),
        }
    self:GetParent():EmitSound("DOTA_Item.Nullifier.Slow")
    local FX=ParticleManager:CreateParticle("particles/items4_fx/nullifier_mute_debuff.vpcf", PATTACH_ROOTBONE_FOLLOW, self:GetParent())
    self:AddParticle(FX, false, false, -1, false, false)
    self:StartIntervalThink(1)                                  --一秒一次
end


function modifier_item_blue_fantasy_debuff:OnIntervalThink()
    if not IsServer() then
        return
    end

    self:GetParent():Purge(true, false, false, false, false)              --驱散正面buff
    self.damageTable.damage = self:GetParent():GetMaxHealth()*self.max_hp_dmg_pct     --一秒造成一次最大生命百分比伤害
    ApplyDamage(self.damageTable)
end

function modifier_item_blue_fantasy_debuff:GetModifierMoveSpeedBonus_Percentage()
    return   self.slow_pct
end

function modifier_item_blue_fantasy_debuff:GetModifierAttackSpeedBonus_Constant()
    return   self.attsp
end
