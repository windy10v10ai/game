item_skill_reset = class({})

-- 完全跳过洗点的技能：变身中改动等级可能破坏形态切换机制
local SKILL_RESET_BLACKLIST = {
    morphling_replicate = true,
    morphling_morph_replicate = true,
}

local PASSIVE_MASK = DOTA_ABILITY_BEHAVIOR_PASSIVE + DOTA_ABILITY_BEHAVIOR_ATTACK

local function hasFlag(behavior, mask)
    if type(behavior) ~= "number" then behavior = tonumber(tostring(behavior)) or 0 end
    return bit.band(behavior, mask) ~= 0
end

-- 返回应退还的技能点数；同时按规则把 ability 等级降到 0 或 1
local function resetAbility(ability)
    if not ability then return 0 end
    local level = ability:GetLevel()
    if level <= 0 then return 0 end
    if ability:GetMaxLevel() <= 1 then return 0 end
    local behavior = ability:GetBehavior()
    if hasFlag(behavior, DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE) then return 0 end
    if SKILL_RESET_BLACKLIST[ability:GetAbilityName()] then return 0 end

    -- 被动/攻击触发类技能 level=0 时会出现冷却异常（如智慧之刃、海象神拳 0CD），保留 1 级
    if hasFlag(behavior, PASSIVE_MASK) then
        if level <= 1 then return 0 end
        ability:SetLevel(1)
        return level - 1
    end

    ability:SetLevel(0)
    return level
end

function item_skill_reset:OnSpellStart()
    if not IsServer() then return end

    local caster = self:GetCaster()
    local playerId = caster:GetPlayerOwnerID()
    local steamAccountID = tostring(PlayerResource:GetSteamAccountID(playerId))
    local lotteryStatus = CustomNetTables:GetTableValue("lottery_status", steamAccountID)

    local abilities = {
        caster:GetAbilityByIndex(0),
        caster:GetAbilityByIndex(1),
        caster:GetAbilityByIndex(2),
        caster:GetAbilityByIndex(5),
    }
    if lotteryStatus then
        local lotteryNames = {
            lotteryStatus.activeAbilityName,
            lotteryStatus.passiveAbilityName,
            lotteryStatus.passiveAbilityName2,
        }
        for i = 1, #lotteryNames do
            local name = lotteryNames[i]
            if name then
                table.insert(abilities, caster:FindAbilityByName(name))
            end
        end
    end

    local totalPoints = 0
    for _, ability in ipairs(abilities) do
        totalPoints = totalPoints + resetAbility(ability)
    end

    if totalPoints > 0 then
        caster:SetAbilityPoints(caster:GetAbilityPoints() + totalPoints)
    end

    self:SpendCharge(1)
    if self:GetCurrentCharges() == 0 then
        self:RemoveSelf()
    end
end
