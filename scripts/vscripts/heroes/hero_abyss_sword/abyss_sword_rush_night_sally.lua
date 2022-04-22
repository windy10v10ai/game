LinkLuaModifier("modifier_abyss_sword_rush_night_sally", "heroes/hero_abyss_sword/abyss_sword_rush_night_sally", LUA_MODIFIER_MOTION_NONE)

abyss_sword_rush_night_sally = abyss_sword_rush_night_sally or class({})
modifier_abyss_sword_rush_night_sally = modifier_abyss_sword_rush_night_sally or class({})

function abyss_sword_rush_night_sally:GetIntrinsicModifierName()
    return "modifier_abyss_sword_rush_night_sally"
end

function modifier_abyss_sword_rush_night_sally:RemoveOnDeath() return false end
function modifier_abyss_sword_rush_night_sally:IsPurgeable() return false end
function modifier_abyss_sword_rush_night_sally:OnCreated()
    self.voplaying = false
end

function modifier_abyss_sword_rush_night_sally:DeclareFunctions()
    local funcs = {
        MODIFIER_EVENT_ON_ATTACK_LANDED,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE
    }
    return funcs
end

function modifier_abyss_sword_rush_night_sally:OnAttackLanded(keys)
    local parent = self:GetParent()
    local ability = self:GetAbility()
    if keys.attacker == parent and not parent:PassivesDisabled() then
        if not parent:HasModifier("modifier_abyss_sword_rush_night_sword_qi") and parent:IsAlive() then
            local chance = ability:GetSpecialValueFor("chance")
            if RollPseudoRandomPercentage(chance,DOTA_PSEUDO_RANDOM_NONE, parent) then
                local angle = ability:GetSpecialValueFor("angle")
                local count = ability:GetSpecialValueFor("count")
                local ablity_sword_qi = parent:FindAbilityByName("abyss_sword_rush_night_sword_qi")
                if ablity_sword_qi then
                    ablity_sword_qi:CreateProjectiles(parent:GetAbsOrigin(),keys.target:GetAbsOrigin(),angle,count)
                    if not self.voplaying then
                        self.voplaying = true
                        EmitAnnouncerSoundForPlayer("npc_dota_hero_visage.vo.Sally.Cast", parent:GetPlayerOwnerID())
                        parent:SetContextThink("SetVoPlayingToFalse",function ()
                            self.voplaying = false
                        end,10)
                    end
                end
            end
        end
    end
end

function modifier_abyss_sword_rush_night_sally:GetModifierAttackSpeedBonus_Constant()
    return self:GetAbility():GetSpecialValueFor("attackspeed")
end

function modifier_abyss_sword_rush_night_sally:GetModifierMoveSpeedBonus_Percentage()
    return self:GetAbility():GetSpecialValueFor("movespeed")
end
