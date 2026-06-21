if item_swift_glove == nil then item_swift_glove = class({}) end
LinkLuaModifier("modifier_item_swift_glove", "items/item_swift_glove.lua", LUA_MODIFIER_MOTION_NONE)

function item_swift_glove:GetIntrinsicModifierName()
    return "modifier_item_swift_glove"
end

-- 自定义 CastFilterResultTarget 会绕过 KV 的 AbilityUnitTargetTeam/Type/Flags 自动过滤，
-- 必须用 UnitFilter 手动复刻一遍，否则会变成可以对友军释放
function item_swift_glove:CastFilterResultTarget(target)
    local nResult = UnitFilter(target, self:GetAbilityTargetTeam(), self:GetAbilityTargetType(),
        self:GetAbilityTargetFlags(), self:GetCaster():GetTeamNumber())
    if nResult ~= UF_SUCCESS then
        return nResult
    end

    -- 允许对远古生物释放，但排除肉山和建筑
    if target:GetUnitName() == "npc_dota_roshan" then
        return UF_FAIL_CUSTOM
    end
    if target:IsBuilding() then
        return UF_FAIL_CUSTOM
    end
    return UF_SUCCESS
end

function item_swift_glove:GetCustomCastErrorTarget(target)
    if target:GetUnitName() == "npc_dota_roshan" then
        return "#dota_hud_error_swift_glove_no_roshan"
    end
    if target:IsBuilding() then
        return "#dota_hud_error_swift_glove_no_building"
    end
    return ""
end

local function SpendSwiftGloveCharge(caster)
    for item_slot = DOTA_ITEM_SLOT_1, DOTA_STASH_SLOT_6 do
        local item = caster:GetItemInSlot(item_slot)
        if item and item:GetName() == "item_swift_glove" then
            item:SpendCharge(1)
        end
    end
end

-- 继承自团队之手的主动技能：点石成金
function item_swift_glove:OnSpellStart()
    local caster = self:GetCaster()
    local target = self:GetCursorTarget()

    -- 对英雄目标按 hero_kill_chance 概率失败，给逃过一劫的目标和施法者反馈，避免毫无手感
    if target:IsHero() and not RollPercentage(self:GetSpecialValueFor("hero_kill_chance")) then
        target:EmitSound("DOTA_Item.LinkensSphere.Activate")
        SendOverheadEventMessage(caster, OVERHEAD_ALERT_MISS, target, 0, caster)
        SpendSwiftGloveCharge(caster)
        return
    end

    local target_pos = target:GetAbsOrigin()
    local self_xp = self:GetSpecialValueFor("self_xp")
    local self_gold = self:GetSpecialValueFor("self_gold")
    local group_xp = self:GetSpecialValueFor("group_xp")
    local group_gold = self:GetSpecialValueFor("group_gold")
    local caster_playerid = -1

    if caster then
        caster_playerid = caster:GetPlayerOwnerID()
    end

    local pfx = ParticleManager:CreateParticle("particles/items2_fx/hand_of_midas.vpcf", PATTACH_ABSORIGIN, target)
    ParticleManager:SetParticleControl(pfx, 0, target_pos)
    ParticleManager:SetParticleControl(pfx, 1, target_pos)
    ParticleManager:ReleaseParticleIndex(pfx)

    target:Kill(self, caster) -- 使用 Kill() 而不是 ForceKill()
    caster:EmitSound("DOTA_Item.Hand_Of_Midas")
    caster:ModifyGoldFiltered(self_gold, true, DOTA_ModifyGold_CreepKill)
    if not caster:IsTempestDouble() then
        caster:AddExperience(target:GetDeathXP() * self_xp * AIGameMode:GetPlayerGoldXpMultiplier(caster_playerid),
            DOTA_ModifyXP_CreepKill, false, false)
    else
        -- 风暴双雄克隆体不获得经验
        print("TempestDouble does not gain swift glove experience")
    end
    SendOverheadEventMessage(caster, OVERHEAD_ALERT_GOLD, target,
        self_gold * AIGameMode:GetPlayerGoldXpMultiplier(caster_playerid), caster)

    -- 团队增益
    local playerId = caster:GetPlayerOwnerID()
    local team = caster:GetTeamNumber()
    local self_pos = caster:GetAbsOrigin()
    local all = FindUnitsInRadius(team, self_pos, nil, self:GetSpecialValueFor("group_range"),
        DOTA_UNIT_TARGET_TEAM_FRIENDLY,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS,
        FIND_ANY_ORDER, false)
    for _, teammate in pairs(all) do
        if teammate:GetPlayerOwnerID() ~= playerId and teammate:IsRealHero() and not teammate:IsTempestDouble() then
            local teammate_playerid = teammate:GetPlayerOwnerID()
            teammate:EmitSound("DOTA_Item.Hand_Of_Midas")
            teammate:ModifyGoldFiltered(group_gold, true, DOTA_ModifyGold_CreepKill)
            teammate:AddExperience(
                target:GetDeathXP() * group_xp * AIGameMode:GetPlayerGoldXpMultiplier(teammate_playerid),
                DOTA_ModifyXP_CreepKill, false, false)
            SendOverheadEventMessage(teammate, OVERHEAD_ALERT_GOLD, teammate,
                group_gold * AIGameMode:GetPlayerGoldXpMultiplier(teammate_playerid), caster)
        end
    end

    SpendSwiftGloveCharge(caster)
end

if modifier_item_swift_glove == nil then modifier_item_swift_glove = class({}) end

function modifier_item_swift_glove:IsHidden() return true end

function modifier_item_swift_glove:IsPurgable() return false end

function modifier_item_swift_glove:RemoveOnDeath() return false end

function modifier_item_swift_glove:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_swift_glove:OnCreated(params)
    self:OnRefresh(params)

    local ability = self:GetAbility()
    self.bat_reduction_pct = ability:GetSpecialValueFor("bat_reduction_pct")

    if IsServer() then
        -- 同步多把无限手套的充能点数
        local caster = self:GetCaster()
        for item_slot = DOTA_ITEM_SLOT_1, DOTA_STASH_SLOT_6 do
            local item = caster:GetItemInSlot(item_slot)
            if item and item:GetName() == "item_swift_glove" then
                local charges = item:GetCurrentCharges()
                if charges < ability:GetCurrentCharges() then
                    ability:SetCurrentCharges(charges)
                end
            end
        end
    end
end

function modifier_item_swift_glove:OnRefresh(params)
    self.stats_modifier_name = "modifier_item_swift_glove_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_swift_glove:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_swift_glove:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
    }
end

function modifier_item_swift_glove:GetModifierBaseAttackTimeConstant()
    if self.bat_check ~= true then
        self.bat_check = true
        local parent = self:GetParent()
        local current_bat = parent:GetBaseAttackTime()

        -- 手动计算百分比减少
        local bat_reduction_pct = self.bat_reduction_pct
        local new_bat = current_bat * (1 - bat_reduction_pct / 100)

        self.bat_check = false
        return new_bat
    end
end

-- 在 modifier_item_swift_glove 中添加
function modifier_item_swift_glove:GetPriority()
    return MODIFIER_PRIORITY_HIGH -- 比鹰眼炮台更高的优先级
end
