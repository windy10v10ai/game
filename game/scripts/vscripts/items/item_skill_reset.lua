item_skill_reset = class({})

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
            if level > 0 and maxLevel > 1 and bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE) == 0 then
                totalPoints = totalPoints + level
                ability:SetLevel(0)
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
