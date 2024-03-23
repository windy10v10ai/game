function OnDragonBallPicked(event)
	local caster = event.caster
	Timers:CreateTimer(0.1, function()
		TryCombinationDragonBall(caster)
	end)
end

function TryCombinationDragonBall(caster)
	local dragon_balls = {
		"item_dragon_ball_1",
		"item_dragon_ball_2",
		"item_dragon_ball_3",
		"item_dragon_ball_4",
		"item_dragon_ball_5",
		"item_dragon_ball_6",
		"item_dragon_ball_7",
	}
	-- if has all dragon balls in slot 0~8, remove all and give item_blessing_of_dragon
	local has_all_dragon_balls = true
	for _, v in pairs(dragon_balls) do
		if not caster:HasItemInInventory(v) then
			has_all_dragon_balls = false
			break
		end
	end
	if has_all_dragon_balls then
		for _, v in pairs(dragon_balls) do
			UTIL_RemoveImmediate(caster:FindItemInInventory(v))
		end
		caster:AddItemByName("item_blessing_of_dragon")
	end
end
