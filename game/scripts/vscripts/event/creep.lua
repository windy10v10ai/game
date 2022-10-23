
-- 小兵金钱随时间增加
function AIGameMode:GetLaneGoldMul()
    local time = GameRules:GetDOTATime(false, false)
    local mul = 1
    if time <= 15 * 60 then
        mul = 1
    else
        mul = math.floor(time / 900)
    end
    -- 60分钟封顶
    mul = math.min(mul, 4)
    return mul
end
