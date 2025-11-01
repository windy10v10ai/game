--print("[Defection] modifier_defection.lua file loaded")

modifier_defection = class({})

function modifier_defection:IsHidden()
    return false
end

function modifier_defection:IsPurgable()
    return false
end

function modifier_defection:IsPurgeException()
    return false
end

function modifier_defection:RemoveOnDeath()
    return false -- 改为 false,让阵营切换持久化
end

function modifier_defection:IsDebuff()
    return false
end

function modifier_defection:OnCreated(params)
    if not IsServer() then return end

    local parent = self:GetParent()
    local playerID = parent:GetPlayerOwnerID()

    -- 初始化
    _G.DefectionOriginalTeam = _G.DefectionOriginalTeam or {}
    self.originalTeam = _G.DefectionOriginalTeam[playerID] or parent:GetTeam()
    self.killCount = 0

    -- 设置层数显示当前阵营
    local currentTeam = parent:GetTeam()
    if currentTeam == DOTA_TEAM_GOODGUYS then
        self:SetStackCount(1)
    elseif currentTeam == DOTA_TEAM_BADGUYS then
        self:SetStackCount(2)
    elseif currentTeam == DOTA_TEAM_NEUTRALS then
        self:SetStackCount(3)
    end

    -- 提供视野
    self.visionRadius = 1800
    AddFOWViewer(self.originalTeam, parent:GetAbsOrigin(), self.visionRadius, 0.1, false)

    self:StartIntervalThink(0.1)

    -- 添加粒子效果
    self:UpdateParticleEffect(currentTeam)
end

function modifier_defection:UpdateParticleEffect(team)
    if self.particle then
        ParticleManager:DestroyParticle(self.particle, false)
    end

    local particle_name
    if team == DOTA_TEAM_GOODGUYS then
        particle_name = "particles/units/heroes/hero_wisp/wisp_ambient.vpcf"
    elseif team == DOTA_TEAM_BADGUYS then
        particle_name = "particles/units/heroes/hero_bane/bane_nightmare.vpcf"
    elseif team == DOTA_TEAM_NEUTRALS then
        particle_name = "particles/generic_gameplay/generic_disarm.vpcf"
    else
        particle_name = "particles/units/heroes/hero_bane/bane_nightmare.vpcf"
    end

    self.particle = ParticleManager:CreateParticle(particle_name, PATTACH_OVERHEAD_FOLLOW, self:GetParent())
    self:AddParticle(self.particle, false, false, -1, false, false)
end

function modifier_defection:OnIntervalThink()
    if not IsServer() then return end

    local parent = self:GetParent()
    AddFOWViewer(self.originalTeam, parent:GetAbsOrigin(), self.visionRadius, 0.2, false)
end

function modifier_defection:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_HERO_KILLED,
        MODIFIER_EVENT_ON_ATTACK_START,
    }
end

function modifier_defection:OnAttackStart(params)
    if not IsServer() then return end

    if params.attacker ~= self:GetParent() then return end

    local target = params.target

    if target and target:IsRealHero() then
        if target:GetTeam() == self.originalTeam and IsHumanPlayer(target:GetPlayerOwnerID()) then
            self:GetParent():Stop()
            --print("[Defection] Blocked attack on original teammate")
            return false
        end
    end
end

function modifier_defection:OnHeroKilled(params)
    if not IsServer() then return end

    local attacker = params.attacker
    local target = params.target

    if attacker ~= self:GetParent() then return end

    if target and target:IsRealHero() then
        if target:GetTeam() == self.originalTeam and IsHumanPlayer(target:GetPlayerOwnerID()) then
            self.killCount = self.killCount + 1
            --print("[Defection] Killed original teammate count: " .. self.killCount)
        end
    end
end

function modifier_defection:CheckState()
    return {
        [MODIFIER_STATE_NO_UNIT_COLLISION] = true,
    }
end

function modifier_defection:GetEffectAttachType()
    return PATTACH_OVERHEAD_FOLLOW
end

function modifier_defection:GetTexture()
    return "defection"
end

function modifier_defection:OnTooltip()
    return self:GetStackCount()
end
