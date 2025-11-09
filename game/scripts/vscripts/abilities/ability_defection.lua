ability_defection = class({})
function ability_defection:OnSpellStart()
    if not IsServer() then return end

    local caster = self:GetCaster()
    local playerID = caster:GetPlayerOwnerID()

    -- 初始化全局表
    _G.DefectionTeamState = _G.DefectionTeamState or {}
    _G.DefectionOriginalTeam = _G.DefectionOriginalTeam or {}
    _G.DefectionKillCount = _G.DefectionKillCount or {}
    _G.DefectionWarningShown = _G.DefectionWarningShown or {} -- 新增:记录是否已显示警告

    -- 第一次使用时保存原始阵营
    if not _G.DefectionOriginalTeam[playerID] then
        _G.DefectionOriginalTeam[playerID] = caster:GetTeam()
    end

    -- 初始化击杀计数
    if not _G.DefectionKillCount[playerID] then
        _G.DefectionKillCount[playerID] = 0
    end

    -- 获取当前阵营状态
    local currentTeam = _G.DefectionTeamState[playerID] or caster:GetTeam()
    local killCount = _G.DefectionKillCount[playerID]
    local newTeam

    -- 根据击杀数量决定切换逻辑
    if killCount > 2 then
        -- 击杀超过2名原队友,只能在中立和夜魇之间切换
        if currentTeam == DOTA_TEAM_NEUTRALS then
            newTeam = DOTA_TEAM_BADGUYS
        elseif currentTeam == DOTA_TEAM_BADGUYS then
            newTeam = DOTA_TEAM_NEUTRALS
        else
            -- 如果当前在天辉,先切换到夜魇
            newTeam = DOTA_TEAM_BADGUYS
        end

        -- 只在第一次显示警告消息
        if not _G.DefectionWarningShown[playerID] then
            GameRules:SendCustomMessage(
            "有人已经被AI蛊惑，他击杀了超过3名人类玩家，将永远无法回归人类阵营! Someone has killed more than 3 human players, he will never return", 0,
                0)
            _G.DefectionWarningShown[playerID] = true -- 标记为已显示
        end
    else
        -- 正常的三阵营循环
        local teamCycle = {
            [DOTA_TEAM_GOODGUYS] = DOTA_TEAM_BADGUYS,
            [DOTA_TEAM_BADGUYS] = DOTA_TEAM_NEUTRALS,
            [DOTA_TEAM_NEUTRALS] = DOTA_TEAM_GOODGUYS,
        }

        newTeam = teamCycle[currentTeam]
        if not newTeam then
            newTeam = DOTA_TEAM_BADGUYS
        end
    end

    -- TP 管理逻辑
    if newTeam == DOTA_TEAM_NEUTRALS then
        self:RemoveTPItems(caster)
        --GameRules:SendCustomMessage("警告:切换到中立阵营会移除TP,请勿购买TP!中立阵营使用TP会导致游戏崩溃!", 0, 0)
    end

    -- 修改后的延迟逻辑:只在从中立切换回天辉时延迟2秒
    if currentTeam == DOTA_TEAM_NEUTRALS and newTeam == DOTA_TEAM_GOODGUYS then
        --GameRules:SendCustomMessage("正在切换回天辉阵营,请等待2秒...", 0, 0)

        Timers:CreateTimer(2.0, function()
            self:RestoreTPItems(caster)
            caster:SetTeam(newTeam)
            _G.DefectionTeamState[playerID] = newTeam
            caster:RemoveModifierByName("modifier_defection")
            caster:AddNewModifier(caster, self, "modifier_defection", {})
            --GameRules:SendCustomMessage("已成功切换回天辉阵营!", 0, 0)
        end)

        return
    end

    -- 从中立切换到夜魇时立即执行(无延迟)
    if currentTeam == DOTA_TEAM_NEUTRALS and newTeam == DOTA_TEAM_BADGUYS then
        self:RestoreTPItems(caster)
    end

    -- 立即切换阵营
    caster:SetTeam(newTeam)
    _G.DefectionTeamState[playerID] = newTeam
    caster:RemoveModifierByName("modifier_defection")
    caster:AddNewModifier(caster, self, "modifier_defection", {})
end

function ability_defection:RemoveTPItems(hero)
    _G.DefectionRemovedTP = _G.DefectionRemovedTP or {}
    local playerID = hero:GetPlayerOwnerID()
    _G.DefectionRemovedTP[playerID] = {}

    -- 检查主物品栏和背包 (0-8)
    for i = 0, 8 do
        local item = hero:GetItemInSlot(i)
        if item then
            local itemName = item:GetAbilityName()
            if itemName == "item_tpscroll" or
                itemName == "item_travel_boots" or
                itemName == "item_travel_boots_2" then
                table.insert(_G.DefectionRemovedTP[playerID], itemName)
                hero:RemoveItem(item)
            end
        end
    end

    -- 检查 TP 专用槽位
    local tpSlotItem = hero:GetItemInSlot(DOTA_ITEM_TP_SCROLL)
    if tpSlotItem then
        local itemName = tpSlotItem:GetAbilityName()
        if itemName == "item_tpscroll" or
            itemName == "item_travel_boots" or
            itemName == "item_travel_boots_2" then
            table.insert(_G.DefectionRemovedTP[playerID], itemName)
            hero:RemoveItem(tpSlotItem)
        end
    end
end

function ability_defection:RestoreTPItems(hero)
    _G.DefectionRemovedTP = _G.DefectionRemovedTP or {}
    local playerID = hero:GetPlayerOwnerID()

    if _G.DefectionRemovedTP[playerID] then
        for _, itemName in pairs(_G.DefectionRemovedTP[playerID]) do
            hero:AddItemByName(itemName)
        end
        _G.DefectionRemovedTP[playerID] = {}
    end
end
