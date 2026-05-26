item_skill_reset = class({})

-- 完全跳过洗点的技能：变身中改动等级可能破坏形态切换机制
local SKILL_RESET_BLACKLIST = {
    morphling_replicate = true,
    morphling_morph_replicate = true,
}

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
        if ability then
            local level = ability:GetLevel()
            local maxLevel = ability:GetMaxLevel()
            local behavior = ability:GetBehavior()
            if type(behavior) ~= "number" then behavior = tonumber(tostring(behavior)) or 0 end
            local name = ability:GetAbilityName()
            if level > 0 and maxLevel > 1 and bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE) == 0
                and not SKILL_RESET_BLACKLIST[name] then
                -- 被动技能 level=0 时会出现冷却异常等 bug（如智慧之刃、海象神拳 0CD），保留 1 级
                local isPassive = bit.band(behavior, DOTA_ABILITY_BEHAVIOR_PASSIVE) ~= 0
                    or bit.band(behavior, DOTA_ABILITY_BEHAVIOR_ATTACK) ~= 0
                if isPassive then
                    if level > 1 then
                        totalPoints = totalPoints + level - 1
                        ability:SetLevel(1)
                    end
                else
                    totalPoints = totalPoints + level
                    ability:SetLevel(0)
                end
            end
        end
    end

    if totalPoints > 0 then
        caster:SetAbilityPoints(caster:GetAbilityPoints() + totalPoints)
    end

    self:SpendCharge(1)
    if self:GetCurrentCharges() == 0 then
        self:RemoveSelf()
    end
end
