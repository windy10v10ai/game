LinkLuaModifier("modifier_hero_vo_player", "voicePlayer/Hero_vo_player", LUA_MODIFIER_MOTION_NONE)


Hero_vo_player = Hero_vo_player or class({})
modifier_hero_vo_player = modifier_hero_vo_player or class({})

function Hero_vo_player:GetIntrinsicModifierName()
    return "modifier_hero_vo_player"
end

function Hero_vo_player:Spawn()
    self.itemtable = {}
    if not IsServer() then return end
    self:SetLevel(1)
end

function Hero_vo_player:OnHeroLevelUp()
    if not IsServer() then return end
    local caster = self:GetCaster()
    caster:PlayVoice(caster:GetName() .. ".vo.Upgrade")
end


function Hero_vo_player:OnItemEquipped(item)
    local caster = self:GetCaster()
    if item and not self.itemtable[item:GetName()] then
        self.itemtable[item:GetName()] = true
        caster:PlayVoice(caster:GetName() .. ".vo." .. item:GetName())
    end
end

function modifier_hero_vo_player:IsHidden() return true end
function modifier_hero_vo_player:RemoveOnDeath() return false end
function modifier_hero_vo_player:IsPurgeException() return false end
function modifier_hero_vo_player:IsDebuff() return false end
function modifier_hero_vo_player:AllowIllusionDuplicate() return false end


function modifier_hero_vo_player:DeclareFunctions()
    if not IsServer() then return{} end
    return {
        MODIFIER_EVENT_ON_ORDER,
        MODIFIER_EVENT_ON_DEATH
    }
end

function modifier_hero_vo_player:OnCreated(keys)
    if not IsServer() then return end
    local ability = self:GetAbility()
    self.AttackProbability = ability:GetSpecialValueFor("AttackProbability")
    self.MoveProbability = ability:GetSpecialValueFor("MoveProbability")
    self.EmitingVoice = false
end

function modifier_hero_vo_player:OnOrder(keys)
    if not IsServer() then return end
    local order = keys.order_type
    local parent = self:GetParent()
    if parent == keys.unit then

        local OrderStr = self:GetVoType(order)

        if  OrderStr ~= "NoOrder" then

            local heroname = parent:GetName()
            local voName = heroname .. ".vo." .. OrderStr

            if OrderStr ~= "BuyBack" then
                parent:PlayVoice(voName)
            else
                parent:PlayVoiceIgnoreCooldown(voName)
            end
        end
    end
end

function modifier_hero_vo_player:OnDeath(keys)
    if not IsServer() then return end
    local parent = self:GetParent()
    if keys.unit == parent then
        local heroname = parent:GetName()
        parent:EmitSound(heroname .. ".vo.Death")
    end

    if keys.attacker == parent and keys.unit:IsRealHero() then
        local heroname = parent:GetName()
        parent:PlayVoice(heroname .. ".vo.Kill")
    end
end

function  modifier_hero_vo_player:GetVoType(order)
    local OrderStr = "NoOrder"
    if order == DOTA_UNIT_ORDER_ATTACK_TARGET or order == DOTA_UNIT_ORDER_ATTACK_MOVE then
        local Probability =  RandomInt(1,100)
        if Probability <= self.AttackProbability then
            OrderStr = "Attack"
        end
    end

    if order == DOTA_UNIT_ORDER_MOVE_TO_POSITION or order == DOTA_UNIT_ORDER_MOVE_TO_TARGET then
        local Probability =  RandomInt(1,100)
        if Probability <= self.MoveProbability then
            OrderStr = "Move"
        end
    end

    if order == DOTA_UNIT_ORDER_BUYBACK then
        self:GetParent().isBuyBack = true
        OrderStr = "BuyBack"
    end
    return OrderStr
end
