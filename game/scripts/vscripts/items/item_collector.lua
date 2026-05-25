-- 收纳符（item_collector）：一次性整理地上掉落物品到固定区域，并清理摆放区树木。
-- 来源参考：tenvten-0508 item_collector.lua，已裁剪掉 AutoCollector 自动启动与 5 分钟定时逻辑。

local origin = Vector(-5820, -6580, 384)

-- 记录当前已占用的最大 x 坐标，给 ClearItemAreasTrees 做范围参考
local max_item_x = nil

function OnSpellStart(event)
    local caster = event.caster
    CollectItems()
    ClearItemAreasTrees()
    local item = caster:FindItemInInventory("item_collector")
    if item then
        item:SpendCharge(1)
    end
end

function CollectItems()
    -- 查找所有地上的物品
    local items = Entities:FindAllByClassname("dota_item_drop")

    -- 按拥有者分组的物品存储
    local player_items = {}  -- 玩家物品组 [playerID] = {fusion, special, equipment}
    local unowned_items = {} -- 无主物品组 {fusion, special, equipment}
    local dragon_balls = {}  -- 龙珠单独存储

    unowned_items.fusion = {}
    unowned_items.special = {}
    unowned_items.equipment = {}

    -- 分类和分组物品
    for _, item_physical in pairs(items) do
        local item = item_physical:GetContainedItem()
        if item then
            local item_name = item:GetName()
            local owner = item:GetOwner()
            local player_id = nil

            if owner and owner:IsRealHero() then
                player_id = owner:GetPlayerOwnerID()
                local team = owner:GetTeam()
                -- 夜魇（bot）的物品视为无主，统一摆到无主区
                if team == DOTA_TEAM_BADGUYS then
                    player_id = nil
                end
            end

            local category = nil
            if string.find(item_name, "dragon_ball") then
                table.insert(dragon_balls, item_physical)
            elseif string.find(item_name, "fusion") then
                category = "fusion"
            elseif string.find(item_name, "rune_transmuter") or
                string.find(item_name, "skill_talisman") or
                string.find(item_name, "skill_learning") or
                string.find(item_name, "ability_replacer") or
                string.find(item_name, "scroll_guardian_angel") or
                string.find(item_name, "item_zhuque") or
                string.find(item_name, "item_baihu") or
                string.find(item_name, "item_xuanwu") or
                string.find(item_name, "item_qinglong") then
                category = "special"
            else
                category = "equipment"
            end

            if category then
                if player_id then
                    if not player_items[player_id] then
                        player_items[player_id] = {
                            fusion = {},
                            special = {},
                            equipment = {}
                        }
                    end
                    table.insert(player_items[player_id][category], item_physical)
                else
                    table.insert(unowned_items[category], item_physical)
                end
            end
        end
    end

    table.sort(dragon_balls, function(a, b)
        local item_a = a:GetContainedItem()
        local item_b = b:GetContainedItem()
        if item_a and item_b then
            return item_a:GetName() < item_b:GetName()
        end
        return false
    end)

    for _, items_group in pairs(player_items) do
        table.sort(items_group.fusion, function(a, b)
            return a:GetContainedItem():GetName() < b:GetContainedItem():GetName()
        end)
        table.sort(items_group.special, function(a, b)
            return a:GetContainedItem():GetName() < b:GetContainedItem():GetName()
        end)
        table.sort(items_group.equipment, function(a, b)
            return a:GetContainedItem():GetName() < b:GetContainedItem():GetName()
        end)
    end

    table.sort(unowned_items.fusion, function(a, b)
        return a:GetContainedItem():GetName() < b:GetContainedItem():GetName()
    end)
    table.sort(unowned_items.special, function(a, b)
        return a:GetContainedItem():GetName() < b:GetContainedItem():GetName()
    end)
    table.sort(unowned_items.equipment, function(a, b)
        return a:GetContainedItem():GetName() < b:GetContainedItem():GetName()
    end)

    if #dragon_balls > 0 then
        local dragon_ball_origin = Vector(origin.x, origin.y, origin.z)
        ArrangeDragonBalls(dragon_balls, dragon_ball_origin)
    end

    -- 动态排列：根据每个玩家的实际宽度计算间距
    local current_x = origin.x
    local player_gap = 200

    for player_id, items_group in pairs(player_items) do
        local player_origin = Vector(current_x, origin.y, origin.z)
        local player_max_items = math.max(
            #items_group.fusion,
            #items_group.special,
            #items_group.equipment
        )
        ArrangePlayerItems(items_group, player_origin, player_max_items, player_id)
        current_x = current_x + (player_max_items * 100) + player_gap
    end

    local unowned_max = math.max(
        #unowned_items.fusion,
        #unowned_items.special,
        #unowned_items.equipment
    )
    local unowned_origin = Vector(current_x, origin.y, origin.z)
    ArrangePlayerItems(unowned_items, unowned_origin, unowned_max, nil)

    current_x = current_x + (unowned_max * 100)
    max_item_x = current_x
end

function ArrangeDragonBalls(dragon_balls, origin)
    local start_x = origin.x + 150
    local y_offset = origin.y - 100
    local x_spacing = 100

    for i, item_physical in pairs(dragon_balls) do
        local new_pos = Vector(start_x + ((i - 1) * x_spacing), y_offset, origin.z - 130)
        item_physical:SetAbsOrigin(new_pos)
    end
end

function ArrangePlayerItems(items_group, origin, max_items_per_row, player_id)
    local start_x = origin.x + 50
    local y_offset_base = origin.y - 200
    local x_spacing = 100
    local y_spacing = 100

    local categories = { "fusion", "special", "equipment" }
    for i, category in ipairs(categories) do
        local items = items_group[category]
        local y_offset = y_offset_base - ((i - 1) * y_spacing)

        for j, item_physical in pairs(items) do
            local new_pos = Vector(start_x + (j * x_spacing), y_offset, origin.z - 130)
            item_physical:SetAbsOrigin(new_pos)
        end
    end
end

function ClearItemAreasTrees()
    local max_coverage_x = max_item_x or (origin.x + 500)

    for row = 0, 3 do
        local y_offset = origin.y - 100 - (row * 100)
        for x = origin.x + 100, max_coverage_x + 100, 100 do
            local clear_pos = Vector(x, y_offset, origin.z - 130)
            GridNav:DestroyTreesAroundPoint(clear_pos, 100, true)
        end
    end
end
