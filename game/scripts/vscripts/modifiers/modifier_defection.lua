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
    -- 添加地面光环特效
    self:CreateGroundEffect(currentTeam)
end

function modifier_defection:CreateGroundEffect(team)
    if self.ground_particle then
        ParticleManager:DestroyParticle(self.ground_particle, false)
        ParticleManager:ReleaseParticleIndex(self.ground_particle)
    end

    local ground_particle_name
    local radius = 200

    if team == DOTA_TEAM_GOODGUYS then
        return
    end
    if team == DOTA_TEAM_BADGUYS then
        ground_particle_name = "particles/yukari_twin_train_explosion.vpcf"        -- 红色爆炸
    elseif team == DOTA_TEAM_NEUTRALS then
        ground_particle_name = "particles/items3_fx/blink_overwhelming_burst.vpcf" -- 金色光环
    end

    if ground_particle_name then
        self.ground_particle = ParticleManager:CreateParticle(ground_particle_name, PATTACH_ABSORIGIN_FOLLOW,
            self:GetParent())
        ParticleManager:SetParticleControl(self.ground_particle, 0, self:GetParent():GetAbsOrigin())
        ParticleManager:SetParticleControl(self.ground_particle, 1, Vector(radius, radius, radius))
        self:AddParticle(self.ground_particle, false, false, -1, false, false)
    end
end

function modifier_defection:UpdateParticleEffect(team)
    -- 清除旧特效
    if self.particle then
        ParticleManager:DestroyParticle(self.particle, false)
        ParticleManager:ReleaseParticleIndex(self.particle)
        self.particle = nil
    end
    if self.particle_overhead then
        ParticleManager:DestroyParticle(self.particle_overhead, false)
        ParticleManager:ReleaseParticleIndex(self.particle_overhead)
        self.particle_overhead = nil
    end

    -- 天辉阵营不需要任何特效,直接返回
    if team == DOTA_TEAM_GOODGUYS then
        return
    end

    local particle_name
    local particle_overhead_name

    if team == DOTA_TEAM_BADGUYS then
        particle_name = "particles/units/heroes/hero_bane/bane_nightmare.vpcf"
        particle_overhead_name = "particles/units/heroes/hero_templar_assassin/templar_assassin_refraction.vpcf"
    elseif team == DOTA_TEAM_NEUTRALS then
        particle_overhead_name = "particles/units/heroes/hero_templar_assassin/templar_assassin_refraction.vpcf"
    end

    -- 只在有主特效时创建
    if particle_name then
        self.particle = ParticleManager:CreateParticle(particle_name, PATTACH_ABSORIGIN_FOLLOW, self:GetParent())
        self:AddParticle(self.particle, false, false, -1, false, false)
    end

    -- 只在有头顶特效时创建
    if particle_overhead_name then
        self.particle_overhead = ParticleManager:CreateParticle(particle_overhead_name, PATTACH_OVERHEAD_FOLLOW,
            self:GetParent())
        ParticleManager:SetParticleControlEnt(
            self.particle_overhead,
            0,
            self:GetParent(),
            PATTACH_POINT_FOLLOW,
            "attach_hitloc",
            self:GetParent():GetOrigin(),
            true
        )
        self:AddParticle(self.particle_overhead, false, false, -1, false, false)
    end
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
        MODIFIER_PROPERTY_DISABLE_TELEPORT,
        MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE, -- 添加减伤属性
    }
end

function modifier_defection:GetDisableTeleport()
    if self:GetParent():GetTeam() == DOTA_TEAM_NEUTRALS then
        return 1
    end
    return 0
end

-- 新增: 减伤效果
function modifier_defection:GetModifierIncomingDamage_Percentage()
    if not IsServer() then return 0 end

    local parent = self:GetParent()
    if parent:GetTeam() == DOTA_TEAM_NEUTRALS then
        return -20 -- 负数表示减伤,20%减伤
    end
    return 0
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
        local attackerPlayerID = attacker:GetPlayerOwnerID()
        if target:GetTeam() == self.originalTeam then
            -- 增加全局击杀计数
            _G.DefectionKillCount = _G.DefectionKillCount or {}
            _G.DefectionKillCount[attackerPlayerID] = (_G.DefectionKillCount[attackerPlayerID] or 0) + 1

            -- 发送击杀提示
            local killCount = _G.DefectionKillCount[attackerPlayerID]
            --GameRules:SendCustomMessage("你已击杀 " .. killCount .. " 名原队友！超过2名将无法切换回人类阵营！", 0, 0)
        end
    end
end

function modifier_defection:CheckState()
    local state = {
        [MODIFIER_STATE_NO_UNIT_COLLISION] = true,
    }

    -- 中立阵营禁用 TP
    -- if IsServer() and self:GetParent():GetTeam() == DOTA_TEAM_NEUTRALS then
    --     state[MODIFIER_STATE_MUTED] = true
    -- end

    return state
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
