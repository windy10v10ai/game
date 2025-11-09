-- 添加全局函数用于技能调试
function OnSpellStart(keys)
    local caster = keys.caster
    local target = keys.target
    local ability = keys.ability

    --print("[MindControl] OnSpellStart called")
    --print("[MindControl] Caster: " .. caster:GetUnitName())
    --print("[MindControl] Target: " .. target:GetUnitName())
    --print("[MindControl] Target is hero: " .. tostring(target:IsRealHero()))
    --print("[MindControl] Target is AI: " .. tostring(not IsHumanPlayer(target:GetPlayerOwnerID())))
end

modifier_mind_control = class({})

function modifier_mind_control:IsHidden()
    --print("[MindControl] IsHidden called")
    return false
end

function modifier_mind_control:IsPurgable()
    return false
end

function modifier_mind_control:RemoveOnDeath()
    return true
end

function modifier_mind_control:IsDebuff()
    return true
end

-- *** 新增: 声明需要的属性函数 ***
function modifier_mind_control:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
        MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
    }
end

-- *** 新增: 减伤效果 ***
function modifier_mind_control:GetModifierIncomingDamage_Percentage()
    local reduction = -90 -- 默认值
    if self:GetAbility() then
        reduction = self:GetAbility():GetSpecialValueFor("damage_reduction")
    end
    --print("[MindControl] GetModifierIncomingDamage_Percentage called, returning: " .. reduction)
    return reduction
end

-- *** 新增: 状态抗性效果 ***
function modifier_mind_control:GetModifierStatusResistanceStacking()
    local resistance = -90 -- 默认值
    if self:GetAbility() then
        resistance = self:GetAbility():GetSpecialValueFor("status_resistance")
    end
    --print("[MindControl] GetModifierStatusResistanceStacking called, returning: " .. resistance)
    return resistance -- 默认值
end

function modifier_mind_control:OnCreated(params)
    if not IsServer() then return end

    local parent = self:GetParent()
    local caster = self:GetCaster()
    -- 获取原始持续时间(不受状态抗性影响)
    local duration = self:GetAbility():GetSpecialValueFor("duration")
    -- 保存原始信息
    self.originalPlayerID = parent:GetPlayerOwnerID()
    self.originalTeam = parent:GetTeam()
    self.controllerPlayerID = caster:GetPlayerOwnerID()
    self.controllerTeam = caster:GetTeam() -- 保存控制者的队伍
    self.originalDayVision = parent:GetDayTimeVisionRange()
    self.originalNightVision = parent:GetNightTimeVisionRange()

    print("[MindControl] Original player ID: " .. tostring(self.originalPlayerID))
    print("[MindControl] Controller player ID: " .. tostring(self.controllerPlayerID))
    print("[MindControl] Original team: " .. tostring(self.originalTeam))
    print("[MindControl] Controller team: " .. tostring(self.controllerTeam))

    -- 只对AI英雄生效
    if not parent:IsRealHero() or IsHumanPlayer(parent:GetPlayerOwnerID()) then
        self:Destroy()
        return
    end

    -- 禁用AI系统
    self:DisableAI(parent)

    -- 限制视野
    parent:SetDayTimeVisionRange(400)
    parent:SetNightTimeVisionRange(400)

    -- *** 关键修复 1: 先改变队伍归属 ***
    parent:SetTeam(self.controllerTeam)
    --print("[MindControl] Changed team to: " .. tostring(self.controllerTeam))

    -- *** 关键修复 2: 改变所有者以共享视野 ***
    parent:SetPlayerID(self.controllerPlayerID)
    --print("[MindControl] New owner after SetPlayerID: " .. tostring(parent:GetPlayerOwnerID()))

    -- 转移控制权
    parent:SetControllableByPlayer(self.controllerPlayerID, true)

    -- 添加粒子效果
    local particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_templar_assassin/templar_assassin_refraction.vpcf",
        PATTACH_OVERHEAD_FOLLOW,
        parent
    )
    self:AddParticle(particle, false, false, -1, false, false)

    -- *** 修复: 使用延迟来确保物品在正确的时机被激活 ***
    Timers:CreateTimer(0.1, function()
        if not parent or parent:IsNull() then return end

        for i = 0, 8 do
            local item = parent:GetItemInSlot(i)
            if item then
                item:SetActivated(true)
                print("[MindControl] Activated item in slot " .. i .. ": " .. item:GetAbilityName())
            end
        end
    end)
    -- 启动周期性检查
    self:StartIntervalThink(0.5)
    -- 设置一个定时器来在指定时间后移除modifier
    Timers:CreateTimer(duration, function()
        if not self:IsNull() then
            self:Destroy()
        end
    end)
end

function modifier_mind_control:OnIntervalThink()
    if not IsServer() then return end

    local parent = self:GetParent()
    if not parent or parent:IsNull() then return end

    -- 确保所有物品保持激活状态
    for i = 0, 8 do
        local item = parent:GetItemInSlot(i)
        if item and not item:IsActivated() then
            item:SetActivated(true)
            print("[MindControl] Re-activated item: " .. item:GetAbilityName())
        end
    end
end

function modifier_mind_control:OnDestroy()
    if not IsServer() then return end

    local parent = self:GetParent()
    if not parent or parent:IsNull() then return end

    --print("[MindControl] Restoring control for: " .. parent:GetUnitName())

    -- 强制停止当前动作
    parent:Stop()

    -- 恢复视野
    parent:SetDayTimeVisionRange(self.originalDayVision or 1800)
    parent:SetNightTimeVisionRange(self.originalNightVision or 800)

    -- *** 关键修复: 先恢复队伍归属 ***
    parent:SetTeam(self.originalTeam)
    --print("[MindControl] Restored team to: " .. tostring(self.originalTeam))

    -- 恢复所有者
    parent:SetPlayerID(self.originalPlayerID)
    --print("[MindControl] Restored owner: " .. tostring(parent:GetPlayerOwnerID()))

    -- 恢复控制权
    parent:SetControllableByPlayer(self.originalPlayerID, true)

    -- 重新启用所有物品
    for i = 0, 8 do
        local item = parent:GetItemInSlot(i)
        if item then
            item:SetActivated(true)
        end
    end

    -- 重新启用AI
    --print("[MindControl] Re-enabling AI...")
    self:EnableAI(parent)

    --print("[MindControl] OnDestroy completed")
end

function modifier_mind_control:CheckState()
    return {
        [MODIFIER_STATE_DEBUFF_IMMUNE] = true, -- 减益免疫
    }
end

function modifier_mind_control:DisableAI(hero)
    --print("[MindControl] DisableAI called")

    -- 保存所有 AI modifiers 的状态
    self.removedModifiers = {}

    -- 移除Lua AI modifiers
    local luaModifiers = {
        --"modifier_bot_think_item_use",
        "modifier_bot_think_strategy",
        "modifier_bot_think_ward"
    }

    for _, modName in pairs(luaModifiers) do
        if hero:HasModifier(modName) then
            --print("[MindControl] Removing " .. modName)
            hero:RemoveModifierByName(modName)
            table.insert(self.removedModifiers, modName)
        end
    end

    -- 移除TypeScript AI modifiers
    local tsModifiers = {
        "BotBaseAIModifier",
        "LionAIModifier",
        "ViperAIModifier",
        "LunaAIModifier",
        "SniperAIModifier",
        "MedusaAIModifier",
        "DrowRangerAIModifier",
        "SkeletonAIModifier",
        "ShadowShamanAIModifier"
    }

    for _, modName in pairs(tsModifiers) do
        if hero:HasModifier(modName) then
            --print("[MindControl] Removing TS modifier: " .. modName)
            hero:RemoveModifierByName(modName)
            table.insert(self.removedModifiers, modName)
        end
    end
end

function modifier_mind_control:EnableAI(hero)
    --print("[MindControl] EnableAI called")

    -- 优先使用AI系统的标准启用方法
    if GameRules.AI then
        --print("[MindControl] Using GameRules.AI:EnableAI")
        -- 先移除可能存在的 AI modifier,避免重复
        local tsModifiers = {
            "BotBaseAIModifier",
            "LionAIModifier",
            "ViperAIModifier",
            "LunaAIModifier",
            "SniperAIModifier",
            "MedusaAIModifier",
            "DrowRangerAIModifier",
            "SkeletonAIModifier",
            "ShadowShamanAIModifier"
        }
        for _, modName in pairs(tsModifiers) do
            if hero:HasModifier(modName) then
                hero:RemoveModifierByName(modName)
            end
        end

        GameRules.AI:EnableAI(hero)
    end

    -- 恢复所有保存的 modifiers
    if self.removedModifiers then
        for _, modName in pairs(self.removedModifiers) do
            if not hero:HasModifier(modName) then
                --print("[MindControl] Re-adding " .. modName)
                hero:AddNewModifier(hero, nil, modName, {})
            end
        end
    end
end
