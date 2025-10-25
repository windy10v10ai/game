LinkLuaModifier("modifier_bot_boss_behavior", "bot/bot_boss_behavior", LUA_MODIFIER_MOTION_NONE)

modifier_bot_boss_behavior = class({})

function modifier_bot_boss_behavior:IsHidden()
    return true
end

function modifier_bot_boss_behavior:IsPurgable()
    return false
end

function modifier_bot_boss_behavior:RemoveOnDeath()
    return false
end

function modifier_bot_boss_behavior:OnCreated()
    if not IsServer() then return end

    self.hunt_mode = false
    self.mid_lane_mode = true
    self.target_player = nil

    -- 为Boss装备点金手
    local parent = self:GetParent()
    print(string.format("[BotBoss] Boss %s created at level %d", parent:GetUnitName(), parent:GetLevel()))

    if not parent:HasItemInInventory("item_hand_of_group") then
        parent:AddItemByName("item_hand_of_group")
        print(string.format("[BotBoss] Equipped item_hand_of_group for %s", parent:GetUnitName()))
    end

    self:StartIntervalThink(0.4)
end

function modifier_bot_boss_behavior:OnIntervalThink()
    if not IsServer() then return end

    local parent = self:GetParent()
    local game_time = GameRules:GetGameTime()
    local boss_level = parent:GetLevel()

    -- 前10分钟在中路发育
    if game_time < 600 and self.mid_lane_mode then
        print(string.format("[BotBoss] %s (Lv%d) farming in mid lane (time: %.1fs)",
            parent:GetUnitName(), boss_level, game_time))
        self:FarmInMidLane()
        return
    end

    -- 检查是否需要返回野区发育
    if self:ShouldReturnToFarm() then
        print(string.format("[BotBoss] %s (Lv%d) returning to jungle to farm",
            parent:GetUnitName(), boss_level))
        self:FarmInJungle()
        return
    end

    -- 10分钟后或达到40级,切换到狩猎模式
    if parent:GetLevel() >= 40 then
        if not self.hunt_mode then
            self.hunt_mode = true
            self.mid_lane_mode = false
            print(string.format("[BotBoss] %s reached level 40, entering hunt mode!", parent:GetUnitName()))
        end
        self:FindAndHuntPlayer()
    elseif game_time >= 600 then
        self.mid_lane_mode = false
        print(string.format("[BotBoss] %s (Lv%d) time >= 10min, exiting mid lane mode",
            parent:GetUnitName(), boss_level))
    end
end

-- 检查是否应该返回野区发育
function modifier_bot_boss_behavior:ShouldReturnToFarm()
    local parent = self:GetParent()
    local parent_level = parent:GetLevel()

    -- 找到等级最高的玩家英雄
    local max_player_level = 0
    local max_player_name = "none"
    local player_heroes = HeroList:GetAllHeroes()

    for _, hero in pairs(player_heroes) do
        if hero:IsRealHero()
            and not hero:IsIllusion()
            and hero:IsAlive()
            and PlayerResource:IsValidPlayerID(hero:GetPlayerOwnerID())
            and not PlayerResource:IsFakeClient(hero:GetPlayerOwnerID()) then
            local hero_level = hero:GetLevel()
            if hero_level > max_player_level then
                max_player_level = hero_level
                max_player_name = hero:GetUnitName()
            end
        end
    end

    local should_farm = parent_level < max_player_level
    if should_farm then
        print(string.format("[BotBoss] %s level check: Boss Lv%d < Player %s Lv%d, need to farm",
            parent:GetUnitName(), parent_level, max_player_name, max_player_level))
    end

    return should_farm
end

function modifier_bot_boss_behavior:FarmInJungle()
    local parent = self:GetParent()
    local parent_pos = parent:GetAbsOrigin()

    -- 【修复】使用正确的野区坐标
    local jungle_positions
    -- 夜魇方野区(多个位置随机选择)
    jungle_positions = {
        Vector(6612, 768, 0),
        Vector(3240, 196, 0),
    }
    -- 随机选择一个野区位置
    local jungle_pos = jungle_positions[RandomInt(1, #jungle_positions)]

    print(string.format("[BotBoss] %s farming in jungle at position (%.0f, %.0f)",
        parent:GetUnitName(), jungle_pos.x, jungle_pos.y))

    -- 优先攻击附近的野怪
    local neutrals = FindUnitsInRadius(
        parent:GetTeam(),
        parent_pos,
        nil,
        1500,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE,
        FIND_ANY_ORDER,
        false
    )

    -- 过滤出野怪(排除小兵)
    local jungle_creeps = {}
    for _, unit in pairs(neutrals) do
        if unit:IsNeutralUnitType() then
            table.insert(jungle_creeps, unit)
        end
    end

    if #jungle_creeps > 0 then
        local nearest_creep = jungle_creeps[1]
        print(string.format("[BotBoss] %s attacking jungle creep at distance %.0f",
            parent:GetUnitName(), (nearest_creep:GetAbsOrigin() - parent_pos):Length2D()))

        ExecuteOrderFromTable({
            UnitIndex = parent:entindex(),
            OrderType = DOTA_UNIT_ORDER_ATTACK_TARGET,
            TargetIndex = nearest_creep:entindex(),
            Queue = false
        })
    else
        -- 没有野怪时移动到野区位置
        local distance = (jungle_pos - parent_pos):Length2D()
        print(string.format("[BotBoss] %s moving to jungle position (distance: %.0f)",
            parent:GetUnitName(), distance))

        ExecuteOrderFromTable({
            UnitIndex = parent:entindex(),
            OrderType = DOTA_UNIT_ORDER_MOVE_TO_POSITION,
            Position = jungle_pos,
            Queue = false
        })
    end
end

function modifier_bot_boss_behavior:FarmInMidLane()
    local parent = self:GetParent()
    local parent_pos = parent:GetAbsOrigin()

    -- 中路位置
    local mid_lane_pos

    mid_lane_pos = Vector(300, 300, 0)


    -- 查找附近的所有单位
    local creeps = FindUnitsInRadius(
        parent:GetTeam(),
        parent_pos,
        nil,
        1200,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE,
        FIND_CLOSEST,
        false
    )

    -- 【新增】过滤出真正的小兵
    local lane_creeps = {}
    for _, unit in pairs(creeps) do
        if unit and not unit:IsNull() then
            local unit_name = unit:GetUnitName()
            -- 只选择名称包含 "npc_dota_creep_" 的单位,排除野怪
            if string.find(unit_name, "npc_dota_creep_") and not unit:IsNeutralUnitType() then
                table.insert(lane_creeps, unit)
            end
        end
    end

    local nearest_creep = lane_creeps[1]

    if nearest_creep then
        print(string.format("[BotBoss] %s found %d mid lane creeps, attacking %s (distance: %.0f)",
            parent:GetUnitName(), #lane_creeps, nearest_creep:GetUnitName(),
            (nearest_creep:GetAbsOrigin() - parent_pos):Length2D()))

        ExecuteOrderFromTable({
            UnitIndex = parent:entindex(),
            OrderType = DOTA_UNIT_ORDER_ATTACK_TARGET,
            TargetIndex = nearest_creep:entindex(),
            Queue = false
        })
    else
        -- 没有小兵时移动到中路位置
        local distance = (mid_lane_pos - parent_pos):Length2D()
        print(string.format("[BotBoss] %s no mid lane creeps, moving to mid (distance: %.0f)",
            parent:GetUnitName(), distance))

        ExecuteOrderFromTable({
            UnitIndex = parent:entindex(),
            OrderType = DOTA_UNIT_ORDER_MOVE_TO_POSITION,
            Position = mid_lane_pos,
            Queue = false
        })
    end
end

function modifier_bot_boss_behavior:FindAndHuntPlayer()
    local parent = self:GetParent()

    if self.target_player and not self.target_player:IsNull() and self.target_player:IsAlive() then
        local distance = (self.target_player:GetAbsOrigin() - parent:GetAbsOrigin()):Length2D()
        print(string.format("[BotBoss] %s continuing to hunt %s (distance: %.0f)",
            parent:GetUnitName(), self.target_player:GetUnitName(), distance))
        self:HuntTarget(self.target_player)
        return
    end

    local player_heroes = HeroList:GetAllHeroes()
    local closest_player = nil
    local closest_distance = 999999
    local player_count = 0

    for _, hero in pairs(player_heroes) do
        if hero:GetTeamNumber() ~= parent:GetTeamNumber()
            and hero:IsRealHero()
            and not hero:IsIllusion()
            and hero:IsAlive()
            and PlayerResource:IsValidPlayerID(hero:GetPlayerOwnerID())
            and not PlayerResource:IsFakeClient(hero:GetPlayerOwnerID()) then
            player_count = player_count + 1
            local distance = (hero:GetAbsOrigin() - parent:GetAbsOrigin()):Length2D()
            if distance < closest_distance then
                closest_distance = distance
                closest_player = hero
            end
        end
    end

    if closest_player then
        self.target_player = closest_player
        print(string.format("[BotBoss] %s found %d enemy players, targeting %s (distance: %.0f)",
            parent:GetUnitName(), player_count, closest_player:GetUnitName(), closest_distance))
        self:HuntTarget(closest_player)
    else
        print(string.format("[BotBoss] %s no enemy players found to hunt", parent:GetUnitName()))
    end
end

function modifier_bot_boss_behavior:HuntTarget(target)
    local parent = self:GetParent()
    local distance = (target:GetAbsOrigin() - parent:GetAbsOrigin()):Length2D()

    if distance > 1000 then
        print(string.format("[BotBoss] %s chasing %s (distance: %.0f > 1000)",
            parent:GetUnitName(), target:GetUnitName(), distance))
        parent:MoveToTargetToAttack(target)
    else
        print(string.format("[BotBoss] %s attacking %s (distance: %.0f <= 1000)",
            parent:GetUnitName(), target:GetUnitName(), distance))
        ExecuteOrderFromTable({
            UnitIndex = parent:entindex(),
            OrderType = DOTA_UNIT_ORDER_ATTACK_TARGET,
            TargetIndex = target:entindex(),
            Queue = false
        })
    end
end
