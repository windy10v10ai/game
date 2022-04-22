LinkLuaModifier("modifier_hero_vo_player", "heroes/hero_abyss_sword/Hero_vo_player", LUA_MODIFIER_MOTION_NONE)


Hero_vo_player = Hero_vo_player or class({})
modifier_hero_vo_player = modifier_hero_vo_player or class({})

function Hero_vo_player:GetIntrinsicModifierName()
    return "modifier_hero_vo_player"
end

function Hero_vo_player:Spawn()
    self.itemtable = {}
    self.hasScepter = false
    self.hasShard = false
    if not IsServer() then return end
    self:SetLevel(1)
    local caster = self:GetCaster()
    EmitAnnouncerSoundForPlayer(caster:GetName() .. ".vo.Respawn", caster:GetPlayerOwnerID())
end

function Hero_vo_player:OnHeroLevelUp()
    if not IsServer() then return end
    local caster = self:GetCaster()
    StartMoveOrAttackVoiceCoolDown(caster,6)
    EmitAnnouncerSoundForPlayer(caster:GetName() .. ".vo.Upgrade", caster:GetPlayerOwnerID())
end


function Hero_vo_player:OnItemEquipped(item)
    local caster = self:GetCaster()
    local itemname = item:GetName()
    if item and not self.itemtable[item:GetName()] then
        StartMoveOrAttackVoiceCoolDown(caster,6)
        self.itemtable[item:GetName()] = true
        EmitAnnouncerSoundForPlayer(caster:GetName() .. ".vo." .. item:GetName(), caster:GetPlayerOwnerID())
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
        MODIFIER_EVENT_ON_DEATH,
        MODIFIER_EVENT_ON_RESPAWN
    }
end


function modifier_hero_vo_player:OnCreated(keys)
    if not IsServer() then return end
    local ability = self:GetAbility()
    self.CoolDown =  ability:GetSpecialValueFor("CoolDown")
    self.AttackProbability = ability:GetSpecialValueFor("AttackProbability")
    self.MoveProbability = ability:GetSpecialValueFor("MoveProbability")
    self.EmitingMoveOrAttack = false
    self.EmitingKill = false
end

function modifier_hero_vo_player:OnOrder(keys)
    if not IsServer() then return end
    local order = keys.order_type
    local parent = self:GetParent()
    if parent == keys.unit and not self.EmitingMoveOrAttack then

        local OrderStr = self:GetVoType(order)

        if  OrderStr ~= "NoOrder" then

            local heroname = parent:GetName()
            local voName = heroname .. ".vo." .. OrderStr

            EmitAnnouncerSoundForPlayer(voName, parent:GetPlayerOwnerID())

            self.EmitingMoveOrAttack = true
            parent:SetContextThink(DoUniqueString("SetEmitingMoveOrAttackToFalse"), function() 	self.EmitingMoveOrAttack = false end , self.CoolDown )
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

    if keys.attacker == parent and keys.unit:IsRealHero() and not self.EmitingKill then
        local heroname = parent:GetName()
        EmitAnnouncerSoundForPlayer(heroname .. ".vo.Kill", parent:GetPlayerOwnerID())

        self.EmitingKill = true
        self.EmitingMoveOrAttack = true
        parent:SetContextThink(DoUniqueString("SetEmitingMoveOrAttackToFalse"), function() 	self.EmitingMoveOrAttack = false end , self.CoolDown )
        parent:SetContextThink(DoUniqueString("SetEmitingKillToFalse"),  function() self.EmitingKill = false end, self.CoolDown )
    end
end


function  modifier_hero_vo_player:OnRespawn(keys)
    if not IsServer() then return end
    local parent = self:GetParent()
    if keys.unit == parent then
        local heroname = parent:GetName()
        EmitAnnouncerSoundForPlayer(heroname .. ".vo.Respawn", parent:GetPlayerOwnerID())
    end
end

function modifier_hero_vo_player:GetVoType(order)
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

    return OrderStr
end

function StartMoveOrAttackVoiceCoolDown(unit,cooldown)
    local vo_modi = unit:FindModifierByName("modifier_hero_vo_player")
    if vo_modi then
        vo_modi.EmitingMoveOrAttack = true
        unit:SetContextThink(DoUniqueString("SetEmitingMoveOrAttackToFalse"), function() vo_modi.EmitingMoveOrAttack = false end , cooldown)
    end
end
