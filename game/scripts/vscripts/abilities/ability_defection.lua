ability_defection = class({})

function ability_defection:OnSpellStart()
    if not IsServer() then return end

    local caster = self:GetCaster()
    local playerID = caster:GetPlayerOwnerID()

    -- 初始化全局表
    _G.DefectionTeamState = _G.DefectionTeamState or {}
    _G.DefectionOriginalTeam = _G.DefectionOriginalTeam or {}

    -- 第一次使用时保存原始阵营
    if not _G.DefectionOriginalTeam[playerID] then
        _G.DefectionOriginalTeam[playerID] = caster:GetTeam()
    end

    -- 获取当前阵营状态
    local currentTeam = _G.DefectionTeamState[playerID] or caster:GetTeam()

    -- 定义阵营切换顺序
    local teamCycle = {
        [DOTA_TEAM_GOODGUYS] = DOTA_TEAM_BADGUYS,
        [DOTA_TEAM_BADGUYS] = DOTA_TEAM_NEUTRALS,
        [DOTA_TEAM_NEUTRALS] = DOTA_TEAM_GOODGUYS,
    }

    -- 获取下一个阵营
    local newTeam = teamCycle[currentTeam]
    if not newTeam then
        newTeam = DOTA_TEAM_BADGUYS
    end

    --print("[Defection] Switching from " .. currentTeam .. " to " .. newTeam)

    -- 切换阵营
    caster:SetTeam(newTeam)

    -- 保存新状态
    _G.DefectionTeamState[playerID] = newTeam

    -- 移除旧的 modifier(如果存在)
    caster:RemoveModifierByName("modifier_defection")

    -- 添加新的 modifier
    caster:AddNewModifier(caster, self, "modifier_defection", {})
end
