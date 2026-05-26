item_skill_reset = class({})

-- 完全跳过洗点的技能：变身中改动等级可能破坏形态切换机制
local SKILL_RESET_BLACKLIST = {
    morphling_replicate = true,
    morphling_morph_replicate = true,
}

-- 强制保留 1 级而非清零的技能：level=0 时会出现冷却异常的攻击触发型被动
-- （ATTACK behavior 的技能由代码自动识别，这里只列被动型例外）
local SKILL_RESET_KEEP_LEVEL_1 = {
    faceless_void_time_lock = true,
    jakiro_double_trouble2 = true,
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
                -- 攻击替代/攻击触发型技能在 level=0 时会出现 0CD bug，保留 1 级
                local keepLevel1 = SKILL_RESET_KEEP_LEVEL_1[name]
                    or bit.band(behavior, DOTA_ABILITY_BEHAVIOR_ATTACK) ~= 0
                if keepLevel1 then
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
